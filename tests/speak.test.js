import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { speak } from '../src/speak.js';

const say = (s, opts) => speak(parse(s).tree, opts);

test('grouped parts say where they end', () => {
  assert.equal(say('sqrt(x+1)'), 'the square root of x plus 1, end root');
  assert.equal(say('sqrt(x)+1'), 'the square root of x plus 1');
  assert.notEqual(say('x^(n+1)'), say('x^n+1'));
});

test('fractions', () => {
  assert.equal(say('1/2'), 'one half');
  assert.equal(say('3/4'), 'three quarters');
  assert.equal(say('x/y'), 'x over y');
  assert.equal(say('(x+1)/(x-1)'),
    'the fraction with numerator x plus 1, and denominator x minus 1, end fraction');
});

test('brief mode drops the end marker only at the very end', () => {
  assert.equal(say('(x+1)/(x-1)', { mode: 'brief' }),
    'the fraction with numerator x plus 1, and denominator x minus 1');
  assert.match(say('(x+1)/(x-1) = 2', { mode: 'brief' }), /end fraction, equals 2$/);
});

test('powers', () => {
  assert.equal(say('x^2'), 'x squared');
  assert.equal(say('x^3'), 'x cubed');
  assert.equal(say('x^4'), 'x to the 4th power');
  assert.equal(say('x^n'), 'x to the n-th power');
  assert.equal(say('x^-1'), 'x to the negative 1 power');
  assert.equal(say('(a+b)^2'), 'the quantity a plus b, end quantity, squared');
});

test('functions are not ambiguous with powers', () => {
  assert.equal(say('sin^2 x'), 'sine squared of x');
  assert.equal(say('sin(x)^2'), 'sine squared of x');
  assert.equal(say('sin(x^2)'), 'sine of x squared, end sine');
  assert.equal(say('log_2(8)'), 'log base 2 of 8');
});

test('the quadratic formula', () => {
  assert.equal(say('x = (-b + sqrt(b^2 - 4ac))/(2a)'),
    'x equals the fraction with numerator negative b plus the square root of b squared minus 4 a c, end root, and denominator 2 a, end fraction');
});

test('relations, capitals, multiplication', () => {
  assert.equal(say('A = pi r^2'), 'capital A equals pi r squared');
  assert.equal(say('2(x+1) <= 10'), '2 times the quantity x plus 1, end quantity, is less than or equal to 10');
  assert.equal(say('|x - 2| != 3'), 'the absolute value of x minus 2, end absolute value, is not equal to 3');
});
