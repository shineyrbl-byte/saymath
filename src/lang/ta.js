// Tamil phrasebook (தமிழ்). PREVIEW: written without review by
// Tamil-medium maths teachers; please treat the wording as a draft.
// Letters stay as English letters (x, y, b, p): Tamil script writes b and p,
// d and t the same way, which would make the maths ambiguous.

const CONSTS = { pi: 'பை', theta: 'தீட்டா', alpha: 'ஆல்ஃபா', beta: 'பீட்டா', gamma: 'காமா', delta: 'டெல்டா',
  epsilon: 'எப்சிலான்', lambda: 'லாம்டா', mu: 'மியூ', rho: 'ரோ', sigma: 'சிக்மா', tau: 'டாவ்', phi: 'ஃபை',
  omega: 'ஒமேகா', infinity: 'முடிவிலி' };
const NAMED = { '1/2': 'அரை', '1/4': 'கால்', '3/4': 'முக்கால்' };
const FUNCS = { sin: 'சைன்', cos: 'காஸ்', tan: 'டேன்', cot: 'காட்', sec: 'செக்', csc: 'கோசெக்', log: 'லாக்',
  ln: 'இயல் மடக்கை', exp: 'e இன் அடுக்கு', asin: 'சைன் இன்வர்ஸ்', acos: 'காஸ் இன்வர்ஸ்', atan: 'டேன் இன்வர்ஸ்',
  sinh: 'ஹைப்பர்போலிக் சைன்', cosh: 'ஹைப்பர்போலிக் காஸ்', tanh: 'ஹைப்பர்போலிக் டேன்', det: 'அணிக்கோவை' };

const end = (word, yes) => (yes ? `, ${word} முடிவு,` : '');
const single = (x) => !x.includes(' ');

export const TA = {
  name: 'தமிழ்',
  speechLang: 'ta-IN',
  preview: true,
  plus: 'கூட்டல்',
  minus: 'கழித்தல்',
  times: 'பெருக்கல்',
  plusMinus: 'கூட்டல் அல்லது கழித்தல்',

  number: (v) => v.replace('.', ' புள்ளி '),
  letter: (c) => (c === c.toUpperCase() ? `கேப்பிட்டல் ${c}` : c),
  constant: (name) => CONSTS[name] || name,
  negative: (x) => `குறை ${x}`,

  namedFraction(num, den) {
    if (num.type !== 'num' || den.type !== 'num') return null;
    return NAMED[`${num.value}/${den.value}`] || null;
  },
  // "4 இல் 3" is 3/4.
  simpleFraction: (n, d) => `${d} இல் ${n}`,
  fraction: (n, d, e) => `பின்னம்: தொகுதி ${n}, மற்றும் பகுதி ${d}${end('பின்னம்', e)}`,

  squared: (b) => `${b} இன் வர்க்கம்`,
  cubed: (b) => `${b} இன் கனம்`,
  ordinal: (v) => v,
  letterOrdinal: (x) => x,
  ordinalPower: (b, ord) => `${b} இன் ${ord} அடுக்கு`,
  negativePower: (b, x) => `${b} இன் குறை ${x} அடுக்கு`,
  power: (b, e, yes) => `${b} இன் அடுக்கு ${e}${end('அடுக்கு', yes)}`,

  subscript: (b, s, yes) => `${b} சப் ${s}${end('சப்', yes)}`,
  sqrt: (x, yes) => (single(x) ? `${x} இன் வர்க்கமூலம்` : `வர்க்கமூலம்: ${x}${end('வர்க்கமூலம்', yes)}`),
  root(indexWords, indexNode, x, yes) {
    const which = indexNode.type === 'num' && indexNode.value === '3' ? 'கனமூலம்' : `${indexWords} ஆம் மூலம்`;
    return single(x) ? `${x} இன் ${which}` : `${which}: ${x}${end(which, yes)}`;
  },
  abs: (x, yes) => (single(x) ? `${x} இன் தனி மதிப்பு` : `தனி மதிப்பு: ${x}${end('தனி மதிப்பு', yes)}`),
  factorial: (x) => `${x} ஃபேக்டோரியல்`,
  quantity: (x, yes) => `அடைப்புக்குள் ${x}${yes ? ', அடைப்பு முடிவு,' : ''}`,
  func(name, base, arg, yes) {
    const word = FUNCS[name] || name;
    return `${word}${base ? ` அடிமானம் ${base},` : ''} ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'ஸ்கொயர்'
      : expNode.type === 'num' && expNode.value === '3' ? 'க்யூப்' : `இன் அடுக்கு ${expWords},`;
    return `${word}${base ? ` அடிமானம் ${base},` : ''} ${pw} ${arg}${end(word, yes)}`;
  },
  degrees: (x) => `${x} டிகிரி`,
  bigop(op, lo, up, body, yes) {
    const word = op === 'sum' ? 'கூட்டுத்தொகை' : 'பெருக்குத்தொகை';
    return `${word}, ${lo} முதல் ${up} வரை: ${body}${end(word, yes)}`;
  },
  integral: (lo, up, body, v) => (lo === null ? `தொகையீடு: ${body}, d ${v},` : `${lo} முதல் ${up} வரை தொகையீடு: ${body}, d ${v},`),
  limit: (v, to, body, yes) => `எல்லை, ${v}, ${to} ஐ நெருங்கும்போது: ${body}${end('எல்லை', yes)}`,
  deriv(order, v, body, yes) {
    const which = order === 1 ? 'வகைக்கெழு' : order === 2 ? 'இரண்டாம் வகைக்கெழு' : order === 3 ? 'மூன்றாம் வகைக்கெழு' : `${order} ஆம் வகைக்கெழு`;
    return `${v} ஐப் பொறுத்து ${which}: ${body}${end('வகைக்கெழு', yes)}`;
  },
  matrix: (rows) => `${rows.length} க்கு ${rows[0].length} அணி: ${rows.map((r, i) => `வரிசை ${i + 1}: ${r.join(', ')}`).join('; ')}; அணி முடிவு,`,
  row: (items) => items.join(', '),
  relation(items, ops) {
    const pair = (a, op, b) => ({
      '=': `${a} சமம் ${b}`,
      '!=': `${a}, ${b} க்கு சமம் அல்ல`,
      '<': `${a}, ${b} ஐ விட சிறியது`,
      '>': `${a}, ${b} ஐ விட பெரியது`,
      '<=': `${a}, ${b} ஐ விட சிறியது அல்லது சமம்`,
      '>=': `${a}, ${b} ஐ விட பெரியது அல்லது சமம்`,
      '~=': `${a}, ${b} க்கு தோராயமாக சமம்`,
    })[op];
    if (ops.every((o) => o === '=')) return items.join(' சமம் ');
    return ops.map((op, i) => pair(items[i], op, items[i + 1])).join(', மற்றும் ');
  },
  list: (items) => (items.length === 2 ? `புள்ளி ${items[0]}, கமா, ${items[1]}` : `பட்டியல் ${items.join(', கமா, ')}`),

  keyHelp: 'அம்புக்குறி விசைகளால் ஆராயுங்கள். கீழே: பகுதிக்குள் செல்லுங்கள், மேலே: வெளியே வாருங்கள், இடது மற்றும் வலது: பகுதிகளுக்கு இடையே நகருங்கள். ஸ்பேஸ்: மீண்டும் கேளுங்கள். ஹோம்: முழு கோவை. W: நீங்கள் எங்கே இருக்கிறீர்கள்.',
  whereLabel: 'நீங்கள் இருப்பது',
  explorer: 'கணித எக்ஸ்ப்ளோரர்',
  roles: { numerator: 'தொகுதி', denominator: 'பகுதி', base: 'அடிமானம்', exponent: 'அடுக்கு', subscript: 'கீழொட்டு',
    radicand: 'மூலத்தின் உள்ளே', index: 'மூலத்தின் வரிசை', argument: 'உள்ளே', inside: 'உள்ளே', term: 'உறுப்பு',
    factor: 'காரணி', side: 'பக்கம்', item: 'உருப்படி', from: 'கீழ் எல்லை', to: 'மேல் எல்லை', body: 'கோவை',
    integrand: 'தொகைச்சார்பு', variable: 'மாறி', approaches: 'நெருங்குவது', function: 'சார்பு', row: 'வரிசை', entry: 'உறுப்பு' },
  ofCount: (i, n) => `${n} இல் ${i}`,
  wholeThing: 'முழு கோவை',
  nothingInside: 'இந்தப் பகுதிக்குள் வேறு எதுவும் இல்லை.',
  atTop: 'நீங்கள் முழு கோவையில் இருக்கிறீர்கள்.',
  lastPart: 'வலதுபுறம் வேறு பகுதிகள் இல்லை.',
  firstPart: 'இடதுபுறம் வேறு பகுதிகள் இல்லை.',
};
