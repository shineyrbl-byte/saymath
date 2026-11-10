// English phrasebook. Each function builds one spoken pattern.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const DENS = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'] };
const FUNCS = { sin: 'sine', cos: 'cosine', tan: 'tangent', cot: 'cotangent', sec: 'secant', csc: 'cosecant',
  log: 'log', ln: 'natural log', exp: 'exponential' };
const RELS = { '=': 'equals', '<': 'is less than', '>': 'is greater than', '<=': 'is less than or equal to',
  '>=': 'is greater than or equal to', '!=': 'is not equal to' };

const end = (word, yes) => (yes ? `, end ${word},` : '');

export const EN = {
  name: 'English',
  speechLang: 'en-IN',
  plus: 'plus',
  minus: 'minus',
  times: 'times',

  number: (v) => v.replace('.', ' point '),
  letter: (c) => (c === c.toUpperCase() ? `capital ${c}` : c),
  constant: (name) => (name === 'infinity' ? 'infinity' : name),
  negative: (x) => `negative ${x}`,

  namedFraction(num, den) {
    if (num.type !== 'num' || den.type !== 'num') return null;
    const n = Number(num.value);
    const d = Number(den.value);
    if (!Number.isInteger(n) || !Number.isInteger(d) || n < 1 || n > 9 || !DENS[d]) return null;
    return `${ONES[n]} ${DENS[d][n === 1 ? 0 : 1]}`;
  },
  simpleFraction: (n, d) => `${n} over ${d}`,
  fraction: (n, d, e) => `the fraction with numerator ${n}, and denominator ${d}${end('fraction', e)}`,

  squared: (b) => `${b} squared`,
  cubed: (b) => `${b} cubed`,
  ordinal(v) {
    const n = Number(v);
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
    return `${v}${s}`;
  },
  letterOrdinal: (x) => `${x}-th`,
  ordinalPower: (b, ord) => `${b} to the ${ord} power`,
  negativePower: (b, x) => `${b} to the negative ${x} power`,
  power: (b, e, yes) => `${b} to the power ${e}${end('power', yes)}`,

  subscript: (b, s, yes) => `${b} sub ${s}${end('sub', yes)}`,
  sqrt: (x, yes) => `the square root of ${x}${end('root', yes)}`,
  root(indexWords, indexNode, x, yes) {
    const which = indexNode.type === 'num' && indexNode.value === '3' ? 'cube'
      : indexNode.type === 'num' ? EN.ordinal(indexNode.value) : `${indexWords}-th`;
    return `the ${which} root of ${x}${end('root', yes)}`;
  },
  abs: (x, yes) => `the absolute value of ${x}${end('absolute value', yes)}`,
  factorial: (x) => `${x} factorial`,
  quantity: (x, yes) => `the quantity ${x}${end('quantity', yes)}`,
  func(name, base, arg, yes) {
    const word = FUNCS[name] || name;
    if (name === 'exp') return `e to the power ${arg}${end('power', yes)}`;
    return `${word}${base ? ` base ${base}` : ''} of ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'squared'
      : expNode.type === 'num' && expNode.value === '3' ? 'cubed' : `to the power ${expWords}`;
    return `${word}${base ? ` base ${base}` : ''} ${pw} of ${arg}${end(word, yes)}`;
  },
  relation(items, ops) {
    let out = items[0];
    ops.forEach((op, i) => { out += ` ${RELS[op]} ${items[i + 1]}`; });
    return out;
  },
  list: (items) => (items.length === 2 ? `the point ${items[0]}, comma, ${items[1]}` : `the list ${items.join(', comma, ')}`),

  roles: { numerator: 'numerator', denominator: 'denominator', base: 'base', exponent: 'exponent',
    subscript: 'subscript', radicand: 'inside the root', index: 'root index', argument: 'inside',
    inside: 'inside', term: 'term', factor: 'factor', side: 'side', item: 'item' },
  ofCount: (i, n) => `${i} of ${n}`,
  wholeThing: 'whole expression',
  nothingInside: 'Nothing further inside this part.',
  atTop: 'You are at the whole expression.',
  lastPart: 'No more parts to the right.',
  firstPart: 'No more parts to the left.',
};
