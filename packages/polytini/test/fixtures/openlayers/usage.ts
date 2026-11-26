// Type check of @duoquote/polytini/openlayers against ol's own types. Not
// run, only compiled: npx tsc -p test/fixtures/openlayers
import Polyline, { Polyline as Named, type Options } from '@duoquote/polytini/openlayers';
import OlPolyline from 'ol/format/Polyline.js';
import type LineString from 'ol/geom/LineString.js';
import type Feature from 'ol/Feature.js';
import type Geometry from 'ol/geom/Geometry.js';
import VectorSource from 'ol/source/Vector.js';

const options: Options = { factor: 1e6, geometryLayout: 'XYZ' };
const format = new Polyline(options);
const same: OlPolyline = format;
const named: Polyline = new Named();
new Polyline();

const geometry: Geometry = format.readGeometry('_p~iF~ps|U_ulLnnqC_mqNvxq`@', { featureProjection: 'EPSG:3857' });
const feature = format.readFeature('_p~iF~ps|U') as Feature;
const features: Feature[] = format.readFeatures('_p~iF~ps|U');
const text: string = format.writeGeometry(geometry as LineString, { featureProjection: 'EPSG:3857', decimals: 5 });
const text2: string = format.writeFeature(feature);
new VectorSource({ features });

// A format option works where ol's does.
new VectorSource({ format: new Polyline(), url: '/route.txt' });

// @ts-expect-error factor is a number
new Polyline({ factor: '1e5' });

export { same, named, text, text2 };
