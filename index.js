
const polylineDec = require("@googlemaps/polyline-codec");
const googlePolyline = require('google-polyline');
const polylineEncoded = require('polyline-encoded');
const mapBoxPolyline = require('@mapbox/polyline');
const decodePolyline = require('decode-google-map-polyline');
const fs = require("fs");
const bench = require('nanobench');

var data = fs.readFileSync("example.csv").toLocaleString();
data = data.split(/\r\n|\n/);
data.splice(0, 1);
data = data.map(line => line.replace(/^"/g, "").replace(/"$/g, ""));

var decoded;

bench('google-polyline 1000 times', function (b) {
  b.start()

  for (var i = 0; i < 1000; i++) {
    decoded = data.map(encoded => googlePolyline.decode(encoded));
  }

  b.end()
});

bench('@googlemaps/polyline-codec 1000 times', function (b) {
  b.start()

  for (var i = 0; i < 1000; i++) {
    decoded = data.map(encoded => polylineDec.decode(encoded));
  }

  b.end()
});

bench('polyline-encoded 1000 times', function (b) {
  b.start()

  for (var i = 0; i < 1000; i++) {
    decoded = data.map(encoded => polylineEncoded.decode(encoded));
  }

  b.end()
});

bench('@mapbox/polyline 1000 times', function (b) {
  b.start()

  for (var i = 0; i < 1000; i++) {
    decoded = data.map(encoded => mapBoxPolyline.decode(encoded));
  }

  b.end()
});

bench('decode-google-map-polyline 1000 times', function (b) {
  b.start()

  for (var i = 0; i < 1000; i++) {
    decoded = data.map(encoded => decodePolyline(encoded));
  }

  b.end()
});