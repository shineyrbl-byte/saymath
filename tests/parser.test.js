import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, tokenize, ParseError } from '../src/parser.js';

const tree = (s) => parse(s).tree;

test('numbers, letters and implicit multiplication', () => {
  assert.deepEqual(tree('3x'), {
    type: 'mul', factors: [{ type: 'num', value: '3' }, { type: 'var', name: 'x' }], explicit: [false],
  });
  assert.equal(tree('xy').type, 'mul');
  assert.equal(tree('2(x+1)').factors[1].type, 'paren');
});

test('known words are not split into letters', () => {
  assert.deepEqual(tokenize('sqrt pi theta').map((t) => t.value), ['sqrt', 'pi', 'theta']);
  assert.equal(tree('sinx').type, 'func');
});

test('fractions drop the grouping brackets', () => {
  const t = tree('(x+1)/(x-1)');
  assert.equal(t.type, 'frac');
  assert.equal(t.num.type, 'add');
  assert.equal(t.den.type, 'add');
});

test('powers bind tighter than minus and are right-associative', () => {
  assert.equal(tree('-x^2').type, 'neg');
  const t = tree('2^3^2');
  assert.equal(t.exp.type, 'pow');
  assert.equal(tree('x^-1').exp.type, 'neg');
  assert.equal(tree('x^(n+1)').exp.type, 'add');
});

test('relations, roots, absolute values, functions', () => {
  const r = tree('x <= 5 < y');
  assert.deepEqual(r.ops, ['<=', '<']);
  assert.equal(tree('root(3, x)').type, 'root');
  assert.equal(tree('|x - 2|').type, 'abs');
  assert.equal(tree('log_2(8)').base.value, '2');
  assert.equal(tree('(1, 2)').type, 'list');
});

test('unicode symbols work', () => {
  assert.equal(tree('x² ≤ 4').type, 'rel');
  assert.equal(tree('√9').type, 'sqrt');
  assert.equal(tree('6 ÷ 2').type, 'frac');
});

test('warns about 1/2x', () => {
  const { tree: t, warnings } = parse('1/2x');
  assert.equal(t.type, 'mul');
  assert.equal(warnings.length, 1);
  assert.equal(parse('1/(2x)').warnings.length, 0);
});

test('friendly errors', () => {
  assert.throws(() => parse('(x+1'), ParseError);
  assert.throws(() => parse('x+1)'), /closing bracket/);
  assert.throws(() => parse('x^'), /missing/);
  assert.throws(() => parse('x @ 2'), /symbol/);
});
