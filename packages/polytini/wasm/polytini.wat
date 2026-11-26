;; polytini WASM codec. Hand-written so the binary stays a few hundred bytes.
;; Build: node scripts/build-wasm.js (uses the `wabt` dev dependency).
;;
;; Both functions return -1 when the input needs the exact JS path: invalid
;; characters, truncated strings, values over 6 chunks, non-finite or huge
;; coordinates. The JS glue then calls the slow path, which throws in strict
;; mode or gives the lenient result.
(module
  (memory (export "memory") 1)

  ;; decode(p, len, wide, out, f, sw) -> number of f64 values written at out
  ;; Input is `len` characters at p, 1 byte each (wide = 0) or 2 (wide = 1).
  ;; Output is lat/f, lng/f pairs, swapped to lng, lat when sw = 1.
  (func (export "decode")
    (param $p i32) (param $len i32) (param $wide i32) (param $out i32) (param $f f64) (param $sw i32)
    (result i32)
    (local $end i32) (local $o i32) (local $c i32) (local $v i32) (local $s i32)
    (local $lat i32) (local $lng i32) (local $bad i32) (local $k i32)
    (local.set $end (i32.add (local.get $p) (i32.shl (local.get $len) (local.get $wide))))
    (local.set $o (local.get $out))
    (block $done
      (loop $point
        (br_if $done (i32.ge_u (local.get $p) (local.get $end)))
        (local.set $k (i32.const 0))
        (loop $value
          (local.set $v (i32.const 0))
          (local.set $s (i32.const 0))
          (loop $chunk
            ;; Truncated input, or a 7th chunk that would overflow 32 bits.
            (if (i32.or (i32.ge_u (local.get $p) (local.get $end)) (i32.gt_u (local.get $s) (i32.const 25)))
              (then (return (i32.const -1))))
            (local.set $c (i32.sub
              (if (result i32) (local.get $wide)
                (then (i32.load16_u (local.get $p)))
                (else (i32.load8_u (local.get $p))))
              (i32.const 63)))
            (local.set $bad (i32.or (local.get $bad) (local.get $c)))
            (local.set $p (i32.add (local.get $p) (i32.add (local.get $wide) (i32.const 1))))
            (local.set $v (i32.or (local.get $v) (i32.shl (i32.and (local.get $c) (i32.const 31)) (local.get $s))))
            (local.set $s (i32.add (local.get $s) (i32.const 5)))
            (br_if $chunk (i32.ge_s (local.get $c) (i32.const 32))))
          ;; zigzag: (v >>> 1) ^ -(v & 1)
          (local.set $v (i32.xor (i32.shr_u (local.get $v) (i32.const 1))
                                 (i32.sub (i32.const 0) (i32.and (local.get $v) (i32.const 1)))))
          (if (local.get $k)
            (then (local.set $lng (i32.add (local.get $lng) (local.get $v))))
            (else (local.set $lat (i32.add (local.get $lat) (local.get $v)))))
          (local.set $k (i32.add (local.get $k) (i32.const 1)))
          (br_if $value (i32.lt_u (local.get $k) (i32.const 2))))
        (f64.store (i32.add (local.get $o) (i32.shl (local.get $sw) (i32.const 3)))
          (f64.div (f64.convert_i32_s (local.get $lat)) (local.get $f)))
        (f64.store (i32.sub (i32.add (local.get $o) (i32.const 8)) (i32.shl (local.get $sw) (i32.const 3)))
          (f64.div (f64.convert_i32_s (local.get $lng)) (local.get $f)))
        (local.set $o (i32.add (local.get $o) (i32.const 16)))
        (br $point)))
    (if (i32.and (local.get $bad) (i32.const -64)) (then (return (i32.const -1))))
    (i32.shr_u (i32.sub (local.get $o) (local.get $out)) (i32.const 3)))

  ;; Writes the characters of one zigzag value at o, returns the new o.
  (func $emit (param $o i32) (param $z i64) (result i32)
    (block $last
      (loop $more
        (br_if $last (i64.lt_u (local.get $z) (i64.const 32)))
        (i64.store8 (local.get $o) (i64.add (i64.and (local.get $z) (i64.const 31)) (i64.const 95)))
        (local.set $o (i32.add (local.get $o) (i32.const 1)))
        (local.set $z (i64.shr_u (local.get $z) (i64.const 5)))
        (br $more)))
    (i64.store8 (local.get $o) (i64.add (local.get $z) (i64.const 63)))
    (i32.add (local.get $o) (i32.const 1)))

  ;; Scale and round half away from zero, the same results as the JS paths. Out-of-range values clear $ok and
  ;; encode returns -1.
  (global $ok (mut i32) (i32.const 1))
  (func $round (param $x f64) (param $f f64) (result i64)
    (local $a f64) (local $t f64)
    (local.set $x (f64.mul (local.get $x) (local.get $f)))
    ;; Also false for NaN. 2^51 keeps the zigzag below 2^53, which is as far
    ;; as the JS slow path is exact.
    (if (i32.eqz (f64.lt (f64.abs (local.get $x)) (f64.const 2251799813685248)))
      (then (global.set $ok (i32.const 0)) (return (i64.const 0))))
    ;; Half away from zero, exactly: floor the magnitude, then add 1 when the
    ;; remainder is at least 0.5 (f64.nearest rounds ties to even, and
    ;; floor(a + 0.5) is off for 0.49999999999999994).
    (local.set $a (f64.abs (local.get $x)))
    (local.set $t (f64.floor (local.get $a)))
    (if (f64.ge (f64.sub (local.get $a) (local.get $t)) (f64.const 0.5))
      (then (local.set $t (f64.add (local.get $t) (f64.const 1)))))
    (i64.trunc_f64_s (f64.copysign (local.get $t) (local.get $x))))

  ;; encode(in, n, f, out) -> number of bytes written at out
  ;; Input is n f64 values at in, lat and lng alternating.
  (func (export "encode")
    (param $in i32) (param $n i32) (param $f f64) (param $out i32)
    (result i32)
    (local $end i32) (local $o i32) (local $a i64) (local $b i64) (local $pa i64) (local $pb i64) (local $d i64)
    (global.set $ok (i32.const 1))
    (local.set $end (i32.add (local.get $in) (i32.shl (local.get $n) (i32.const 3))))
    (local.set $o (local.get $out))
    (block $done
      (loop $point
        (br_if $done (i32.ge_u (local.get $in) (local.get $end)))
        (local.set $a (call $round (f64.load (local.get $in)) (local.get $f)))
        (local.set $b (call $round (f64.load offset=8 (local.get $in)) (local.get $f)))
        (if (i32.eqz (global.get $ok)) (then (return (i32.const -1))))
        (local.set $d (i64.sub (local.get $a) (local.get $pa)))
        (local.set $o (call $emit (local.get $o)
          (i64.xor (i64.shl (local.get $d) (i64.const 1)) (i64.shr_s (local.get $d) (i64.const 63)))))
        (local.set $d (i64.sub (local.get $b) (local.get $pb)))
        (local.set $o (call $emit (local.get $o)
          (i64.xor (i64.shl (local.get $d) (i64.const 1)) (i64.shr_s (local.get $d) (i64.const 63)))))
        (local.set $pa (local.get $a))
        (local.set $pb (local.get $b))
        (local.set $in (i32.add (local.get $in) (i32.const 16)))
        (br $point)))
    (i32.sub (local.get $o) (local.get $out)))
)
