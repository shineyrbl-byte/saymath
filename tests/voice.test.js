// Spoken maths to typed maths, for answering by voice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spokenToMath } from '../src/voice.js';
import { parse } from '../src/parser.js';
import { checkAnswer } from '../src/evaluate.js';

test('English: words, number words and comparisons', () => {
  assert.equal(spokenToMath('x equals five'), 'x = 5');
  assert.equal(spokenToMath('X is 5'), 'x = 5');
  assert.equal(spokenToMath('the answer is 4'), '4');
  assert.equal(spokenToMath('x squared plus three x minus four'), 'x^2 + 3 x - 4');
  assert.equal(spokenToMath('twenty one over seven'), '21 / 7');
  assert.equal(spokenToMath('x is less than or equal to 12'), 'x <= 12');
  assert.equal(spokenToMath('the square root of open bracket x plus one close bracket'), 'sqrt ( x + 1 )');
});

test('Hindi and Marathi, including Devanagari digits', () => {
  assert.equal(spokenToMath('एक्स बराबर ५', 'hi'), 'x = 5');
  assert.equal(spokenToMath('एक्स का वर्ग प्लस 3', 'hi'), 'x^2 + 3');
  assert.equal(spokenToMath('8 बटा 2', 'hi'), '8 / 2');
  assert.equal(spokenToMath('एक्स चा वर्ग अधिक 3 भागिले 4', 'mr'), 'x^2 + 3 / 4');
  assert.equal(spokenToMath('एक्स बरोबर 5', 'mr'), 'x = 5');
});

test('what comes out can be read and checked', () => {
  for (const said of ['x equals four', 'eight over two', 'the answer is 4']) {
    const typed = spokenToMath(said);
    assert.doesNotThrow(() => parse(typed));
    assert.ok(checkAnswer(typed, '4', { solveFor: 'x' }).ok, said);
  }
});
