// Calculus, matrices, ±, degrees and ≈: parsing, speech and values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, ParseError } from '../src/parser.js';
import { speak } from '../src/speak.js';
import { evaluate, checkAnswer } from '../src/evaluate.js';

const en = (s) => speak(parse(s).tree, { lang: 'en' });
const hi = (s) => speak(parse(s).tree, { lang: 'hi' });
const val = (s, env) => evaluate(parse(s).tree, env);

test('sums and products say their limits and where they end', () => {
  assert.equal(en('sum(i=1, n, i^2) + 1'), 'the sum from i equals 1 to n of i squared, end sum, plus 1');
  assert.equal(en('∑(k=1, 10, k)'), 'the sum from k equals 1 to 10 of k');
  assert.equal(en('prod(k=1, n, k)'), 'the product from k equals 1 to n of k');
  assert.equal(hi('sum(i=1, n, i^2)'), 'योग, आई बराबर 1 से एन तक: आई का वर्ग, योग समाप्त');
});

test('integrals end with "d x", so they need no end marker', () => {
  assert.equal(en('int(x^2, x, 0, 1) = 1/3'), 'the integral from 0 to 1 of x squared, d x, equals one third');
  assert.equal(en('∫(cos(x), x)'), 'the integral of cosine of x, d x');
  assert.equal(hi('int(x^2, x, 0, 1)'), '0 से 1 तक समाकल: एक्स का वर्ग, डी एक्स');
});

test('limits and derivatives', () => {
  assert.equal(en('lim(x -> 0, sin(x)/x) = 1'),
    'the limit as x approaches 0 of the fraction with numerator sine of x, and denominator x, end fraction, end limit, equals 1');
  assert.equal(en('lim(x → infinity, 1/x)'), 'the limit as x approaches infinity of 1 over x, end limit');
  assert.equal(speak(parse('lim(x → infinity, 1/x)').tree, { mode: 'brief' }), 'the limit as x approaches infinity of 1 over x');
  assert.equal(en('diff(x^3, x) = 3x^2'), 'the derivative with respect to x of x cubed, end derivative, equals 3 x squared');
  assert.equal(en('diff(y, x, 2)'), 'the second derivative with respect to x of y');
  assert.equal(hi('diff(x^3, x)'), 'एक्स के सापेक्ष अवकलज: एक्स का घन, अवकलज समाप्त');
});

test('matrices read row by row', () => {
  assert.equal(en('[[1, 2], [3, 4]]'), 'the 2 by 2 matrix: row 1: 1, 2; row 2: 3, 4; end matrix');
  assert.equal(en('det([[a, b], [c, d]]) = ad - bc'),
    'the determinant of the 2 by 2 matrix: row 1: a, b; row 2: c, d; end matrix, equals a d minus b c');
  assert.equal(hi('[[1, 2], [3, 4]]'), '2 गुणा 2 आव्यूह: पंक्ति 1: 1, 2; पंक्ति 2: 3, 4; आव्यूह समाप्त');
  // A single bracket list stays a list, not a matrix.
  assert.equal(parse('[1, 2]').tree.type, 'list');
});

test('plus or minus, degrees, approximately, inverse trig', () => {
  assert.equal(en('x = (-b ± sqrt(b^2 - 4ac))/(2a)'),
    'x equals the fraction with numerator negative b plus or minus the square root of b squared minus 4 a c, end root, and denominator 2 a, end fraction');
  assert.equal(en('x = +/- 2'), 'x equals plus or minus 2');
  assert.equal(en('sin(30°) = 1/2'), 'sine of 30 degrees equals one half');
  assert.equal(en('pi ≈ 3.14'), 'pi is approximately equal to 3 point 14');
  assert.equal(en('asin(x) + cosh(y)'), 'inverse sine of x plus hyperbolic cosine of y');
});

test('calculus words only count with a bracket after them', () => {
  assert.equal(parse('sum + 2').tree.type, 'add');
  assert.equal(en('int'), 'i n t');
  assert.throws(() => parse('int(x)'), (e) => e instanceof ParseError && e.code === 'calcForm');
  assert.throws(() => parse('lim(x, 2)'), (e) => e.code === 'calcForm');
});

test('values: sums, integrals, limits, derivatives, determinants, degrees', () => {
  assert.equal(val('sum(i=1, 10, i^2)'), 385);
  assert.equal(val('prod(k=1, 5, k)'), 120);
  assert.ok(Math.abs(val('int(x^2, x, 0, 1)') - 1 / 3) < 1e-9);
  assert.ok(Math.abs(val('lim(x -> 0, sin(x)/x)') - 1) < 1e-6);
  assert.ok(Math.abs(val('diff(x^3, x)', { x: 2 }) - 12) < 1e-5);
  assert.equal(val('det([[1, 2], [3, 4]])'), -2);
  assert.ok(Math.abs(val('sin(30°)') - 0.5) < 1e-12);
  assert.throws(() => val('x +/- 1', { x: 1 }));
});

test('answers with calculus are checked by value', () => {
  assert.ok(checkAnswer('3x^2', 'diff(x^3, x)').ok);
  assert.ok(checkAnswer('cos(x)', 'diff(sin(x), x)').ok);
  assert.ok(!checkAnswer('3x^2 + 1', 'diff(x^3, x)').ok);
  assert.ok(checkAnswer('1/3', 'int(x^2, x, 0, 1)').ok);
  assert.ok(checkAnswer('-2', 'det([[1, 2], [3, 4]])').ok);
});
