// Nemeth braille output, shown as ASCII braille (the .brf letters) for readability.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { toBraille, toASCII, textToBraille, devanagariToBraille, indicToBraille } from '../src/braille.js';
import { parseWorksheet, worksheetBraille } from '../src/worksheet.js';

const brf = (s) => toASCII(toBraille(parse(s).tree));

test('numbers, letters and the numeric indicator', () => {
  assert.equal(brf('2x + 3 = 11'), '#2X+3 .K #11');
  assert.equal(brf('-3 + x'), '-#3+X');
  assert.equal(brf('x_1 + x_2'), 'X1+X2');
  assert.equal(brf('3.5'), '#3.5');
});

test('powers use level indicators, and return to the baseline only when needed', () => {
  assert.equal(brf('x^2 + 1'), 'X^2"+1');
  assert.equal(brf('x^2 = 4'), 'X^2 .K #4');
  assert.equal(brf('e^(x^2)'), 'E^X^^2');
  assert.equal(brf('e^(x^2) + 1'), 'E^X^^2"+1');
});

test('fractions, roots and the quadratic formula', () => {
  assert.equal(brf('1/2'), '?1/2#');
  assert.equal(brf('(1/2)/(3/4)'), ',??1/2#,/?3/4#,#');
  assert.equal(brf('x = (-b + sqrt(b^2 - 4ac))/(2a)'), 'X .K ?-B+>B^2"-4AC]/2A#');
  assert.equal(brf('root(3, x)'), '<3>X]');
});

test('comparisons, Greek letters, functions', () => {
  assert.equal(brf('x <= 5'), 'X "K: #5');
  assert.equal(brf('pi r^2'), '.PR^2');
  assert.equal(brf('log_2(8) = 3'), 'LOG;2 #8 .K #3');
  assert.equal(brf('|x| + 3!'), '\\X\\+3&');
});

test('ASCII braille and text', () => {
  assert.equal(toASCII('⠁⠃⠉'), 'ABC');
  assert.equal(toASCII(textToBraille('Solve for x: 12.')), ',SOLVE FOR X3 #AB4');
});

test('braille worksheet: 40-cell lines, numbered questions', () => {
  const qs = parseWorksheet('Solve for x: 3x - 4 = 11 answer: x = 5\nWork out: 2^4 answer: 16');
  const out = worksheetBraille('Homework', '', qs, { toBraille, toASCII, textToBraille });
  assert.match(out, /#A4 ,SOLVE FOR X3\r\n#3X-4 \.K #11/);
  assert.ok(out.split('\r\n').every((l) => l.replace('\f', '').length <= 40));
});

test('Bharati braille for Hindi and Marathi words (experimental)', () => {
  // ग-ण-ि-त: consonants carry a; the vowel sign ि is written as इ after its consonant.
  assert.equal(devanagariToBraille('गणित'), '⠛⠼⠊⠞');
  assert.equal(devanagariToBraille('मान'), '⠍⠜⠝');
  assert.equal(devanagariToBraille('ज्ञात'), '⠱⠜⠞');
  assert.equal(devanagariToBraille('क्या'), '⠅⠈⠽⠜');
  assert.equal(devanagariToBraille('१२'), '⠼⠁⠃');
  const qs = parseWorksheet('x का मान ज्ञात कीजिए: 2x + 1 = 7 उत्तर: x = 3');
  const out = worksheetBraille('गृहकार्य', '', qs, { toBraille, toASCII, textToBraille, devanagariToBraille });
  assert.match(out, /#2X\+1 \.K #7/);
  assert.ok(out.split('\r\n')[0].length > 0);
});

test('Bharati braille for Bengali and Tamil words (experimental): same sound, same cell', () => {
  // গণিত (Bengali) and गणित (Hindi) are the same word, so the same braille.
  assert.equal(indicToBraille('গণিত'), devanagariToBraille('गणित'));
  assert.equal(indicToBraille('১২'), '⠼⠁⠃');
  // கணிதம் (Tamil): க ண ி த ம ்
  assert.equal(indicToBraille('கணிதம்'), '⠅⠼⠊⠞⠍⠈');
});
