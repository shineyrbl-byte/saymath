// Marathi phrasebook (मराठी). Follows how maths is commonly read aloud in
// Marathi-medium classrooms: letters in their English names written in
// Devanagari, "x चा वर्ग", "a भागिले b", and Marathi word order.
// First version: should be reviewed by Marathi-medium maths teachers.

const LETTERS = { a: 'ए', b: 'बी', c: 'सी', d: 'डी', e: 'ई', f: 'एफ', g: 'जी', h: 'एच', i: 'आय', j: 'जे',
  k: 'के', l: 'एल', m: 'एम', n: 'एन', o: 'ओ', p: 'पी', q: 'क्यू', r: 'आर', s: 'एस', t: 'टी', u: 'यू',
  v: 'व्ही', w: 'डब्ल्यू', x: 'एक्स', y: 'वाय', z: 'झेड' };
const CONSTS = { pi: 'पाय', theta: 'थीटा', alpha: 'अल्फा', beta: 'बीटा', gamma: 'गॅमा', delta: 'डेल्टा',
  epsilon: 'एप्सिलॉन', lambda: 'लॅम्डा', mu: 'म्यू', rho: 'ऱ्हो', sigma: 'सिग्मा', tau: 'टाउ', phi: 'फाय',
  omega: 'ओमेगा', infinity: 'अनंत' };
const NAMED = { '1/2': 'अर्धा', '1/3': 'एक तृतीयांश', '2/3': 'दोन तृतीयांश', '1/4': 'एक चतुर्थांश', '3/4': 'तीन चतुर्थांश' };
const FUNCS = { sin: 'साइन', cos: 'कॉस', tan: 'टॅन', cot: 'कॉट', sec: 'सेक', csc: 'कोसेक', log: 'लॉग',
  ln: 'नैसर्गिक लॉग', exp: 'ई चा घात', asin: 'साइन इन्व्हर्स', acos: 'कॉस इन्व्हर्स', atan: 'टॅन इन्व्हर्स',
  sinh: 'हायपरबोलिक साइन', cosh: 'हायपरबोलिक कॉस', tanh: 'हायपरबोलिक टॅन', det: 'निश्चयक' };

const end = (word, yes) => (yes ? `, ${word} समाप्त,` : '');
const single = (x) => !x.includes(' ');

export const MR = {
  name: 'मराठी',
  speechLang: 'mr-IN',
  // Many devices have no Marathi voice; a Hindi voice reads Devanagari well enough.
  fallbackSpeechLang: 'hi-IN',
  plus: 'अधिक',
  minus: 'वजा',
  times: 'गुणिले',
  plusMinus: 'अधिक किंवा वजा',

  number: (v) => v.replace('.', ' पूर्णांक '),
  letter: (c) => (c === c.toUpperCase() ? `कॅपिटल ${LETTERS[c.toLowerCase()] || c}` : LETTERS[c] || c),
  constant: (name) => CONSTS[name] || name,
  negative: (x) => `ऋण ${x}`,

  namedFraction(num, den) {
    if (num.type !== 'num' || den.type !== 'num') return null;
    return NAMED[`${num.value}/${den.value}`] || null;
  },
  simpleFraction: (n, d) => `${n} भागिले ${d}`,
  fraction: (n, d, e) => `अपूर्णांक: अंश ${n}, आणि छेद ${d}${end('अपूर्णांक', e)}`,

  squared: (b) => `${b} चा वर्ग`,
  cubed: (b) => `${b} चा घन`,
  ordinal: (v) => v,
  letterOrdinal: (x) => x,
  // "x चा 4 था घात": the word घात closes the power, as in Hindi.
  ordinalPower: (b, ord) => `${b} चा ${ord} घात`,
  negativePower: (b, x) => `${b} चा ऋण ${x} घात`,
  power: (b, e, yes) => `${b} चा घात ${e}${end('घात', yes)}`,

  subscript: (b, s, yes) => `${b} सब ${s}${end('सब', yes)}`,
  sqrt: (x, yes) => (single(x) ? `${x} चे वर्गमूळ` : `वर्गमूळ: ${x}${end('वर्गमूळ', yes)}`),
  root(indexWords, indexNode, x, yes) {
    const which = indexNode.type === 'num' && indexNode.value === '3' ? 'घनमूळ' : `${indexWords} वे मूळ`;
    return single(x) ? `${x} चे ${which}` : `${which}: ${x}${end(which, yes)}`;
  },
  abs: (x, yes) => (single(x) ? `${x} चे निरपेक्ष मूल्य` : `निरपेक्ष मूल्य: ${x}${end('निरपेक्ष मूल्य', yes)}`),
  factorial: (x) => `${x} फॅक्टोरियल`,
  quantity: (x, yes) => `कंसात ${x}${yes ? ', कंस बंद,' : ''}`,
  func(name, base, arg, yes) {
    const word = FUNCS[name] || name;
    if (name === 'det') return `निश्चयक: ${arg}${end('निश्चयक', yes)}`;
    return `${word}${base ? ` पाया ${base},` : ''} ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'स्क्वेअर'
      : expNode.type === 'num' && expNode.value === '3' ? 'क्यूब' : `चा घात ${expWords},`;
    return `${word}${base ? ` पाया ${base},` : ''} ${pw} ${arg}${end(word, yes)}`;
  },
  degrees: (x) => `${x} डिग्री`,
  bigop(op, lo, up, body, yes) {
    const word = op === 'sum' ? 'बेरीज' : 'गुणाकार';
    return `${word}, ${lo} पासून ${up} पर्यंत: ${body}${end(word, yes)}`;
  },
  integral: (lo, up, body, v) => (lo === null ? `संकलन: ${body}, डी ${v},` : `${lo} पासून ${up} पर्यंत संकलन: ${body}, डी ${v},`),
  limit: (v, to, body, yes) => `लक्ष, जेव्हा ${v}, ${to} कडे जातो: ${body}${end('लक्ष', yes)}`,
  deriv(order, v, body, yes) {
    const which = order === 1 ? 'विकलज' : order === 2 ? 'द्वितीय विकलज' : order === 3 ? 'तृतीय विकलज' : `${order} कोटीचा विकलज`;
    return `${v} च्या सापेक्ष ${which}: ${body}${end('विकलज', yes)}`;
  },
  matrix: (rows) => `${rows.length} गुणिले ${rows[0].length} आव्यूह: ${rows.map((r, i) => `ओळ ${i + 1}: ${r.join(', ')}`).join('; ')}; आव्यूह समाप्त,`,
  row: (items) => items.join(', '),
  relation(items, ops) {
    const pair = (a, op, b) => ({
      '=': `${a} बरोबर ${b}`,
      '!=': `${a}, ${b} च्या बरोबर नाही`,
      '<': `${a}, ${b} पेक्षा लहान आहे`,
      '>': `${a}, ${b} पेक्षा मोठा आहे`,
      '<=': `${a}, ${b} पेक्षा लहान किंवा बरोबर आहे`,
      '>=': `${a}, ${b} पेक्षा मोठा किंवा बरोबर आहे`,
      '~=': `${a}, ${b} च्या जवळपास बरोबर आहे`,
    })[op];
    if (ops.every((o) => o === '=')) return items.join(' बरोबर ');
    return ops.map((op, i) => pair(items[i], op, items[i + 1])).join(', आणि ');
  },
  list: (items) => (items.length === 2 ? `बिंदू ${items[0]}, स्वल्पविराम, ${items[1]}` : `यादी ${items.join(', स्वल्पविराम, ')}`),

  errors: {
    symbol: (c) => `मला हे चिन्ह ओळखता येत नाही: "${c}".`,
    empty: () => 'सुरू करण्यासाठी थोडे गणित लिहा.',
    ambiguousFraction: () => 'याचे दोन अर्थ होऊ शकतात, जसे 1/2x: (1/2)·x किंवा 1/(2x). मी ते (1/2)·x असे वाचले. स्पष्ट करण्यासाठी कंस लावा.',
    numberAfter: () => 'अक्षर किंवा कंसानंतरची संख्या गुणाकार मानली आहे. स्पष्ट करण्यासाठी * लावा.',
    missingPower: () => '^ (घात) नंतर काहीतरी राहिले आहे.',
    missingAfter: (n) => `${n} नंतर काहीतरी राहिले आहे.`,
    endsEarly: () => 'गणित मध्येच संपले. शेवटी काही राहिले आहे का?',
    unclosed: () => 'एक कंस उघडला, पण बंद केला नाही.',
    unclosedAbs: () => 'निरपेक्ष मूल्याची रेषा | उघडली, पण बंद केली नाही.',
    rootForm: () => 'मूळ असे लिहा: root(3, x), म्हणजे x चे घनमूळ.',
    extraClose: () => 'एक कंस बंद केला आहे, जो उघडलाच नव्हता.',
    cantGo: (v) => `"${v}" इथे येऊ शकत नाही.`,
    unexpected: (v) => `इथे "${v}" अपेक्षित नव्हते.`,
    calcForm: (f) => `असे लिहा: ${f}.`,
    at: (n) => `(अक्षर ${n} वर)`,
  },
  keyHelp: 'बाणाच्या कळांनी समजून घ्या. खाली: भागाच्या आत जा, वर: बाहेर या, डावी आणि उजवी: भागांमध्ये फिरा. स्पेस: पुन्हा ऐका. होम: संपूर्ण राशी. W: तुम्ही कुठे आहात.',
  whereLabel: 'तुम्ही इथे आहात',
  explorer: 'गणित एक्सप्लोरर',

  roles: { numerator: 'अंश', denominator: 'छेद', base: 'पाया', exponent: 'घातांक', subscript: 'सबस्क्रिप्ट',
    radicand: 'मुळाखाली', index: 'मुळाचा क्रम', argument: 'आत', inside: 'आत', term: 'पद', factor: 'अवयव',
    side: 'बाजू', item: 'घटक', from: 'खालची मर्यादा', to: 'वरची मर्यादा', body: 'राशी', integrand: 'संकल्य',
    variable: 'चल', approaches: 'कशाकडे', function: 'फल', row: 'ओळ', entry: 'घटक' },
  ofCount: (i, n) => `${n} पैकी ${i}`,
  wholeThing: 'संपूर्ण राशी',
  nothingInside: 'या भागात आणखी काही नाही.',
  atTop: 'तुम्ही संपूर्ण राशीवर आहात.',
  lastPart: 'उजवीकडे आणखी भाग नाहीत.',
  firstPart: 'डावीकडे आणखी भाग नाहीत.',
};
