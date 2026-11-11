// Hindi phrasebook (हिन्दी). Follows how math is commonly read aloud in
// Indian classrooms: letters in their English names written in Devanagari,
// "x का वर्ग", "a बटा b", and Hindi word order (powers and roots after the base).
// First version: should be reviewed by Hindi-medium maths teachers.

const LETTERS = { a: 'ए', b: 'बी', c: 'सी', d: 'डी', e: 'ई', f: 'एफ़', g: 'जी', h: 'एच', i: 'आई', j: 'जे',
  k: 'के', l: 'एल', m: 'एम', n: 'एन', o: 'ओ', p: 'पी', q: 'क्यू', r: 'आर', s: 'एस', t: 'टी', u: 'यू',
  v: 'वी', w: 'डब्ल्यू', x: 'एक्स', y: 'वाई', z: 'ज़ेड' };
const CONSTS = { pi: 'पाई', theta: 'थीटा', alpha: 'अल्फ़ा', beta: 'बीटा', gamma: 'गामा', delta: 'डेल्टा',
  lambda: 'लैम्ब्डा', mu: 'म्यू', sigma: 'सिग्मा', phi: 'फ़ाई', omega: 'ओमेगा', infinity: 'अनंत',
  epsilon: 'एप्सिलॉन', rho: 'रो', tau: 'टाउ' };
const NAMED = { '1/2': 'आधा', '1/3': 'एक तिहाई', '2/3': 'दो तिहाई', '1/4': 'एक चौथाई', '3/4': 'तीन चौथाई' };
const FUNCS = { sin: 'साइन', cos: 'कॉस', tan: 'टैन', cot: 'कॉट', sec: 'सेक', csc: 'कोसेक', log: 'लॉग',
  ln: 'प्राकृतिक लॉग', exp: 'ई की घात', asin: 'साइन इनवर्स', acos: 'कॉस इनवर्स', atan: 'टैन इनवर्स',
  sinh: 'हाइपरबोलिक साइन', cosh: 'हाइपरबोलिक कॉस', tanh: 'हाइपरबोलिक टैन', det: 'सारणिक' };

const end = (word, yes) => (yes ? `, ${word} समाप्त,` : '');
const single = (x) => !x.includes(' ');

export const HI = {
  name: 'हिन्दी',
  speechLang: 'hi-IN',
  plus: 'प्लस',
  minus: 'माइनस',
  times: 'गुणा',
  plusMinus: 'प्लस या माइनस',

  number: (v) => v.replace('.', ' दशमलव '),
  letter: (c) => (c === c.toUpperCase() ? `कैपिटल ${LETTERS[c.toLowerCase()] || c}` : LETTERS[c] || c),
  constant: (name) => CONSTS[name] || name,
  negative: (x) => `ऋण ${x}`,

  namedFraction(num, den) {
    if (num.type !== 'num' || den.type !== 'num') return null;
    return NAMED[`${num.value}/${den.value}`] || null;
  },
  simpleFraction: (n, d) => `${n} बटा ${d}`,
  fraction: (n, d, e) => `भिन्न: अंश ${n}, और हर ${d}${end('भिन्न', e)}`,

  squared: (b) => `${b} का वर्ग`,
  cubed: (b) => `${b} का घन`,
  ordinal: (v) => v,
  letterOrdinal: (x) => x,
  // "x की 4 घात": the word घात closes the power, so x^n + 1 stays clear.
  ordinalPower: (b, ord) => `${b} की ${ord} घात`,
  negativePower: (b, x) => `${b} की ऋण ${x} घात`,
  power: (b, e, yes) => `${b} की घात ${e}${end('घात', yes)}`,

  subscript: (b, s, yes) => `${b} सब ${s}${end('सब', yes)}`,
  sqrt: (x, yes) => (single(x) ? `${x} का वर्गमूल` : `वर्गमूल: ${x}${end('वर्गमूल', yes)}`),
  root(indexWords, indexNode, x, yes) {
    const which = indexNode.type === 'num' && indexNode.value === '3' ? 'घनमूल' : `${indexWords} वाँ मूल`;
    return single(x) ? `${x} का ${which}` : `${which}: ${x}${end(which, yes)}`;
  },
  abs: (x, yes) => (single(x) ? `${x} का निरपेक्ष मान` : `निरपेक्ष मान: ${x}${end('निरपेक्ष मान', yes)}`),
  factorial: (x) => `${x} फ़ैक्टोरियल`,
  quantity: (x, yes) => `कोष्ठक में ${x}${yes ? ', कोष्ठक बंद,' : ''}`,
  func(name, base, arg, yes) {
    const word = FUNCS[name] || name;
    if (name === 'det') return `सारणिक: ${arg}${end('सारणिक', yes)}`;
    return `${word}${base ? ` आधार ${base},` : ''} ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'स्क्वेयर'
      : expNode.type === 'num' && expNode.value === '3' ? 'क्यूब' : `की घात ${expWords},`;
    return `${word}${base ? ` आधार ${base},` : ''} ${pw} ${arg}${end(word, yes)}`;
  },
  degrees: (x) => `${x} डिग्री`,
  bigop(op, lo, up, body, yes) {
    const word = op === 'sum' ? 'योग' : 'गुणनफल';
    return `${word}, ${lo} से ${up} तक: ${body}${end(word, yes)}`;
  },
  integral: (lo, up, body, v) => (lo === null ? `समाकल: ${body}, डी ${v},` : `${lo} से ${up} तक समाकल: ${body}, डी ${v},`),
  limit: (v, to, body, yes) => `सीमा, जब ${v}, ${to} की ओर जाता है: ${body}${end('सीमा', yes)}`,
  deriv(order, v, body, yes) {
    const which = order === 1 ? 'अवकलज' : order === 2 ? 'द्वितीय अवकलज' : order === 3 ? 'तृतीय अवकलज' : `${order} कोटि का अवकलज`;
    return `${v} के सापेक्ष ${which}: ${body}${end('अवकलज', yes)}`;
  },
  matrix: (rows) => `${rows.length} गुणा ${rows[0].length} आव्यूह: ${rows.map((r, i) => `पंक्ति ${i + 1}: ${r.join(', ')}`).join('; ')}; आव्यूह समाप्त,`,
  row: (items) => items.join(', '),
  relation(items, ops) {
    const pair = (a, op, b) => ({
      '=': `${a} बराबर ${b}`,
      '!=': `${a}, ${b} के बराबर नहीं है`,
      '<': `${a}, ${b} से कम है`,
      '>': `${a}, ${b} से अधिक है`,
      '<=': `${a}, ${b} से कम या बराबर है`,
      '>=': `${a}, ${b} से अधिक या बराबर है`,
      '~=': `${a}, ${b} के लगभग बराबर है`,
    })[op];
    if (ops.every((o) => o === '=')) return items.join(' बराबर ');
    return ops.map((op, i) => pair(items[i], op, items[i + 1])).join(', और ');
  },
  list: (items) => (items.length === 2 ? `बिंदु ${items[0]}, कॉमा, ${items[1]}` : `सूची ${items.join(', कॉमा, ')}`),

  errors: {
    symbol: (c) => `मैं यह चिह्न नहीं पहचानता: "${c}"।`,
    empty: () => 'शुरू करने के लिए कुछ गणित लिखिए।',
    ambiguousFraction: () => 'इसके दो अर्थ हो सकते हैं, जैसे 1/2x: (1/2)·x या 1/(2x)। मैंने इसे (1/2)·x पढ़ा है। साफ़ करने के लिए कोष्ठक लगाइए।',
    numberAfter: () => 'अक्षर या कोष्ठक के बाद आई संख्या को गुणा माना गया है। साफ़ करने के लिए * लगाइए।',
    missingPower: () => '^ (घात) के बाद कुछ छूट गया है।',
    missingAfter: (n) => `${n} के बाद कुछ छूट गया है।`,
    endsEarly: () => 'गणित बीच में ही ख़त्म हो गया। क्या अंत में कुछ छूट गया है?',
    unclosed: () => 'एक कोष्ठक खोला गया, पर बंद नहीं किया गया।',
    unclosedAbs: () => 'निरपेक्ष मान की रेखा | खोली गई, पर बंद नहीं की गई।',
    rootForm: () => 'मूल ऐसे लिखिए: root(3, x), यानी x का घनमूल।',
    extraClose: () => 'एक कोष्ठक बंद किया गया है, जो खोला ही नहीं गया था।',
    cantGo: (v) => `"${v}" यहाँ नहीं आ सकता।`,
    unexpected: (v) => `यहाँ "${v}" की उम्मीद नहीं थी।`,
    calcForm: (f) => `ऐसे लिखिए: ${f}।`,
    at: (n) => `(अक्षर ${n} पर)`,
  },
  keyHelp: 'तीर वाली कुंजियों से समझिए। नीचे: भाग के अंदर जाइए, ऊपर: बाहर आइए, बाएँ और दाएँ: भागों के बीच चलिए। स्पेस: फिर से सुनिए। होम: पूरा व्यंजक। W: आप कहाँ हैं।',
  whereLabel: 'आप यहाँ हैं',
  explorer: 'गणित एक्सप्लोरर',

  roles: { numerator: 'अंश', denominator: 'हर', base: 'आधार', exponent: 'घात', subscript: 'सबस्क्रिप्ट',
    radicand: 'मूल के अंदर', index: 'मूल का क्रम', argument: 'अंदर', inside: 'अंदर', term: 'पद',
    factor: 'गुणनखंड', side: 'पक्ष', item: 'मान', from: 'निचली सीमा', to: 'ऊपरी सीमा', body: 'व्यंजक',
    integrand: 'समाकल्य', variable: 'चर', approaches: 'किसकी ओर', function: 'फलन', row: 'पंक्ति', entry: 'अवयव' },
  ofCount: (i, n) => `${i}, ${n} में से`,
  wholeThing: 'पूरा व्यंजक',
  nothingInside: 'इस भाग के अंदर और कुछ नहीं है।',
  atTop: 'आप पूरे व्यंजक पर हैं।',
  lastPart: 'दाईं ओर और भाग नहीं हैं।',
  firstPart: 'बाईं ओर और भाग नहीं हैं।',
};
