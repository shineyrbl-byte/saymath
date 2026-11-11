// English phrasebook. Each function builds one spoken pattern.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const DENS = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'] };
const FUNCS = { sin: 'sine', cos: 'cosine', tan: 'tangent', cot: 'cotangent', sec: 'secant', csc: 'cosecant',
  log: 'log', ln: 'natural log', exp: 'exponential', asin: 'inverse sine', acos: 'inverse cosine',
  atan: 'inverse tangent', sinh: 'hyperbolic sine', cosh: 'hyperbolic cosine', tanh: 'hyperbolic tangent',
  det: 'determinant' };
const RELS = { '=': 'equals', '<': 'is less than', '>': 'is greater than', '<=': 'is less than or equal to',
  '>=': 'is greater than or equal to', '!=': 'is not equal to', '~=': 'is approximately equal to' };

const end = (word, yes) => (yes ? `, end ${word},` : '');

export const EN = {
  name: 'English',
  speechLang: 'en-IN',
  plus: 'plus',
  minus: 'minus',
  times: 'times',
  plusMinus: 'plus or minus',

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
    if (name === 'det') return `the determinant of ${arg}${end('determinant', yes)}`;
    return `${word}${base ? ` base ${base}` : ''} of ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'squared'
      : expNode.type === 'num' && expNode.value === '3' ? 'cubed' : `to the power ${expWords}`;
    return `${word}${base ? ` base ${base}` : ''} ${pw} of ${arg}${end(word, yes)}`;
  },
  degrees: (x) => `${x} ${x === '1' ? 'degree' : 'degrees'}`,
  bigop: (op, lo, up, body, yes) => `the ${op === 'sum' ? 'sum' : 'product'} from ${lo} to ${up} of ${body}${end(op === 'sum' ? 'sum' : 'product', yes)}`,
  integral: (lo, up, body, v) => (lo === null ? `the integral of ${body}, d ${v},` : `the integral from ${lo} to ${up} of ${body}, d ${v},`),
  limit: (v, to, body, yes) => `the limit as ${v} approaches ${to} of ${body}${end('limit', yes)}`,
  deriv(order, v, body, yes) {
    const which = order === 1 ? 'derivative' : order === 2 ? 'second derivative' : order === 3 ? 'third derivative' : `${EN.ordinal(String(order))} derivative`;
    return `the ${which} with respect to ${v} of ${body}${end('derivative', yes)}`;
  },
  matrix: (rows) => `the ${rows.length} by ${rows[0].length} matrix: ${rows.map((r, i) => `row ${i + 1}: ${r.join(', ')}`).join('; ')}; end matrix,`,
  row: (items) => items.join(', '),
  relation(items, ops) {
    let out = items[0];
    ops.forEach((op, i) => { out += ` ${RELS[op]} ${items[i + 1]}`; });
    return out;
  },
  list: (items) => (items.length === 2 ? `the point ${items[0]}, comma, ${items[1]}` : `the list ${items.join(', comma, ')}`),

  // Parser messages, by code (see ParseError in parser.js).
  errors: {
    symbol: (c) => `I don't know the symbol "${c}".`,
    empty: () => 'Type some math to start.',
    ambiguousFraction: () => 'This could mean two things, like 1/2x: (1/2)·x or 1/(2x). I read it as (1/2)·x. Add brackets to make it clear.',
    numberAfter: () => 'A number after a letter or bracket was read as multiplication. Use * to make it clear.',
    missingPower: () => 'Something is missing after ^ (the power).',
    missingAfter: (n) => `Something is missing after ${n}.`,
    endsEarly: () => 'The math ends too early. Is something missing at the end?',
    unclosed: () => 'A bracket was opened but never closed.',
    unclosedAbs: () => 'An absolute value bar | was opened but never closed.',
    rootForm: () => 'Write a root like root(3, x) for the cube root of x.',
    extraClose: () => 'There is a closing bracket with no opening bracket.',
    cantGo: (v) => `"${v}" can't go here.`,
    unexpected: (v) => `I didn't expect "${v}" here.`,
    calcForm: (f) => `Write it like ${f}.`,
    at: (n) => `(at character ${n})`,
  },
  keyHelp: 'Use the arrow keys to explore. Down goes inside a part, Up comes back out, Left and Right move between parts. Space repeats. Home goes back to the whole thing. W says where you are.',
  whereLabel: 'You are on',
  explorer: 'math explorer',

  roles: { numerator: 'numerator', denominator: 'denominator', base: 'base', exponent: 'exponent',
    subscript: 'subscript', radicand: 'inside the root', index: 'root index', argument: 'inside',
    inside: 'inside', term: 'term', factor: 'factor', side: 'side', item: 'item', from: 'lower limit',
    to: 'upper limit', body: 'expression', integrand: 'integrand', variable: 'variable', approaches: 'approaches',
    function: 'function', row: 'row', entry: 'entry' },
  ofCount: (i, n) => `${i} of ${n}`,
  wholeThing: 'whole expression',
  nothingInside: 'Nothing further inside this part.',
  atTop: 'You are at the whole expression.',
  lastPart: 'No more parts to the right.',
  firstPart: 'No more parts to the left.',
};
