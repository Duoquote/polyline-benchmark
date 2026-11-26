# Source of these files

Copied unchanged from HERE's Flexible Polyline repository:

- Repository: https://github.com/heremaps/flexible-polyline
- Commit: 960bb0bea324e6b933effe54f189ee9f3181eb26 (2026-11-26)
- License: MIT, copyright 2019 HERE Europe B.V. (full text below)

| File here | Path in the repository | SHA-256 |
|---|---|---|
| original.txt | test/original.txt | f7cfebf4497dca939a05cf41940f8cee81911083eb6678684e5f25e2fbeafee0 |
| round_half_up_encoded.txt | test/round_half_up/encoded.txt | 154c6753cab9b041d6e11baff88d909e977cc1619bb13578ad848066f52ddf4f |
| round_half_up_decoded.txt | test/round_half_up/decoded.txt | dc192b8bcf10f909e70cdb4d557cb5f7ab127b471b9662d47c576a02d0f94afc |

`original.txt` holds 3072 polylines covering every precision from 0 to 15,
every third dimension type including the reserved 4 and 5, and every third
dimension precision. Line N of the two other files is line N of
`original.txt`, encoded and then decoded again, rounding half away from
zero. That is the rounding polytini uses. The repository also has
`test/round_half_even/`, for languages whose round function ties to even;
it is not copied because polytini doesn't round that way.

The files use LF line endings. Git clients with `core.autocrlf` may check
them out with CRLF, which the tests accept.

## License

Copyright 2019 HERE Europe B.V

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
