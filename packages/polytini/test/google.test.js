// The Google Maps helpers against small mocks of google.maps.LatLng and
// google.maps.MVCArray. The Maps JavaScript API is never loaded and no API
// key is used. The mocks follow the documented interfaces: LatLng(lat, lng,
// noClampNoWrap) clamps latitude to [-90, 90] and wraps longitude into
// [-180, 180) unless noClampNoWrap is true; MVCArray has getArray(),
// getLength() and getAt().
import { test, eq, near, ok, throws, json } from './lib.js';
import { decodePath, encodePath, PolylineError } from '../src/google.js';
import { encode, decode, PolylineError as CoreError } from '../src/web.js';

class LatLng {
  constructor(lat, lng, noClampNoWrap) {
    if (!noClampNoWrap) {
      lat = Math.min(90, Math.max(-90, lat));
      if (!(lng >= -180 && lng < 180)) lng = ((((lng + 180) % 360) + 360) % 360) - 180;
    }
    this._lat = lat;
    this._lng = lng;
  }
  lat() {
    return this._lat;
  }
  lng() {
    return this._lng;
  }
  toJSON() {
    return { lat: this._lat, lng: this._lng };
  }
}

class MVCArray {
  constructor(array = []) {
    this._a = array;
  }
  getArray() {
    return this._a;
  }
  getLength() {
    return this._a.length;
  }
  getAt(i) {
    return this._a[i];
  }
  push(x) {
    return this._a.push(x);
  }
}

// Runs fn with globalThis.google set to a mock namespace, then restores it.
const withGoogle = (fn) => {
  const had = 'google' in globalThis, old = globalThis.google;
  globalThis.google = { maps: { LatLng, MVCArray } };
  try {
    return fn();
  } finally {
    if (had) globalThis.google = old;
    else delete globalThis.google;
  }
};

const s = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
const lits = pts.map(([lat, lng]) => ({ lat, lng }));
const lls = pts.map(([lat, lng]) => new LatLng(lat, lng));
const plain = (path) => path.map((p) => (p instanceof LatLng ? p.toJSON() : p));

test('decodePath returns literals without google.maps', () => {
  ok(!globalThis.google?.maps, 'no google.maps in the test runtime');
  const path = decodePath(s);
  eq(path, lits);
  ok(Object.getPrototypeOf(path[0]) === Object.prototype);
});

test('decodePath uses globalThis.google.maps.LatLng when it exists', () => {
  const path = withGoogle(() => decodePath(s));
  ok(path.every((p) => p instanceof LatLng));
  eq(plain(path), lits);
});

test('decodePath LatLng option: a constructor, or false for literals', () => {
  const path = decodePath(s, { LatLng });
  ok(path[0] instanceof LatLng);
  eq(plain(path), lits);
  const literal = withGoogle(() => decodePath(s, { LatLng: false }));
  eq(literal, lits);
  ok(!(literal[0] instanceof LatLng));
  eq(withGoogle(() => decodePath(s, { LatLng: null })), lits);
});

test('decodePath passes noClampNoWrap to the constructor', () => {
  const edge = encode([[0, 180], [90, -180], [-90, 179.99999]]);
  eq(plain(decodePath(edge, { LatLng })), [{ lat: 0, lng: -180 }, { lat: 90, lng: -180 }, { lat: -90, lng: 179.99999 }]);
  eq(plain(decodePath(edge, { LatLng, noClampNoWrap: true })), [{ lat: 0, lng: 180 }, { lat: 90, lng: -180 }, { lat: -90, lng: 179.99999 }]);
  // Literals are never clamped or wrapped.
  eq(decodePath(edge), [{ lat: 0, lng: 180 }, { lat: 90, lng: -180 }, { lat: -90, lng: 179.99999 }]);
});

test('decodePath: empty string, precision and ignored order', () => {
  eq(decodePath(''), []);
  eq(decodePath('', { LatLng }), []);
  const s6 = encode(pts, 6);
  eq(decodePath(s6, 6), lits);
  eq(decodePath(s6, { precision: 6 }), lits);
  // decodePath returns objects, so a lnglat order can't swap anything.
  eq(decodePath(s, { order: 'lnglat' }), lits);
  throws(() => decodePath(s, { order: 'x' }), 'option');
  throws(() => decodePath(s, 16), 'option');
});

test('decodePath is strict by default and switchable', () => {
  const e = throws(() => decodePath(s.slice(0, -1)), 'truncated');
  ok(e instanceof PolylineError && PolylineError === CoreError);
  throws(() => decodePath('_p~iF ~ps|U'), 'char');
  throws(() => decodePath(null), 'input');
  eq(decodePath(s.slice(0, -1), { strict: false }), lits.slice(0, 2));
  eq(decodePath('_p~iF ~ps|U', { strict: false }), [lits[0]]);
  eq(plain(decodePath(s.slice(0, -1), { strict: false, LatLng })), lits.slice(0, 2));
});

test('decodePath drops values past the second with dimensions', () => {
  const s3 = encode([[38.5, -120.2, 10], [40.7, -120.95, 20]], { dimensions: 3 });
  eq(decodePath(s3, { dimensions: 3 }), lits.slice(0, 2));
});

test('encodePath takes LatLng[], LatLngLiteral[], tuples and a mix', () => {
  eq(encodePath(lls), s);
  eq(encodePath(lits), s);
  eq(encodePath(pts), s);
  eq(encodePath([lls[0], lits[1], pts[2]]), s);
  eq(encodePath([]), '');
});

test('encodePath takes an MVCArray of either', () => {
  eq(encodePath(new MVCArray(lls)), s);
  eq(encodePath(new MVCArray(lits)), s);
  eq(encodePath(new MVCArray([lls[0], lits[1], lls[2]])), s);
  eq(encodePath(new MVCArray()), '');
  // getArray() is the live array; encodePath doesn't change it.
  const m = new MVCArray([...lls]);
  encodePath(m);
  ok(m.getArray().every((p, i) => p === lls[i]));
});

test('encodePath: precision and order pass through', () => {
  eq(encodePath(lls, 6), encode(pts, 6));
  eq(encodePath(new MVCArray(lits), { precision: 6 }), encode(pts, 6));
  const swapped = pts.map(([a, b]) => [b, a]);
  // order applies to tuples and LatLng objects; literals are read by name.
  eq(encodePath(swapped, { order: 'lnglat' }), s);
  eq(encodePath([lls[0], swapped[1], lits[2]], { order: 'lnglat' }), s);
});

test('encodePath is strict by default and switchable', () => {
  throws(() => encodePath([lits[0], { lat: NaN, lng: 1 }]), 'coordinate');
  throws(() => encodePath([new LatLng(NaN, 1, true)]), 'coordinate');
  throws(() => encodePath([lits[0], null]), 'coordinate');
  throws(() => encodePath(null), 'input');
  throws(() => encodePath({}), 'input');
  eq(throws(() => encodePath([lls[0], {}, lls[2]])).index, 1);
  eq(encodePath([lits[0], { lat: NaN, lng: NaN }], { strict: false }), encode([pts[0], [0, 0]]));
});

test('encodePath does not clamp or wrap literals', () => {
  eq(decode(encodePath([{ lat: 95, lng: 190 }])), [[95, 190]]);
  // A LatLng clamps and wraps when it is built, so its values encode as is.
  eq(decode(encodePath([new LatLng(95, 190)])), [[90, -170]]);
});

test('encodePath rounds half away from zero, like the algorithm page', () => {
  // The documented example value: -179.9832104 * 1e5 rounds to -17998321.
  eq(encodePath([{ lat: -179.9832104, lng: 0 }]), '`~oia@?');
  eq(decode(encodePath([{ lat: 0.000005, lng: -0.000005 }])), [[0.00001, -0.00001]]);
  eq(decode(encodePath([{ lat: 0.000015, lng: -0.000025 }])), [[0.00002, -0.00003]]);
});

test('LatLng round trip through decodePath and encodePath', () => {
  const path = decodePath(s, { LatLng });
  eq(encodePath(path), s);
  eq(encodePath(new MVCArray(path)), s);
});

// Google's published vectors: @googlemaps/polyline-codec's tests and the
// algorithm page. Every valid 2D case runs through all input shapes.
for (const file of ['googlemaps-js-polyline-codec.json', 'google-algorithm-docs.json']) {
  const { cases } = await json(`fixtures/vectors/${file}`);
  const valid = cases.filter((c) => !c.throws && !c.polytini && !(c.options && typeof c.options == 'object' && c.options.dimensions));
  test(`vectors: ${file} (${valid.length} cases)`, () => {
    ok(valid.length > 0);
    for (const c of valid) {
      if (c.op == 'decode') {
        const want = c.expected.map(([lat, lng]) => ({ lat, lng }));
        near(decodePath(c.input, c.options), want, 1e-9, c.name);
        near(plain(decodePath(c.input, c.options == null ? { LatLng } : typeof c.options == 'number' ? { precision: c.options, LatLng } : { ...c.options, LatLng })), want, 1e-9, c.name);
      } else {
        const input = c.input.map((p) => (Array.isArray(p) ? p : [p.lat, p.lng]));
        for (const path of [input, input.map(([lat, lng]) => ({ lat, lng })), input.map(([lat, lng]) => new LatLng(lat, lng, true))]) {
          eq(encodePath(path, c.options), c.expected, c.name);
          eq(encodePath(new MVCArray(path), c.options), c.expected, c.name);
        }
      }
    }
  });
}

// Cross-check against @googlemaps/polyline-codec when it can be resolved
// (the benchmark repo installs it; polytini doesn't depend on it). Random
// paths at precision 5, with values on and near the rounding midpoints.
const codec = await import('@googlemaps/polyline-codec').then((m) => (m.encode ? m : m.default), () => null);
if (codec?.encode) {
  test('same output as @googlemaps/polyline-codec on random paths', () => {
    let seed = 42;
    const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
    const coord = (max) => {
      const v = (rnd() * 2 - 1) * max;
      const r = rnd();
      // Some values exactly at a .5 step of the last digit, some a hair off it.
      return r < 0.3 ? (Math.trunc(v * 1e5) + 0.5) / 1e5 : r < 0.4 ? Math.trunc(v * 1e5) / 1e5 + 5e-6 : v;
    };
    for (let n = 0; n < 300; n++) {
      const path = Array.from({ length: 1 + (n % 40) }, () => [coord(90), coord(180)]);
      const want = codec.encode(path, 5);
      eq(encodePath(path.map(([lat, lng]) => new LatLng(lat, lng, true))), want, `path ${n}`);
      eq(encodePath(path.map(([lat, lng]) => ({ lat, lng }))), want, `path ${n}`);
      eq(decodePath(want), codec.decode(want, 5).map(([lat, lng]) => ({ lat, lng })), `path ${n}`);
    }
  });
}
