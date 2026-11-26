// Copied from the polyline-benchmark repo (src/reference.js), same author and license.
// Reference codec for the Google encoded polyline format.
// https://developers.google.com/maps/documentation/utilities/polylinealgorithm
//
// This is the oracle the correctness tests compare every library against.
// It is written to be easy to check, not to be fast, and it is not part of
// the benchmark. Plain Number arithmetic stays exact up to 2^53, so it does
// not overflow the way 32-bit bitwise code can at high precisions.

// Round half away from zero, the way Google's algorithm description and
// C's round() do. Math.round on the magnitude is exact; the common
// Math.floor(Math.abs(value) + 0.5) is not, because the addition itself
// rounds 0.49999999999999994 + 0.5 up to 1.
function round(value) {
  return Math.sign(value) * Math.round(Math.abs(value));
}

function encodeValue(delta) {
  let v = delta < 0 ? -delta * 2 - 1 : delta * 2;
  let out = '';
  while (v >= 32) {
    out += String.fromCharCode((v % 32) + 32 + 63);
    v = Math.floor(v / 32);
  }
  return out + String.fromCharCode(v + 63);
}

/** @param {Array<[number, number]>} points [lat, lng] pairs */
export function encode(points, precision = 5) {
  const factor = 10 ** precision;
  let out = '';
  let prevLat = 0;
  let prevLng = 0;
  for (const [lat, lng] of points) {
    const iLat = round(lat * factor);
    const iLng = round(lng * factor);
    out += encodeValue(iLat - prevLat) + encodeValue(iLng - prevLng);
    prevLat = iLat;
    prevLng = iLng;
  }
  return out;
}

/** @returns {Array<[number, number]>} [lat, lng] pairs */
export function decode(str, precision = 5) {
  const factor = 10 ** precision;
  const values = [];
  let value = 0;
  let scale = 1;
  for (let i = 0; i < str.length; i++) {
    const chunk = str.charCodeAt(i) - 63;
    if (chunk < 0 || chunk > 63) throw new Error(`invalid character at ${i}`);
    value += (chunk % 32) * scale;
    scale *= 32;
    if (chunk < 32) {
      values.push(value % 2 ? -(value + 1) / 2 : value / 2);
      value = 0;
      scale = 1;
    }
  }
  if (scale !== 1) throw new Error('truncated polyline');
  if (values.length % 2) throw new Error('odd number of values');
  const points = [];
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < values.length; i += 2) {
    lat += values[i];
    lng += values[i + 1];
    points.push([lat / factor, lng / factor]);
  }
  return points;
}
