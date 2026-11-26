// Types for @duoquote/polytini/openlayers. The class has the same API as
// ol/format/Polyline, so its types are ol's own.
import OlPolyline from 'ol/format/Polyline.js';
import type { Options } from 'ol/format/Polyline.js';

export type { Options };

/**
 * Drop-in for ol/format/Polyline: the same constructor options (factor,
 * geometryLayout), methods and output, faster. Unlike ol's, writeGeometry
 * never changes the geometry it is given.
 */
export default class Polyline extends OlPolyline {
  constructor(options?: Options);
}

export { Polyline };
