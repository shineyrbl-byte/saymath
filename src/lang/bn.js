// Bengali phrasebook (বাংলা). PREVIEW: written without review by
// Bengali-medium maths teachers; please treat the wording as a draft.
// Letters use their English names in Bengali script, as read in class.

const LETTERS = { a: 'এ', b: 'বি', c: 'সি', d: 'ডি', e: 'ই', f: 'এফ', g: 'জি', h: 'এইচ', i: 'আই', j: 'জে',
  k: 'কে', l: 'এল', m: 'এম', n: 'এন', o: 'ও', p: 'পি', q: 'কিউ', r: 'আর', s: 'এস', t: 'টি', u: 'ইউ',
  v: 'ভি', w: 'ডাবলিউ', x: 'এক্স', y: 'ওয়াই', z: 'জেড' };
const CONSTS = { pi: 'পাই', theta: 'থিটা', alpha: 'আলফা', beta: 'বিটা', gamma: 'গামা', delta: 'ডেল্টা',
  epsilon: 'এপসাইলন', lambda: 'ল্যামডা', mu: 'মিউ', rho: 'রো', sigma: 'সিগমা', tau: 'টাউ', phi: 'ফাই',
  omega: 'ওমেগা', infinity: 'অসীম' };
const NAMED = { '1/2': 'অর্ধেক', '1/3': 'এক তৃতীয়াংশ', '2/3': 'দুই তৃতীয়াংশ', '1/4': 'এক চতুর্থাংশ', '3/4': 'তিন চতুর্থাংশ' };
const FUNCS = { sin: 'সাইন', cos: 'কস', tan: 'ট্যান', cot: 'কট', sec: 'সেক', csc: 'কোসেক', log: 'লগ',
  ln: 'স্বাভাবিক লগ', exp: 'ই এর ঘাত', asin: 'সাইন ইনভার্স', acos: 'কস ইনভার্স', atan: 'ট্যান ইনভার্স',
  sinh: 'হাইপারবোলিক সাইন', cosh: 'হাইপারবোলিক কস', tanh: 'হাইপারবোলিক ট্যান', det: 'নির্ণায়ক' };

const end = (word, yes) => (yes ? `, ${word} শেষ,` : '');
const single = (x) => !x.includes(' ');

export const BN = {
  name: 'বাংলা',
  speechLang: 'bn-IN',
  preview: true,
  plus: 'যোগ',
  minus: 'বিয়োগ',
  times: 'গুণ',
  plusMinus: 'যোগ অথবা বিয়োগ',

  number: (v) => v.replace('.', ' দশমিক '),
  letter: (c) => (c === c.toUpperCase() ? `ক্যাপিটাল ${LETTERS[c.toLowerCase()] || c}` : LETTERS[c] || c),
  constant: (name) => CONSTS[name] || name,
  negative: (x) => `ঋণাত্মক ${x}`,

  namedFraction(num, den) {
    if (num.type !== 'num' || den.type !== 'num') return null;
    return NAMED[`${num.value}/${den.value}`] || null;
  },
  // "৪ ভাগের ৩" is 3/4.
  simpleFraction: (n, d) => `${d} ভাগের ${n}`,
  fraction: (n, d, e) => `ভগ্নাংশ: লব ${n}, এবং হর ${d}${end('ভগ্নাংশ', e)}`,

  squared: (b) => `${b} এর বর্গ`,
  cubed: (b) => `${b} এর ঘন`,
  ordinal: (v) => v,
  letterOrdinal: (x) => x,
  ordinalPower: (b, ord) => `${b} এর ${ord} ঘাত`,
  negativePower: (b, x) => `${b} এর ঋণাত্মক ${x} ঘাত`,
  power: (b, e, yes) => `${b} এর ঘাত ${e}${end('ঘাত', yes)}`,

  subscript: (b, s, yes) => `${b} সাব ${s}${end('সাব', yes)}`,
  sqrt: (x, yes) => (single(x) ? `${x} এর বর্গমূল` : `বর্গমূল: ${x}${end('বর্গমূল', yes)}`),
  root(indexWords, indexNode, x, yes) {
    const which = indexNode.type === 'num' && indexNode.value === '3' ? 'ঘনমূল' : `${indexWords} তম মূল`;
    return single(x) ? `${x} এর ${which}` : `${which}: ${x}${end(which, yes)}`;
  },
  abs: (x, yes) => (single(x) ? `${x} এর পরম মান` : `পরম মান: ${x}${end('পরম মান', yes)}`),
  factorial: (x) => `${x} ফ্যাক্টোরিয়াল`,
  quantity: (x, yes) => `বন্ধনীর মধ্যে ${x}${yes ? ', বন্ধনী শেষ,' : ''}`,
  func(name, base, arg, yes) {
    const word = FUNCS[name] || name;
    return `${word}${base ? ` ভিত্তি ${base},` : ''} ${arg}${end(word, yes)}`;
  },
  funcPower(name, base, expWords, expNode, arg, yes) {
    const word = FUNCS[name] || name;
    const pw = expNode.type === 'num' && expNode.value === '2' ? 'স্কোয়ার'
      : expNode.type === 'num' && expNode.value === '3' ? 'কিউব' : `এর ঘাত ${expWords},`;
    return `${word}${base ? ` ভিত্তি ${base},` : ''} ${pw} ${arg}${end(word, yes)}`;
  },
  degrees: (x) => `${x} ডিগ্রি`,
  bigop(op, lo, up, body, yes) {
    const word = op === 'sum' ? 'যোগফল' : 'গুণফল';
    return `${word}, ${lo} থেকে ${up} পর্যন্ত: ${body}${end(word, yes)}`;
  },
  integral: (lo, up, body, v) => (lo === null ? `সমাকলন: ${body}, ডি ${v},` : `${lo} থেকে ${up} পর্যন্ত সমাকলন: ${body}, ডি ${v},`),
  limit: (v, to, body, yes) => `সীমা, যখন ${v}, ${to} এর দিকে যায়: ${body}${end('সীমা', yes)}`,
  deriv(order, v, body, yes) {
    const which = order === 1 ? 'অন্তরজ' : order === 2 ? 'দ্বিতীয় অন্তরজ' : order === 3 ? 'তৃতীয় অন্তরজ' : `${order} তম অন্তরজ`;
    return `${v} এর সাপেক্ষে ${which}: ${body}${end('অন্তরজ', yes)}`;
  },
  matrix: (rows) => `${rows.length} বাই ${rows[0].length} ম্যাট্রিক্স: ${rows.map((r, i) => `সারি ${i + 1}: ${r.join(', ')}`).join('; ')}; ম্যাট্রিক্স শেষ,`,
  row: (items) => items.join(', '),
  relation(items, ops) {
    const pair = (a, op, b) => ({
      '=': `${a} সমান ${b}`,
      '!=': `${a}, ${b} এর সমান নয়`,
      '<': `${a}, ${b} এর চেয়ে ছোট`,
      '>': `${a}, ${b} এর চেয়ে বড়`,
      '<=': `${a}, ${b} এর চেয়ে ছোট অথবা সমান`,
      '>=': `${a}, ${b} এর চেয়ে বড় অথবা সমান`,
      '~=': `${a}, ${b} এর প্রায় সমান`,
    })[op];
    if (ops.every((o) => o === '=')) return items.join(' সমান ');
    return ops.map((op, i) => pair(items[i], op, items[i + 1])).join(', এবং ');
  },
  list: (items) => (items.length === 2 ? `বিন্দু ${items[0]}, কমা, ${items[1]}` : `তালিকা ${items.join(', কমা, ')}`),

  keyHelp: 'তীর চিহ্নের কী দিয়ে বুঝুন। নিচে: অংশের ভিতরে যান, উপরে: বাইরে আসুন, বাঁ আর ডান: অংশগুলোর মধ্যে চলুন। স্পেস: আবার শুনুন। হোম: সম্পূর্ণ রাশি। W: আপনি কোথায় আছেন।',
  whereLabel: 'আপনি এখানে',
  explorer: 'গণিত এক্সপ্লোরার',
  roles: { numerator: 'লব', denominator: 'হর', base: 'ভিত্তি', exponent: 'ঘাত', subscript: 'সাবস্ক্রিপ্ট',
    radicand: 'মূলের ভিতরে', index: 'মূলের ক্রম', argument: 'ভিতরে', inside: 'ভিতরে', term: 'পদ', factor: 'উৎপাদক',
    side: 'পক্ষ', item: 'উপাদান', from: 'নিম্ন সীমা', to: 'উচ্চ সীমা', body: 'রাশি', integrand: 'সমাকল্য',
    variable: 'চলক', approaches: 'কোন দিকে', function: 'অপেক্ষক', row: 'সারি', entry: 'উপাদান' },
  ofCount: (i, n) => `${n} টির মধ্যে ${i}`,
  wholeThing: 'সম্পূর্ণ রাশি',
  nothingInside: 'এই অংশের ভিতরে আর কিছু নেই।',
  atTop: 'আপনি সম্পূর্ণ রাশিতে আছেন।',
  lastPart: 'ডানদিকে আর কোনো অংশ নেই।',
  firstPart: 'বাঁদিকে আর কোনো অংশ নেই।',
};
