// Pasting LaTeX: it becomes typed maths and is read the same way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { speak } from '../src/speak.js';
import { fromLatex, looksLikeLatex } from '../src/latex.js';

const en = (s) => speak(parse(s).tree);

test('LaTeX is recognised, plain typing is not', () => {
  assert.ok(looksLikeLatex('\\frac{1}{2}'));
  assert.ok(looksLikeLatex('x^{2}'));
  assert.ok(!looksLikeLatex('x^2 + 1/2'));
});

test('the quadratic formula pasted as LaTeX reads like the typed one', () => {
  assert.equal(en('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'), en('x = (-b +/- sqrt(b^2 - 4ac))/(2a)'));
});

test('fractions, roots, powers, Greek, comparisons', () => {
  assert.equal(en('\\frac{1}{2} + \\frac{x+1}{3}'), 'one half plus the fraction with numerator x plus 1, and denominator 3, end fraction');
  assert.equal(en('\\sqrt[3]{8} = 2'), 'the cube root of 8 equals 2');
  assert.equal(en('x^{n+1} \\leq 10'), 'x to the power n plus 1, end power, is less than or equal to 10');
  assert.equal(en('\\sin^2 \\theta + \\cos^2 \\theta = 1'), 'sine squared of theta plus cosine squared of theta equals 1');
  assert.equal(en('\\left( a + b \\right)^2'), 'the quantity a plus b, end quantity, squared');
  assert.equal(en('30^\\circ'), '30 degrees');
});

test('calculus and matrices', () => {
  assert.equal(fromLatex('\\int_0^1 x^2 \\, dx'), 'int(x^2, x, 0, 1)');
  assert.equal(fromLatex('\\sum_{i=1}^{n} i^2'), 'sum(i=1, n, i^2)');
  assert.equal(en('\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1'),
    'the limit as x approaches 0 of the fraction with numerator sine of x, and denominator x, end fraction, end limit, equals 1');
  assert.equal(en('\\frac{d}{dx} x^3'), 'the derivative with respect to x of x cubed, end derivative');
  assert.equal(en('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}'), 'the 2 by 2 matrix: row 1: 1, 2; row 2: 3, 4; end matrix');
});
