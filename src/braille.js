// Nemeth Code braille for a math tree, as Unicode braille (⠭⠘⠆).
// EXPERIMENTAL: covers school maths, and has not yet been checked by a
// braille transcriber. Sums, limits and matrices use a simplified layout.
//
// Also converts Unicode braille to ASCII braille (.brf), the format
// braille embossers and refreshable displays use for files.

const SP = '⠀';
const DIGITS = { 0: '⠴', 1: '⠂', 2: '⠆', 3: '⠒', 4: '⠲', 5: '⠢', 6: '⠖', 7: '⠶', 8: '⠦', 9: '⠔', '.': '⠨' };
const LETTERS = { a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚', k: '⠅',
  l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭',
  y: '⠽', z: '⠵' };
const GREEK = { alpha: '⠁', beta: '⠃', gamma: '⠛', delta: '⠙', epsilon: '⠑', theta: '⠹', lambda: '⠇', mu: '⠍',
  pi: '⠏', rho: '⠗', sigma: '⠎', tau: '⠞', phi: '⠋', omega: '⠺' };
const RELS = { '=': '⠨⠅', '<': '⠐⠅', '>': '⠨⠂', '<=': '⠐⠅⠱', '>=': '⠨⠂⠱', '!=': '⠌⠨⠅', '~=': '⠈⠱⠈⠱' };
const NUMERIC = '⠼';
const SUPER = '⠘';
const SUB = '⠰';
const BASE = '⠐';

const word = (s) => [...s].map((c) => LETTERS[c] || c).join('');
const letter = (c) => (c === c.toUpperCase() && c !== c.toLowerCase() ? `⠠${LETTERS[c.toLowerCase()]}` : LETTERS[c] || c);
const isAtom = (n) => ['num', 'var', 'const'].includes(n.type);

// How deeply fractions are nested inside a node (a fraction inside a
// fraction is "complex" and gets ⠠ added to its signs).
function fracDepth(n) {
  if (!n || typeof n !== 'object') return 0;
  let inner = 0;
  for (const v of Object.values(n)) {
    if (Array.isArray(v)) v.forEach((x) => { inner = Math.max(inner, fracDepth(x && x.node ? x.node : x)); });
    else if (v && v.type) inner = Math.max(inner, fracDepth(v));
  }
  return n.type === 'frac' ? inner + 1 : inner;
}

export function toBraille(tree) {
  // `level` is the run of level indicators for the current position:
  // '' is the baseline, '⠘' a superscript, '⠘⠰' a subscript of a superscript.
  // Level changes are marked first, then tidied: only the last of several
  // changes in a row is written, and none before a space or at the end.
  const mark = (level) => `\u0002${level === '' ? BASE : level}\u0003`;
  const back = mark;

  function b(n, level) {
    switch (n.type) {
      case 'num': return `\u0001${[...n.value].map((d) => DIGITS[d]).join('')}`;
      case 'var': return letter(n.name);
      case 'const':
        if (n.name === 'infinity') return '⠠⠿';
        return `⠨${GREEK[n.name]}`;
      case 'neg': return `⠤${b(n.arg, level)}`;
      case 'pm': return `⠬⠤${b(n.arg, level)}`;
      case 'add':
        return n.items.map((it) => ({ '+': '⠬', '-': '⠤', '±': '⠬⠤' }[it.op] || '') + b(it.node, level)).join('');
      case 'mul':
        return n.factors.map((f, i) => (i > 0 && n.explicit[i - 1] ? '⠈⠡' : '') + b(f, level)).join('');
      case 'frac': {
        const k = '⠠'.repeat(fracDepth(n) - 1);
        return `${k}⠹${b(n.num, level)}${k}⠌${b(n.den, level)}${k}⠼`;
      }
      case 'pow': {
        const up = level + SUPER;
        return `${b(n.base, level)}${mark(up)}${b(n.exp, up)}${back(level)}`;
      }
      case 'sub': {
        // x₁: a number right after a letter is a subscript with no indicator.
        if (n.base.type === 'var' && n.sub.type === 'num' && level === '' && /^\d+$/.test(n.sub.value)) {
          return `${b(n.base, level)}${[...n.sub.value].map((d) => DIGITS[d]).join('')}`;
        }
        const down = level + SUB;
        return `${b(n.base, level)}${mark(down)}${b(n.sub, down)}${back(level)}`;
      }
      case 'sqrt': return `⠜${b(n.arg, level)}⠻`;
      case 'root': return `⠣${b(n.index, level)}⠜${b(n.arg, level)}⠻`;
      case 'abs': return `⠳${b(n.arg, level)}⠳`;
      case 'fact': return `${b(n.arg, level)}⠯`;
      case 'paren': return `⠷${b(n.arg, level)}⠾`;
      case 'deg': return `${b(n.arg, level)}${mark(level + SUPER)}⠨⠡${back(level)}`;
      case 'list': {
        const [o, c] = n.square ? ['⠈⠷', '⠈⠾'] : ['⠷', '⠾'];
        return `${o}${n.items.map((it) => b(it, level)).join(`⠠${SP}`)}${c}`;
      }
      case 'func': {
        const name = n.name === 'asin' || n.name === 'acos' || n.name === 'atan'
          ? `${word(n.name.slice(1))}${mark(level + SUPER)}⠤⠂${back(level)}` : word(n.name);
        const base = n.base ? `${mark(level + SUB)}${b(n.base, level + SUB)}${back(level)}` : '';
        const arg = isAtom(n.arg) || n.arg.type === 'deg' ? b(n.arg, level) : `⠷${b(n.arg, level)}⠾`;
        return `${name}${base}${SP}${arg}`;
      }
      case 'rel':
        return n.items.map((it, i) => (i > 0 ? `${SP}${RELS[n.ops[i - 1]]}${SP}` : '') + b(it, level)).join('');
      case 'integral': {
        const lim = n.lower ? `${mark(level + SUB)}${b(n.lower, level + SUB)}${mark(level + SUPER)}${b(n.upper, level + SUPER)}${back(level)}` : '';
        return `⠮${lim}${b(n.body, level)}⠙${b(n.v, level)}`;
      }
      case 'deriv': {
        const sup = n.order > 1 ? `${mark(level + SUPER)}${[...String(n.order)].map((d) => DIGITS[d]).join('')}${back(level)}` : '';
        const body = isAtom(n.body) ? b(n.body, level) : `⠷${b(n.body, level)}⠾`;
        return `⠹⠙${sup}⠌⠙${b(n.v, level)}${sup}⠼${body}`;
      }
      // Modified expressions: ⠐ base, ⠩ what goes under, ⠣ what goes over, ⠻ end.
      case 'bigop':
        return `⠐⠠⠨${n.op === 'sum' ? '⠎' : '⠏'}⠩${b(n.lower, level)}⠣${b(n.upper, level)}⠻${b(n.body, level)}`;
      case 'limit':
        return `⠐⠇⠊⠍⠩${b(n.v, level)}⠫⠕${b(n.to, level)}⠻${SP}${b(n.body, level)}`;
      case 'matrix':
        return `⠈⠷${n.rows.map((r) => r.items.map((it) => b(it, level)).join(SP + SP)).join('\n')}⠈⠾`;
      default:
        return '⠿';
    }
  }

  let out = b(tree, '');
  // A number needs the numeric indicator ⠼ at the start, after a space, or
  // after a minus sign that starts the expression.
  out = out.replace(/(^|⠀|\n|^⠤|⠀⠤)\u0001/g, `$1${NUMERIC}`).replace(/\u0001/g, '');
  out = out.replace(/(?:\u0002[^\u0003]*\u0003)+(?=⠀|\n|$)/g, '')
    .replace(/(?:\u0002[^\u0003]*\u0003)+/g, (run) => run.slice(run.lastIndexOf('\u0002') + 1, -1));
  return out;
}

// North American ASCII braille, indexed by the dot pattern (dot 1 = bit 0).
const ASCII = ' A1B\'K2L@CIF/MSP"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)=';

export function toASCII(unicodeBraille) {
  return [...unicodeBraille].map((c) => {
    const code = c.codePointAt(0) - 0x2800;
    return code >= 0 && code < 64 ? ASCII[code] : c;
  }).join('');
}

// Uncontracted (grade 1) English text in Unicode braille, for prompts and titles.
const TEXT_PUNCT = { '.': '⠲', ',': '⠂', ':': '⠒', ';': '⠆', '?': '⠦', '!': '⠖', '-': '⠤', "'": '⠄', '(': '⠐⠣', ')': '⠐⠜', ' ': SP };
const TEXT_DIGITS = { 1: '⠁', 2: '⠃', 3: '⠉', 4: '⠙', 5: '⠑', 6: '⠋', 7: '⠛', 8: '⠓', 9: '⠊', 0: '⠚' };

export function textToBraille(text) {
  return text.replace(/\d+/g, (d) => `⠼${[...d].map((x) => TEXT_DIGITS[x]).join('')}`)
    .replace(/[A-Za-z]/g, (c) => letter(c))
    .replace(/[.,:;?!\-'() ]/g, (c) => TEXT_PUNCT[c]);
}

// Bharati braille for Hindi and Marathi words (Devanagari). EXPERIMENTAL.
// Bharati braille gives each Devanagari letter the cell of its nearest
// English sound. A consonant on its own carries the vowel a; a vowel sign is
// written as the full vowel after its consonant; ् (halant) is ⠈.
const BHARATI = {
  'क्ष': '⠟', 'ज्ञ': '⠱',
  'अ': '⠁', 'आ': '⠜', 'इ': '⠊', 'ई': '⠔', 'उ': '⠥', 'ऊ': '⠳', 'ऋ': '⠐⠗', 'ए': '⠑', 'ऐ': '⠌', 'ओ': '⠕', 'औ': '⠪', 'ऑ': '⠕',
  'ा': '⠜', 'ि': '⠊', 'ी': '⠔', 'ु': '⠥', 'ू': '⠳', 'ृ': '⠐⠗', 'े': '⠑', 'ै': '⠌', 'ो': '⠕', 'ौ': '⠪', 'ॉ': '⠕',
  'क': '⠅', 'ख': '⠨', 'ग': '⠛', 'घ': '⠣', 'ङ': '⠬', 'च': '⠉', 'छ': '⠡', 'ज': '⠚', 'झ': '⠴', 'ञ': '⠒',
  'ट': '⠾', 'ठ': '⠺', 'ड': '⠫', 'ढ': '⠿', 'ण': '⠼', 'त': '⠞', 'थ': '⠹', 'द': '⠙', 'ध': '⠮', 'न': '⠝',
  'प': '⠏', 'फ': '⠖', 'ब': '⠃', 'भ': '⠘', 'म': '⠍', 'य': '⠽', 'र': '⠗', 'ल': '⠇', 'ळ': '⠸', 'व': '⠧',
  'श': '⠩', 'ष': '⠯', 'स': '⠎', 'ह': '⠓',
  '्': '⠈', 'ं': '⠰', 'ँ': '⠄', 'ः': '⠠', '़': '', '।': '⠲', ' ': SP,
};
const DEVANAGARI_NUM = '०१२३४५६७८९';

// Bharati braille is shared across Indian scripts: the same sound has the
// same cell. These map Bengali and Tamil letters to the Devanagari letter
// with the same sound, then use the table above. Tamil short e and short o,
// and the Tamil letters ழ ள ற ன, have cells of their own. EXPERIMENTAL.
const BENGALI_TO_DEVANAGARI = (() => {
  const m = {};
  // Bengali and Devanagari letters sit at the same offsets in Unicode.
  for (let c = 0x0985; c <= 0x09CD; c++) m[String.fromCharCode(c)] = String.fromCharCode(c - 0x0080);
  Object.assign(m, { 'ং': 'ं', 'ঁ': 'ँ', 'ঃ': 'ः', 'য়': 'य', 'ড়': 'ड', 'ঢ়': 'ढ', 'ৎ': 'त्', '।': '।' });
  return m;
})();
const TAMIL = {
  'அ': '⠁', 'ஆ': '⠜', 'இ': '⠊', 'ஈ': '⠔', 'உ': '⠥', 'ஊ': '⠳', 'எ': '⠢', 'ஏ': '⠑', 'ஐ': '⠌', 'ஒ': '⠭', 'ஓ': '⠕', 'ஔ': '⠪',
  'ா': '⠜', 'ி': '⠊', 'ீ': '⠔', 'ு': '⠥', 'ூ': '⠳', 'ெ': '⠢', 'ே': '⠑', 'ை': '⠌', 'ொ': '⠭', 'ோ': '⠕', 'ௌ': '⠪', '்': '⠈',
  'க': '⠅', 'ங': '⠬', 'ச': '⠉', 'ஞ': '⠒', 'ட': '⠾', 'ண': '⠼', 'த': '⠞', 'ந': '⠝', 'ப': '⠏', 'ம': '⠍',
  'ய': '⠽', 'ர': '⠗', 'ல': '⠇', 'வ': '⠧', 'ழ': '⠷', 'ள': '⠸', 'ற': '⠻', 'ன': '⠰', 'ஜ': '⠚', 'ஷ': '⠯', 'ஸ': '⠎', 'ஹ': '⠓',
};

export function indicToBraille(text) {
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return [...text].map((c) => {
      if (TAMIL[c]) return TAMIL[c];
      const d = '௦௧௨௩௪௫௬௭௮௯'.indexOf(c);
      if (d >= 0) return `⠼${TEXT_DIGITS[d]}`;
      return devanagariToBraille(c);
    }).join('').replace(/(⠼[⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚])⠼/g, '$1');
  }
  const deva = [...text].map((c) => BENGALI_TO_DEVANAGARI[c] || (/[০-৯]/.test(c) ? String(c.charCodeAt(0) - 0x09E6) : c)).join('');
  return devanagariToBraille(deva);
}

export function devanagariToBraille(text) {
  let out = '';
  for (let i = 0; i < text.length;) {
    const two = text.slice(i, i + 3);
    if (BHARATI[two]) { out += BHARATI[two]; i += 3; continue; }
    const c = text[i];
    const d = DEVANAGARI_NUM.indexOf(c);
    if (/\d/.test(c) || d >= 0) {
      let digits = '';
      while (i < text.length && (/\d/.test(text[i]) || DEVANAGARI_NUM.includes(text[i]))) {
        const k = /\d/.test(text[i]) ? text[i] : String(DEVANAGARI_NUM.indexOf(text[i]));
        digits += TEXT_DIGITS[k];
        i++;
      }
      out += `⠼${digits}`;
      continue;
    }
    if (c in BHARATI) out += BHARATI[c];
    else if (/[A-Za-z]/.test(c)) out += letter(c);
    else if (TEXT_PUNCT[c]) out += TEXT_PUNCT[c];
    i++;
  }
  return out;
}
