// Turns a math tree into words a listener cannot misread.
//
// The main rule: anything that groups (a fraction, a root, a bracket, a
// complicated power) says where it ends, unless its contents are a single
// number or letter. "the square root of x plus 1, end root" and
// "the square root of x plus 1" are then different expressions.
//
// Modes:
//   clear (default) - always says end markers for grouped parts
//   brief           - drops end markers at the very end of the expression

import { children } from './parser.js';
import { EN } from './lang/en.js';
import { HI } from './lang/hi.js';

const LANGS = { en: EN, hi: HI };

export function registerLanguage(code, phrases) {
  LANGS[code] = phrases;
}

export function languages() {
  return Object.keys(LANGS);
}

// A single number, letter or constant (possibly with a simple subscript).
export function isAtom(n) {
  if (!n) return false;
  if (n.type === 'num' || n.type === 'var' || n.type === 'const') return true;
  if (n.type === 'sub') return isAtom(n.base) && isAtom(n.sub);
  return false;
}

export function speak(node, { lang = 'en', mode = 'clear' } = {}) {
  const L = LANGS[lang] || EN;
  const brief = mode === 'brief';
  // `last` is true when nothing is spoken after this node, so in brief mode
  // its end marker can be dropped without becoming ambiguous.
  const needEnd = (last) => !(brief && last);

  function say(n, last) {
    switch (n.type) {
      case 'num': return L.number(n.value);
      case 'var': return L.letter(n.name);
      case 'const': return L.constant(n.name);
      case 'neg': return L.negative(say(n.arg, last));
      case 'add':
        return n.items
          .map((it, i) => {
            const words = say(it.node, last && i === n.items.length - 1);
            if (it.op === '+') return `${L.plus} ${words}`;
            if (it.op === '-') return `${L.minus} ${words}`;
            return words;
          })
          .join(' ');
      case 'mul': {
        let out = say(n.factors[0], false);
        for (let i = 1; i < n.factors.length; i++) {
          const f = n.factors[i];
          const prev = n.factors[i - 1];
          // "3 x" and "x y" read naturally; "2 times the quantity..." needs "times".
          const plain = !n.explicit[i - 1] && ['var', 'const', 'sub', 'sqrt', 'func', 'pow'].includes(f.type)
            && !(f.type === 'pow' && !isAtom(f.base)) && prev.type !== 'frac';
          out += plain ? ' ' : ` ${L.times} `;
          out += say(f, last && i === n.factors.length - 1);
        }
        return out;
      }
      case 'frac': {
        const named = L.namedFraction(n.num, n.den);
        if (named) return named;
        if (isAtom(n.num) && isAtom(n.den)) return L.simpleFraction(say(n.num, false), say(n.den, last));
        return L.fraction(say(n.num, false), say(n.den, false), needEnd(last));
      }
      case 'pow': {
        const e = n.exp;
        if (n.base.type === 'func') {
          // "sine squared of x", so it can't be heard as sin(x^2).
          const f = n.base;
          return L.funcPower(f.name, f.base ? say(f.base, false) : null, say(e, false), e,
            say(f.arg, last), !isAtom(f.arg) && needEnd(last));
        }
        const base = say(n.base, false);
        if (e.type === 'num' && e.value === '2') return L.squared(base);
        if (e.type === 'num' && e.value === '3') return L.cubed(base);
        if (e.type === 'num' && /^\d+$/.test(e.value)) return L.ordinalPower(base, L.ordinal(e.value));
        if (e.type === 'var') return L.ordinalPower(base, L.letterOrdinal(say(e, false)));
        if (e.type === 'neg' && isAtom(e.arg)) return L.negativePower(base, say(e.arg, false));
        return L.power(base, say(e, false), needEnd(last));
      }
      case 'sub':
        return L.subscript(say(n.base, false), say(n.sub, last), !isAtom(n.sub) && needEnd(last));
      case 'sqrt':
        return L.sqrt(say(n.arg, last), !isAtom(n.arg) && needEnd(last));
      case 'root':
        return L.root(say(n.index, false), n.index, say(n.arg, last), !isAtom(n.arg) && needEnd(last));
      case 'abs':
        return L.abs(say(n.arg, last), !isAtom(n.arg) && needEnd(last));
      case 'fact':
        return L.factorial(say(n.arg, false));
      case 'paren':
        if (isAtom(n.arg)) return say(n.arg, last);
        return L.quantity(say(n.arg, false), needEnd(last));
      case 'func':
        return L.func(n.name, n.base ? say(n.base, false) : null, say(n.arg, last), !isAtom(n.arg) && needEnd(last));
      case 'rel':
        return L.relation(n.items.map((it, i) => say(it, last && i === n.items.length - 1)), n.ops);
      case 'list':
        return L.list(n.items.map((it) => say(it, false)));
      default:
        throw new Error(`No words for node type ${n.type}`);
    }
  }

  return tidy(say(node, true));
}

function tidy(s) {
  return s.replace(/\s+/g, ' ').replace(/ ,/g, ',').replace(/,+/g, ',').replace(/,\s*$/, '').trim();
}

// Words for one step while exploring: "denominator: 2 x minus 1".
export function describeStep(step, opts = {}) {
  const L = LANGS[opts.lang || 'en'] || EN;
  const words = speak(step.node, opts);
  if (!step.role) return words;
  const role = L.roles[step.role] || step.role;
  const pos = step.index !== undefined && step.count > 1 ? ` ${L.ofCount(step.index + 1, step.count)}` : '';
  return `${role}${pos}: ${words}`;
}

export { children };
