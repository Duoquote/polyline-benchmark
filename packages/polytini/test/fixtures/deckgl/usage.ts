// Type check of @duoquote/polytini/deckgl against deck.gl's layer types. Not
// run, only compiled: npx tsc -p test/fixtures/deckgl
import { PathLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { binaryPaths, binaryPolygons, type BinaryPaths } from '@duoquote/polytini/deckgl';
import { osrm6 } from '@duoquote/polytini/presets';

const lines = ['_p~iF~ps|U_ulLnnqC_mqNvxq`@'];

const paths: BinaryPaths<Float64Array> = binaryPaths(lines, osrm6);
const f32: Float32Array = binaryPaths(lines, { float32: true }).attributes.getPath.value;
const f64: Float64Array = binaryPaths(lines[0], 6).attributes.getPath.value;
const size: 2 | 3 = paths.attributes.getPath.size;

new PathLayer({ id: 'paths', data: paths, _pathType: 'open', getWidth: 3, getColor: [255, 0, 0] });
new PathLayer({ id: 'paths32', data: binaryPaths(lines, { float32: true }) });

const trips = binaryPaths(lines, { dimensions: 3, zFactor: 1, timestamps: true });
const ts: Float32Array | undefined = trips.attributes.getTimestamps?.value;
new TripsLayer({ id: 'trips', data: trips, currentTime: 30, trailLength: 60 });

const polys = binaryPolygons(lines, { precision: 5 });
new SolidPolygonLayer({ id: 'fill', data: polys, _normalize: false, getFillColor: [0, 0, 255] });
new PathLayer({ id: 'outline', data: { ...polys, attributes: { getPath: polys.attributes.getPolygon } }, _pathType: 'open' });

// @ts-expect-error float32 is a boolean
binaryPaths(lines, { float32: 'yes' });

export { f32, f64, size, ts };
