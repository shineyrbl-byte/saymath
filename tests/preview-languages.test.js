// Tamil and Bengali (preview): the same rules, in each language's word order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { speak, languages, describeStep } from '../src/speak.js';

const say = (s, lang) => speak(parse(s).tree, { lang });

test('Tamil and Bengali are registered', () => {
  assert.ok(languages().includes('ta') && languages().includes('bn'));
});

test('Tamil: powers, fractions, the "end" rule', () => {
  assert.equal(say('x^2 + 1', 'ta'), 'x இன் வர்க்கம் கூட்டல் 1');
  assert.equal(say('3/4', 'ta'), 'முக்கால்');
  assert.equal(say('a/b', 'ta'), 'b இல் a');
  assert.equal(say('sqrt(x + 1)', 'ta'), 'வர்க்கமூலம்: x கூட்டல் 1, வர்க்கமூலம் முடிவு');
  assert.equal(say('x < 5', 'ta'), 'x, 5 ஐ விட சிறியது');
});

test('Bengali: powers, fractions, the "end" rule', () => {
  assert.equal(say('x^2 + 1', 'bn'), 'এক্স এর বর্গ যোগ 1');
  assert.equal(say('a/b', 'bn'), 'বি ভাগের এ');
  assert.equal(say('sqrt(x + 1)', 'bn'), 'বর্গমূল: এক্স যোগ 1, বর্গমূল শেষ');
  assert.equal(say('(x+1)/2 = 3', 'bn'), 'ভগ্নাংশ: লব এক্স যোগ 1, এবং হর 2, ভগ্নাংশ শেষ, সমান 3');
});

test('every construct has words in both preview languages', () => {
  const all = ['x = (-b +/- sqrt(b^2 - 4ac))/(2a)', 'sum(i=1, n, i^2)', 'int(x^2, x, 0, 1)', 'lim(x -> 0, sin(x)/x)',
    'diff(x^3, x, 2)', '[[1, 2], [3, 4]]', 'det([[1, 2], [3, 4]])', '|x| + 3! + root(3, 8) + log_2(8) + x_1 + sin^2 x + 30°', 'pi ~= 3.14', '(1, 2)'];
  for (const lang of ['ta', 'bn']) {
    for (const s of all) assert.ok(say(s, lang).length > 0, `${lang}: ${s}`);
    assert.match(describeStep({ node: parse('2').tree, role: 'denominator' }, { lang }), /: 2$/);
  }
});

test('every practice problem has a hint and prompt in every language', async () => {
  const { SETS, PROMPTS } = await import('../src/problems.js');
  for (const lang of languages()) {
    assert.ok(PROMPTS[lang], `prompts in ${lang}`);
    for (const set of SETS) {
      assert.ok(set.title[lang], `${set.id} title in ${lang}`);
      for (const p of set.problems) assert.ok(p.hint[lang], `${p.math} hint in ${lang}`);
    }
  }
});
