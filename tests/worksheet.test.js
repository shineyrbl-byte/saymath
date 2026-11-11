import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseWorksheet, worksheetText, bundle, ENGINE } from '../src/worksheet.js';

test('reads teacher lines with optional prompt and answer', () => {
  const [a, b, c, d] = parseWorksheet(`Solve for x: 3x - 4 = 11 answer: x = 5
Work out: 2^4 + sqrt(9) Answer: 19

|x - 2| < 5
1/2x`);
  assert.deepEqual([a.prompt, a.math, a.answer, a.solveFor], ['Solve for x', '3x - 4 = 11', '5', 'x']);
  assert.deepEqual([b.prompt, b.answer, b.solveFor], ['Work out', '19', undefined]);
  assert.equal(c.math, '|x - 2| < 5');
  assert.equal(c.answer, '');
  assert.equal(d.warnings.length, 1);
  assert.equal(d.line, 5);
});

test('reports mistakes per line', () => {
  const [q] = parseWorksheet('(x + 1 answer: 3');
  assert.match(q.error, /never closed/);
});

test('plain text version for SMS or braille', () => {
  const qs = parseWorksheet('Solve: x^2 = 9 answer: x = 3');
  assert.equal(worksheetText('Homework', '', qs, { lang: 'en' }), 'Homework\n\n1. Solve x squared equals 9');
});

test('the bundled engine runs on its own (as in the downloaded file)', () => {
  const sources = Object.fromEntries(ENGINE.map((n) => [n, readFileSync(new URL(`../src/${n}.js`, import.meta.url), 'utf8')]));
  const code = bundle(sources);
  assert.ok(!/^\s*(import|export)\s/m.test(code), 'no import/export left');
  const engine = new Function(`${code}; return { M_parser, M_speak, M_evaluate, M_explorer };`)();
  const tree = engine.M_parser.parse('sqrt(x+1)').tree;
  assert.equal(engine.M_speak.speak(tree), 'the square root of x plus 1, end root');
  assert.equal(engine.M_speak.speak(tree, { lang: 'hi' }), 'वर्गमूल: एक्स प्लस 1, वर्गमूल समाप्त');
  assert.equal(engine.M_evaluate.checkAnswer('x = 5', '5', { solveFor: 'x' }).ok, true);
  assert.equal(typeof engine.M_explorer.attachExplorer, 'function');
});

test('prompts in Hindi and Marathi are recognised', () => {
  for (const line of ['x का मान ज्ञात कीजिए: 2x + 1 = 7 उत्तर: x = 3', 'x ची किंमत काढा: 2x + 1 = 7 उत्तर: x = 3']) {
    const [q] = parseWorksheet(line);
    assert.equal(q.error, null);
    assert.equal(q.math, '2x + 1 = 7');
    assert.equal(q.solveFor, 'x');
    assert.equal(q.answer, '3');
  }
});
