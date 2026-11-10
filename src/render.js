// Draws a math tree as HTML (stacked fractions, raised powers, root signs).
// Every node gets its own element so the explorer can highlight it.

import { children } from './parser.js';

const CONSTS = { pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ',
  mu: 'μ', sigma: 'σ', phi: 'φ', omega: 'ω', infinity: '∞' };
const RELS = { '=': '=', '<': '<', '>': '>', '<=': '≤', '>=': '≥', '!=': '≠' };

function el(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) e.append(k);
  return e;
}
const op = (text) => el('span', 'm-op', text);

// Returns { root, info } where info maps each element to
// { node, el, parent, role, index, count, kids }.
export function render(tree) {
  const info = new Map();
  let nextId = 0;

  function draw(node, parent, step) {
    const box = el('span', `m-node m-${node.type}`);
    box.dataset.id = String(nextId++);
    const entry = { node, el: box, parent, role: step?.role, index: step?.index, count: step?.count, kids: [] };
    info.set(box, entry);

    const kidSteps = children(node);
    const drawn = kidSteps.map((s) => {
      const k = draw(s.node, entry, { ...s, count: kidSteps.length });
      entry.kids.push(info.get(k));
      return k;
    });

    switch (node.type) {
      case 'num': box.textContent = node.value; break;
      case 'var': box.textContent = node.name; break;
      case 'const': box.textContent = CONSTS[node.name] || node.name; break;
      case 'neg': box.append(op('−'), drawn[0]); break;
      case 'add':
        node.items.forEach((it, i) => {
          if (it.op) box.append(op(it.op === '+' ? '+' : '−'));
          box.append(drawn[i]);
        });
        break;
      case 'mul':
        drawn.forEach((d, i) => {
          if (i > 0) box.append(node.explicit[i - 1] ? op('×') : el('span', 'm-thin'));
          box.append(d);
        });
        break;
      case 'frac':
        box.append(el('span', 'm-top', drawn[0]), el('span', 'm-bottom', drawn[1]));
        break;
      case 'pow':
        box.append(drawn[0], el('sup', 'm-sup', drawn[1]));
        break;
      case 'sub':
        box.append(drawn[0], el('sub', 'm-sub', drawn[1]));
        break;
      case 'sqrt':
        box.append(el('span', 'm-radical', '√'), el('span', 'm-radicand', drawn[0]));
        break;
      case 'root':
        box.append(el('sup', 'm-index', drawn[0]), el('span', 'm-radical', '√'), el('span', 'm-radicand', drawn[1]));
        break;
      case 'abs': box.append(el('span', 'm-fence', '|'), drawn[0], el('span', 'm-fence', '|')); break;
      case 'fact': box.append(drawn[0], el('span', 'm-op-tight', '!')); break;
      case 'paren': box.append(el('span', 'm-fence', '('), drawn[0], el('span', 'm-fence', ')')); break;
      case 'func': {
        const name = el('span', 'm-fn', node.name);
        const hasBase = !!node.base;
        box.append(name);
        if (hasBase) box.append(el('sub', 'm-sub', drawn[0]));
        const arg = drawn[hasBase ? 1 : 0];
        const atom = ['num', 'var', 'const'].includes(node.arg.type);
        if (atom) box.append(el('span', 'm-thin'), arg);
        else box.append(el('span', 'm-fence', '('), arg, el('span', 'm-fence', ')'));
        break;
      }
      case 'rel':
        drawn.forEach((d, i) => {
          if (i > 0) box.append(op(RELS[node.ops[i - 1]]));
          box.append(d);
        });
        break;
      case 'list':
        box.append(el('span', 'm-fence', '('));
        drawn.forEach((d, i) => { if (i > 0) box.append(el('span', 'm-op-tight', ', ')); box.append(d); });
        box.append(el('span', 'm-fence', ')'));
        break;
      default: box.textContent = '?';
    }
    return box;
  }

  const root = draw(tree, null, null);
  return { root, info };
}

// Roughly what a screen reader says when it reads the raw typed text,
// with punctuation set to "all". Used for the before/after comparison.
const SR_SYMBOLS = { '^': 'caret', '/': 'slash', '(': 'left paren', ')': 'right paren', '*': 'star',
  '_': 'underline', '|': 'vertical bar', '-': 'dash', '+': 'plus', '=': 'equals', '<': 'less',
  '>': 'greater', '!': 'bang', ',': 'comma', '.': 'dot', '[': 'left bracket', ']': 'right bracket' };

export function rawScreenReader(src) {
  const out = [];
  const re = /\d+(\.\d+)?|[A-Za-z]+|\S/g;
  let m;
  while ((m = re.exec(src))) {
    const t = m[0];
    if (/^\d/.test(t)) out.push(t);
    else if (/^[A-Za-z]+$/.test(t)) {
      // Short letter runs like "ac" or "sqrt" get spelled or mispronounced as a word.
      out.push(/[aeiou]/i.test(t) && t.length > 3 ? t : t.split('').join(' '));
    } else out.push(SR_SYMBOLS[t] || t);
  }
  return out.join(' ');
}
