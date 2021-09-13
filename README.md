# Benchmarks of Various Implementations of Polyline Decoding in Javascript

## How to run:

First install the node modules by typing `yarn` or `npm install` and then you can run it with `node index.js`.

## The Benchmark:
###### Ran on Ryzen 5 3600 @ Stock, 32GB ram machine.

```cmd
> C:\Program Files\nodejs\node.exe index.js

# google-polyline 1000 times
ok ~8.95 s (8 s + 951970700 ns)

# @googlemaps/polyline-codec 1000 times
ok ~7.96 s (7 s + 963498400 ns)

# polyline-encoded 1000 times
ok ~25 s (25 s + 87594900 ns)

# @mapbox/polyline 1000 times
ok ~8.04 s (8 s + 36240100 ns)

# decode-google-map-polyline 1000 times
ok ~2.45 min (147 s + 810016800 ns)

all benchmarks completed
ok ~3.28 min (197 s + 849320900 ns)
```

## TODO:
- [ ] Add Polyline encoding benchmark too.
- [ ] Compare the results and the speed of translation to a specific standard like GeoJSON.
- [ ] Add four stage 1000, 10000, 100000 and 1000000 encodings/decodings benchmark.