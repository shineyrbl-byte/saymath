// LaTeX input: teachers often have maths as LaTeX (from Word, Overleaf,
// MathType or a website). This turns common LaTeX into SayMath's typed maths,
// so it can be pasted straight in.

const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'theta', 'lambda', 'mu', 'pi', 'rho', 'sigma', 'tau', 'phi', 'varphi', 'omega'];
const FUNCS = ['arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'det'];
const SYMBOLS = {
  cdot: '*', times: '*', div: '/', pm: '+/-', mp: '+/-', le: '<=', leq: '<=', ge: '>=', geq: '>=', ne: '!=', neq: '!=',
  approx: '~=', infty: 'infinity', to: '->', rightarrow: '->', circ: '°', degree: '°', lt: '<', gt: '>',
};

export function looksLikeLatex(s) {
  return /\\[a-zA-Z]+|[\^_]\{/.test(s);
}

// Reads one {group} (or a single character) starting at i. Returns [content, next index].
function group(s, i) {
  while (s[i] === ' ') i++;
  if (s[i] !== '{') {
    if (s[i] === '\\') { const m = /^\\[a-zA-Z]+/.exec(s.slice(i)); if (m) return [m[0], i + m[0].length]; }
    return [s[i] || '', i + 1];
  }
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  return [s.slice(i + 1), s.length];
}

// The rest of the expression, up to a comparison sign at the top level.
function restUntilRelation(s, i) {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if ('({['.includes(c)) depth++;
    else if (')}]'.includes(c)) { if (depth === 0) return j; depth--; }
    else if (depth === 0 && (c === '=' || c === '<' || c === '>' || s.startsWith('\\le', j) || s.startsWith('\\ge', j) || s.startsWith('\\ne', j) || s.startsWith('\\approx', j))) return j;
  }
  return s.length;
}

export function fromLatex(input) {
  let s = input;
  // Matrices: \begin{pmatrix} a & b \\ c & d \end{pmatrix}
  s = s.replace(/\\begin\{[pbvBV]?matrix\}([\s\S]*?)\\end\{[pbvBV]?matrix\}/g, (_, body) => {
    const rows = body.split(/\\\\/).map((r) => r.trim()).filter(Boolean).map((r) => `[${r.split('&').map((c) => fromLatex(c.trim())).join(', ')}]`);
    return `[${rows.join(', ')}]`;
  });

  s = s.replace(/\\(left|right|big|Big|bigg|Bigg|displaystyle)\b/g, '')
    .replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ')
    .replace(/\\text\{([^}]*)\}|\\mathrm\{([^}]*)\}/g, (_, a, b) => ` ${a || b} `)
    .replace(/\\[dt]?frac/g, '\\frac')
    .replace(/\^\s*\\circ/g, '°')
    .replace(/\\(l|r)vert|\\mid/g, '|')
    .replace(/\\\{/g, '(').replace(/\\\}/g, ')');

  let out = '';
  for (let i = 0; i < s.length;) {
    if (s.startsWith('\\frac', i)) {
      const [num, a] = group(s, i + 5);
      const [den, b] = group(s, a);
      // \frac{d}{dx} f is a derivative.
      const d = /^d([a-z])$/.exec(den.trim());
      if (num.trim() === 'd' && d) {
        const end = restUntilRelation(s, b);
        out += `diff(${fromLatex(s.slice(b, end).trim())}, ${d[1]})`;
        i = end;
      } else {
        out += `((${fromLatex(num)})/(${fromLatex(den)}))`;
        i = b;
      }
    } else if (s.startsWith('\\sqrt', i)) {
      let j = i + 5;
      let index = null;
      if (s[j] === '[') { const k = s.indexOf(']', j); index = s.slice(j + 1, k); j = k + 1; }
      const [arg, b] = group(s, j);
      out += index ? `root(${fromLatex(index)}, ${fromLatex(arg)})` : `sqrt(${fromLatex(arg)})`;
      i = b;
    } else if (/^\\(sum|prod)/.test(s.slice(i))) {
      const op = s.startsWith('\\sum', i) ? 'sum' : 'prod';
      let j = i + (op === 'sum' ? 4 : 5);
      let lo = '';
      let up = '';
      for (let k = 0; k < 2; k++) {
        while (s[j] === ' ') j++;
        if (s[j] === '_') [lo, j] = group(s, j + 1);
        else if (s[j] === '^') [up, j] = group(s, j + 1);
      }
      const end = restUntilRelation(s, j);
      out += `${op}(${fromLatex(lo)}, ${fromLatex(up)}, ${fromLatex(s.slice(j, end).trim())})`;
      i = end;
    } else if (s.startsWith('\\int', i)) {
      let j = i + 4;
      let lo = '';
      let up = '';
      for (let k = 0; k < 2; k++) {
        while (s[j] === ' ') j++;
        if (s[j] === '_') [lo, j] = group(s, j + 1);
        else if (s[j] === '^') [up, j] = group(s, j + 1);
      }
      // The body runs up to "d x" (written "dx", "\,dx" or "\mathrm{d}x").
      const rest = s.slice(j);
      const m = /^(.*?)\s*\bd\s*([a-z])\b/s.exec(rest);
      if (m) {
        const body = fromLatex(m[1].trim());
        out += lo || up ? `int(${body}, ${m[2]}, ${fromLatex(lo)}, ${fromLatex(up)})` : `int(${body}, ${m[2]})`;
        i = j + m[0].length;
      } else { out += 'int'; i = j; }
    } else if (s.startsWith('\\lim', i)) {
      let j = i + 4;
      while (s[j] === ' ') j++;
      let sub = '';
      if (s[j] === '_') [sub, j] = group(s, j + 1);
      const end = restUntilRelation(s, j);
      out += `lim(${fromLatex(sub)}, ${fromLatex(s.slice(j, end).trim())})`;
      i = end;
    } else if (s[i] === '\\') {
      const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
      const name = m ? m[1] : '';
      if (GREEK.includes(name)) out += ` ${name.replace(/^var/, '')} `;
      else if (FUNCS.includes(name)) out += ` ${name.replace(/^arc/, 'a')}`;
      else if (name in SYMBOLS) out += ` ${SYMBOLS[name]} `;
      else if (!m) out += s[i + 1] || '';
      else out += ` ${name} `;
      i += m ? m[0].length : 2;
    } else if (s[i] === '{') { out += '('; i++; }
    else if (s[i] === '}') { out += ')'; i++; }
    else { out += s[i]; i++; }
  }
  return out.replace(/\s+/g, ' ').trim();
}
