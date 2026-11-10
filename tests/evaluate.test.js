import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { evaluate, checkAnswer } from '../src/evaluate.js';
import { SETS } from '../src/problems.js';

const val = (s, env) => evaluate(parse(s).tree, env);

test('evaluates numbers and expressions', () => {
  assert.equal(val('2 + 3 * 4'), 14);
  assert.equal(val('2^3^2'), 512);
  assert.equal(val('-2^2'), -4);
  assert.equal(val('sqrt(16) + |-3|'), 7);
  assert.equal(val('5!'), 120);
  assert.equal(val('log_2(8)'), 3);
  assert.equal(val('root(3, -27)'), -3);
  assert.equal(val('2x', { x: 5 }), 10);
});

test('accepts equivalent answers', () => {
  assert.equal(checkAnswer('x = 4', '4', { solveFor: 'x' }).ok, true);
  assert.equal(checkAnswer('4', '4', { solveFor: 'x' }).ok, true);
  assert.equal(checkAnswer('8/2', '4', { solveFor: 'x' }).ok, true);
  assert.equal(checkAnswer('0.5', '1/2').ok, true);
  assert.equal(checkAnswer('3 + x', 'x + 3').ok, true);
  assert.equal(checkAnswer('b^2 + a^2 + 2ba', 'a^2 + 2ab + b^2').ok, true);
});

test('rejects wrong answers with a reason', () => {
  assert.equal(checkAnswer('5', '4', { solveFor: 'x' }).reason, 'wrong');
  assert.equal(checkAnswer('x + 1', '4', { solveFor: 'x' }).reason, 'still-has-letters');
  assert.equal(checkAnswer('a^2 + b^2', 'a^2 + 2ab + b^2').reason, 'wrong');
  assert.equal(checkAnswer('(3', '3').reason, 'unreadable');
});

test('every built-in problem accepts its own answer and parses', () => {
  for (const set of SETS) {
    for (const p of set.problems) {
      parse(p.math);
      assert.equal(checkAnswer(p.answer, p.answer, { solveFor: p.solveFor }).ok, true, p.math);
      if (p.kind !== 'solve') {
        // The answer is the same value as the question.
        assert.equal(checkAnswer(p.math, p.answer).ok, true, p.math);
      }
    }
  }
});

test('every "solve" answer makes both sides equal', () => {
  for (const set of SETS) {
    for (const p of set.problems.filter((q) => q.kind === 'solve')) {
      const rel = parse(p.math).tree;
      const env = { [p.solveFor]: val(p.answer) };
      assert.ok(Math.abs(evaluate(rel.items[0], env) - evaluate(rel.items[1], env)) < 1e-9, p.math);
    }
  }
});
