import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { speak } from '../src/speak.js';

const say = (s) => speak(parse(s).tree, { lang: 'hi' });

test('Hindi basics', () => {
  assert.equal(say('x^2 + 1/2'), 'एक्स का वर्ग प्लस आधा');
  assert.equal(say('a/b'), 'ए बटा बी');
  assert.equal(say('sqrt(9)'), '9 का वर्गमूल');
  assert.equal(say('x + 3 = 5'), 'एक्स प्लस 3 बराबर 5');
});

test('Hindi keeps groups clear', () => {
  assert.equal(say('x^n + 1'), 'एक्स की एन घात प्लस 1');
  assert.equal(say('x^(n+1)'), 'एक्स की घात एन प्लस 1, घात समाप्त');
  assert.equal(say('sqrt(x+1)'), 'वर्गमूल: एक्स प्लस 1, वर्गमूल समाप्त');
  assert.equal(say('(x+1)/(x-1)'), 'भिन्न: अंश एक्स प्लस 1, और हर एक्स माइनस 1, भिन्न समाप्त');
});

test('Hindi inequalities use Hindi word order', () => {
  assert.equal(say('x < 5'), 'एक्स, 5 से कम है');
  assert.equal(say('2x >= 3'), '2 एक्स, 3 से अधिक या बराबर है');
});
