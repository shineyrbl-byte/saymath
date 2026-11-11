// Marathi (मराठी) speech: Marathi word order, and the same "say where groups end" rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { speak, describeStep, explain, languages } from '../src/speak.js';

const mr = (s, mode) => speak(parse(s).tree, { lang: 'mr', mode });

test('Marathi is a registered language', () => {
  assert.ok(languages().includes('mr'));
});

test('powers, roots and fractions in Marathi word order', () => {
  assert.equal(mr('x^2 + 3x'), 'एक्स चा वर्ग अधिक 3 एक्स');
  assert.equal(mr('x^n + 1'), 'एक्स चा एन घात अधिक 1');
  assert.equal(mr('x^(n+1)'), 'एक्स चा घात एन अधिक 1, घात समाप्त');
  assert.equal(mr('a/b'), 'ए भागिले बी');
  assert.equal(mr('1/2 + 3/4'), 'अर्धा अधिक तीन चतुर्थांश');
  assert.equal(mr('sqrt(x + 1)'), 'वर्गमूळ: एक्स अधिक 1, वर्गमूळ समाप्त');
  assert.equal(mr('sqrt(x) + 1'), 'एक्स चे वर्गमूळ अधिक 1');
});

test('the quadratic formula in Marathi', () => {
  assert.equal(mr('x = (-b + sqrt(b^2 - 4ac))/(2a)'),
    'एक्स बरोबर अपूर्णांक: अंश ऋण बी अधिक वर्गमूळ: बी चा वर्ग वजा 4 ए सी, वर्गमूळ समाप्त, आणि छेद 2 ए, अपूर्णांक समाप्त');
});

test('inequalities read as Marathi sentences', () => {
  assert.equal(mr('x < 5'), 'एक्स, 5 पेक्षा लहान आहे');
  assert.equal(mr('|2x - 3| <= 7'), 'निरपेक्ष मूल्य: 2 एक्स वजा 3, निरपेक्ष मूल्य समाप्त, 7 पेक्षा लहान किंवा बरोबर आहे');
});

test('calculus and matrices in Marathi', () => {
  assert.equal(mr('int(x^2, x, 0, 1)'), '0 पासून 1 पर्यंत संकलन: एक्स चा वर्ग, डी एक्स');
  assert.equal(mr('[[1, 2], [3, 4]]'), '2 गुणिले 2 आव्यूह: ओळ 1: 1, 2; ओळ 2: 3, 4; आव्यूह समाप्त');
});

test('explorer roles and error messages in Marathi', () => {
  const tree = parse('(x + 1)/2').tree;
  assert.equal(describeStep({ node: tree.den, role: 'denominator' }, { lang: 'mr' }), 'छेद: 2');
  try { parse('(x + 1'); } catch (e) { assert.equal(explain(e, 'mr'), 'एक कंस उघडला, पण बंद केला नाही.'); }
});
