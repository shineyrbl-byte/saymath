// Turns a maths tree into MathML (for Word, browsers and screen readers that
// read MathML) and LaTeX (for Overleaf, Google Docs and many other tools).

const GREEK = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ',
  pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω', infinity: '∞' };
const REL_ML = { '=': '=', '<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥', '!=': '≠', '~=': '≈' };
const REL_TEX = { '=': '=', '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge', '!=': '\\ne', '~=': '\\approx' };
const OP_ML = { '+': '+', '-': '−', '±': '±' };
const OP_TEX = { '+': '+', '-': '-', '±': '\\pm' };
const FN_TEX = { asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', det: '\\det' };

export function toMathML(tree) {
  const mi = (x) => `<mi>${x}</mi>`;
  const mo = (x) => `<mo>${x}</mo>`;
  const row = (...xs) => `<mrow>${xs.join('')}</mrow>`;
  const fence = (x) => row(mo('('), x, mo(')'));
  const atom = (n) => ['num', 'var', 'const'].includes(n.type);
  function m(n) {
    switch (n.type) {
      case 'num': return `<mn>${n.value}</mn>`;
      case 'var': return mi(n.name);
      case 'const': return n.name === 'infinity' ? mi('∞') : mi(GREEK[n.name] || n.name);
      case 'neg': return row(mo('−'), m(n.arg));
      case 'pm': return row(mo('±'), m(n.arg));
      case 'add': return row(...n.items.map((it) => (it.op ? mo(OP_ML[it.op]) : '') + m(it.node)));
      case 'mul': return row(...n.factors.map((f, i) => (i ? (n.explicit[i - 1] ? mo('×') : mo('&#x2062;')) : '') + m(f)));
      case 'frac': return `<mfrac>${m(n.num)}${m(n.den)}</mfrac>`;
      case 'pow': return `<msup>${m(n.base)}${m(n.exp)}</msup>`;
      case 'sub': return `<msub>${m(n.base)}${m(n.sub)}</msub>`;
      case 'sqrt': return `<msqrt>${m(n.arg)}</msqrt>`;
      case 'root': return `<mroot>${m(n.arg)}${m(n.index)}</mroot>`;
      case 'abs': return row(mo('|'), m(n.arg), mo('|'));
      case 'fact': return row(m(n.arg), mo('!'));
      case 'paren': return fence(m(n.arg));
      case 'deg': return row(m(n.arg), mo('°'));
      case 'func': {
        const name = mi({ asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹' }[n.name] || n.name);
        const head = n.base ? `<msub>${name}${m(n.base)}</msub>` : name;
        return row(head, mo('&#x2061;'), atom(n.arg) || n.arg.type === 'matrix' ? m(n.arg) : fence(m(n.arg)));
      }
      case 'rel': return row(...n.items.map((it, i) => (i ? mo(REL_ML[n.ops[i - 1]]) : '') + m(it)));
      case 'list': return row(mo(n.square ? '[' : '('), ...n.items.map((it, i) => (i ? mo(',') : '') + m(it)), mo(n.square ? ']' : ')'));
      case 'bigop': return row(`<munderover>${mo(n.op === 'sum' ? '∑' : '∏')}${m(n.lower)}${m(n.upper)}</munderover>`, m(n.body));
      case 'integral': {
        const sign = n.lower ? `<msubsup>${mo('∫')}${m(n.lower)}${m(n.upper)}</msubsup>` : mo('∫');
        return row(sign, m(n.body), mi('d'), m(n.v));
      }
      case 'limit': return row(`<munder>${mi('lim')}${row(m(n.v), mo('→'), m(n.to))}</munder>`, m(n.body));
      case 'deriv': {
        const d = n.order > 1 ? `<msup>${mi('d')}<mn>${n.order}</mn></msup>` : mi('d');
        const dx = n.order > 1 ? row(mi('d'), `<msup>${m(n.v)}<mn>${n.order}</mn></msup>`) : row(mi('d'), m(n.v));
        return row(`<mfrac>${d}${dx}</mfrac>`, atom(n.body) ? m(n.body) : fence(m(n.body)));
      }
      case 'matrix': return row(mo('['), `<mtable>${n.rows.map((r) => `<mtr>${r.items.map((c) => `<mtd>${m(c)}</mtd>`).join('')}</mtr>`).join('')}</mtable>`, mo(']'));
      default: return '';
    }
  }
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">${m(tree)}</math>`;
}

export function toLatex(tree) {
  const atom = (n) => ['num', 'var', 'const'].includes(n.type);
  const g = (x) => `{${x}}`;
  function t(n) {
    switch (n.type) {
      case 'num': return n.value;
      case 'var': return n.name;
      case 'const': return n.name === 'infinity' ? '\\infty' : `\\${n.name}`;
      case 'neg': return `-${t(n.arg)}`;
      case 'pm': return `\\pm ${t(n.arg)}`;
      case 'add': return n.items.map((it) => (it.op ? ` ${OP_TEX[it.op]} ` : '') + t(it.node)).join('');
      case 'mul': return n.factors.map((f, i) => (i ? (n.explicit[i - 1] ? ' \\times ' : ' ') : '') + t(f)).join('');
      case 'frac': return `\\frac${g(t(n.num))}${g(t(n.den))}`;
      case 'pow':
        if (n.base.type === 'func') {
          // sin^2 x, not (sin x)^2
          const f = n.base;
          const name = FN_TEX[f.name] || `\\${f.name}`;
          return `${name}${f.base ? `_${g(t(f.base))}` : ''}^${g(t(n.exp))}${atom(f.arg) ? ` ${t(f.arg)}` : `\\left(${t(f.arg)}\\right)`}`;
        }
        return `${atom(n.base) || n.base.type === 'paren' ? t(n.base) : g(t(n.base))}^${g(t(n.exp))}`;
      case 'sub': return `${t(n.base)}_${g(t(n.sub))}`;
      case 'sqrt': return `\\sqrt${g(t(n.arg))}`;
      case 'root': return `\\sqrt[${t(n.index)}]${g(t(n.arg))}`;
      case 'abs': return `\\left|${t(n.arg)}\\right|`;
      case 'fact': return `${t(n.arg)}!`;
      case 'paren': return `\\left(${t(n.arg)}\\right)`;
      case 'deg': return `${t(n.arg)}^\\circ`;
      case 'func': {
        const name = FN_TEX[n.name] || `\\${n.name}`;
        return `${name}${n.base ? `_${g(t(n.base))}` : ''}${atom(n.arg) || n.arg.type === 'matrix' ? ` ${t(n.arg)}` : `\\left(${t(n.arg)}\\right)`}`;
      }
      case 'rel': return n.items.map((it, i) => (i ? ` ${REL_TEX[n.ops[i - 1]]} ` : '') + t(it)).join('');
      case 'list': return `${n.square ? '[' : '('}${n.items.map(t).join(', ')}${n.square ? ']' : ')'}`;
      case 'bigop': return `\\${n.op}_${g(t(n.lower))}^${g(t(n.upper))} ${t(n.body)}`;
      case 'integral': return `\\int${n.lower ? `_${g(t(n.lower))}^${g(t(n.upper))}` : ''} ${t(n.body)} \\, d${t(n.v)}`;
      case 'limit': return `\\lim_${g(`${t(n.v)} \\to ${t(n.to)}`)} ${t(n.body)}`;
      case 'deriv': {
        const k = n.order > 1 ? `^${n.order}` : '';
        return `\\frac{d${k}}{d${t(n.v)}${k}} ${atom(n.body) ? t(n.body) : `\\left(${t(n.body)}\\right)`}`;
      }
      case 'matrix': return `\\begin{bmatrix} ${n.rows.map((r) => r.items.map(t).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
      default: return '';
    }
  }
  return t(tree);
}
