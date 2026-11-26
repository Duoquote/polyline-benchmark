// Fast paths for runtimes with Node's Buffer: Node and Bun. Each choice here
// was measured with the benchmark fixtures (see "Platform notes" in the
// README):
//
// - Decode copies the string into a scratch buffer with `ucs2Write` and
//   parses the Uint16Array. On V8, charCodeAt in a hot loop re-checks the
//   string representation on every call, and the copy is close to a memcpy.
//   `latin1Write` is a bit faster but keeps only the low byte, so U+0151
//   would turn into a valid "Q". UTF-16 keeps strict mode exact.
// - The decoder counts the points first (two characters per step, through
//   a Uint32Array view), so the output array is allocated at its exact size.
//   Growing it with push, or trimming an oversized one, both measured slower.
// - Encode writes bytes into a scratch buffer and makes the string with one
//   `latin1Slice` call. That was 2 to 4 times faster than building the string
//   with += on both V8 and JavaScriptCore, and the result is a flat string.
// - The character loops branch on "is there another chunk". A branchless
//   version was faster on the real-world lines, where 1 and 2 character
//   values alternate at random, but slower on the GPS tracks, where they come
//   in runs the branch predictor learns. Branchy won 5 of the 6 columns.
// - Strings under 64 characters skip the copy and use the core's loop.
import { opts, st, LIMIT, slowDecode, slowEncode, decodeLoop, flip } from './core.js';

// Scratch memory is reused between calls up to this size. Bigger inputs get
// a temporary buffer, so one huge line doesn't pin megabytes for good.
const KEEP = 1 << 20;

export function fast(Buffer) {
  const ucs2Write = Buffer.prototype.ucs2Write, latin1Slice = Buffer.prototype.latin1Slice;
  // The kept scratch buffer and its views. allocUnsafeSlow gives each buffer
  // its own ArrayBuffer at offset 0, so the wider views are aligned.
  let kept, k16, k32, u16;
  const views = (buf) => [buf, new Uint16Array(buf.buffer, 0, buf.length >> 1), new Uint32Array(buf.buffer, 0, buf.length >> 2)];
  [kept, k16, k32] = views(Buffer.allocUnsafeSlow(1 << 14));
  const scratch = (bytes) => (bytes <= kept.length ? kept : bytes <= KEEP ? ([kept, k16, k32] = views(Buffer.allocUnsafeSlow(bytes)))[0] : Buffer.allocUnsafeSlow(bytes));

  // Copies str into scratch as UTF-16, points u16 at it, and returns the
  // number of values.
  function load(str, len) {
    const buf = scratch((len + 4) * 2 + 8);
    ucs2Write.call(buf, str, 0);
    let u32 = k32;
    if (buf == kept) u16 = k16;
    else [, u16, u32] = views(buf);
    // Padding: '?' is a complete zero value, so a truncated string stops
    // inside the buffer and leaves the index past len.
    u16[len] = u16[len + 1] = u16[len + 2] = 63;
    // Every value ends with one character below code 95. Count the others,
    // which have bit 5 set after adding 1, two characters per word.
    let more = 0;
    for (let k = 0, w = (len + 1) >> 1; k < w; k++) {
      const y = ((u32[k] + 0x10001) >>> 5) & 0x10001;
      more += (y & 0xffff) + (y >>> 16);
    }
    return len - more;
  }

  // decodeLoop over the UTF-16 copy, with an exactly sized output. Returns
  // null for slowDecode. Tuples and flat output are separate loops here: one
  // shared loop with a per-point branch measured about 20% slower on
  // JavaScriptCore at 10,000 points.
  function big(str, f) {
    const len = str.length, want = load(str, len) >> 1, b = u16, out = Array(want);
    let i = 0, n = 0, lat = 0, lng = 0, bad = 0, c, v, s;
    while (i < len) {
      c = b[i++] - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = b[i++] - 63;
        bad |= c | (25 - s);
        v |= (c & 31) << s;
      }
      lat += (v >>> 1) ^ -(v & 1);
      c = b[i++] - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = b[i++] - 63;
        bad |= c | (25 - s);
        v |= (c & 31) << s;
      }
      lng += (v >>> 1) ^ -(v & 1);
      out[n++] = [lat / f, lng / f];
    }
    // The count is exact for valid input, and invalid input stops here.
    return bad & ~63 || i != len ? null : out;
  }

  function bigFlat(str, f, sw) {
    const len = str.length, out = new Float64Array(load(str, len) & ~1), b = u16, a = +sw;
    let i = 0, n = 0, lat = 0, lng = 0, bad = 0, c, v, s;
    while (i < len) {
      c = b[i++] - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = b[i++] - 63;
        bad |= c | (25 - s);
        v |= (c & 31) << s;
      }
      lat += (v >>> 1) ^ -(v & 1);
      c = b[i++] - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = b[i++] - 63;
        bad |= c | (25 - s);
        v |= (c & 31) << s;
      }
      lng += (v >>> 1) ^ -(v & 1);
      out[n + a] = lat / f;
      out[n + 1 - a] = lng / f;
      n += 2;
    }
    return bad & ~63 || i != len ? null : out;
  }

  const decodeWith = (str, o, flat) => {
    const f = opts(o);
    if (st.dims != 2 || typeof str != 'string') return slowDecode(str, f, flat);
    const out = str.length < 64 ? decodeLoop(str, f, st.swap, flat) : flat ? bigFlat(str, f, st.swap) : big(str, f);
    return out ? (st.swap && !flat ? flip(out) : out) : slowDecode(str, f, flat);
  };

  // Writes bytes into scratch, 7 per value at most below LIMIT. Returns null
  // for slowEncode.
  function encodeLoop(src, f, a, flat) {
    const n = flat ? src.length >> 1 : src.length, buf = scratch(n * 14 + 8);
    let i = 0, k = 0, la = 0, lb = 0, x, y, p, q, z, pt;
    try {
      for (; i < n; i++) {
        if (flat) {
          x = src[i * 2 + a];
          y = src[i * 2 + 1 - a];
        } else {
          pt = src[i];
          x = pt[a];
          y = pt[1 - a];
        }
        if (typeof x != 'number' || typeof y != 'number' || !((x *= f) < LIMIT && x > -LIMIT && (y *= f) < LIMIT && y > -LIMIT)) return null;
        // Round half away from zero. floor(|x| + 0.5) is exact here except for
        // |x| = 0.49999999999999994, where the addition rounds up to 1, so any
        // |x| < 0.5 is set to 0 afterwards. Math.round would be exact on its own,
        // but it measured 40% slower on JavaScriptCore.
        p = x < 0 ? -((0.5 - x) | 0) : (x + 0.5) | 0;
        q = y < 0 ? -((0.5 - y) | 0) : (y + 0.5) | 0;
        if (x < 0.5 && x > -0.5) p = 0;
        if (y < 0.5 && y > -0.5) q = 0;
        z = p - la;
        z = (z << 1) ^ (z >> 31);
        for (; z >= 32; z >>>= 5) buf[k++] = (z & 31) + 95;
        buf[k++] = z + 63;
        z = q - lb;
        z = (z << 1) ^ (z >> 31);
        for (; z >= 32; z >>>= 5) buf[k++] = (z & 31) + 95;
        buf[k++] = z + 63;
        la = p;
        lb = q;
      }
    } catch {
      return null;
    }
    return latin1Slice.call(buf, 0, k);
  }

  const encodeWith = (src, o, flat) => {
    const f = opts(o);
    return (st.dims == 2 && f <= 1e6 && (flat ? src != null && !(src.length % 2) : Array.isArray(src)) ? encodeLoop(src, f, +st.swap, flat) : null) ?? slowEncode(src, f, flat);
  };

  return {
    decode: (str, o) => decodeWith(str, o, 0),
    decodeFlat: (str, o) => decodeWith(str, o, 1),
    encode: (src, o) => encodeWith(src, o, 0),
    encodeFlat: (src, o) => encodeWith(src, o, 1),
  };
}
