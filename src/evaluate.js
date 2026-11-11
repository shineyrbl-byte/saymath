// Works out the value of a math tree, and checks whether a learner's answer
// matches the expected one (as a number, or as an equivalent expression).

import { parse } from './parser.js';

export class EvalError extends Error {}

const FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  cot: (x) => 1 / Math.tan(x), sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x),
  ln: Math.log, exp: Math.exp, log: Math.log10,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
};

// Determinant of a square matrix of numbers (by row reduction).
function det(m) {
  const n = m.length;
  if (!m.every((r) => r.length === n)) throw new EvalError('Only square matrices have a determinant.');
  const a = m.map((r) => [...r]);
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (a[p][c] === 0) return 0;
    if (p !== c) { [a[p], a[c]] = [a[c], a[p]]; d = -d; }
    d *= a[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = a[r][c] / a[c][c];
      for (let k = c; k < n; k++) a[r][k] -= f * a[c][k];
    }
  }
  return d;
}

const varName = (v) => v.name;

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new EvalError('Factorial needs a whole number from 0 to 170.');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function evaluate(node, env = {}) {
  const ev = (n) => evaluate(n, env);
  switch (node.type) {
    case 'num': return Number(node.value);
    case 'var':
      if (node.name in env) return env[node.name];
      if (node.name === 'e') return Math.E;
      throw new EvalError(`No value for ${node.name}.`);
    case 'const':
      if (node.name === 'pi') return Math.PI;
      if (node.name === 'infinity') return Infinity;
      if (node.name in env) return env[node.name];
      throw new EvalError(`No value for ${node.name}.`);
    case 'add':
      if (node.items.some((it) => it.op === '±')) throw new EvalError('Plus or minus gives two values, not one.');
      return node.items.reduce((s, it) => (it.op === '-' ? s - ev(it.node) : s + ev(it.node)), 0);
    case 'mul': return node.factors.reduce((p, f) => p * ev(f), 1);
    case 'frac': return ev(node.num) / ev(node.den);
    case 'pow': return ev(node.base) ** ev(node.exp);
    case 'neg': return -ev(node.arg);
    case 'paren': return ev(node.arg);
    case 'sqrt': return Math.sqrt(ev(node.arg));
    case 'root': {
      const k = ev(node.index);
      const x = ev(node.arg);
      return x < 0 && k % 2 === 1 ? -((-x) ** (1 / k)) : x ** (1 / k);
    }
    case 'abs': return Math.abs(ev(node.arg));
    case 'fact': return factorial(ev(node.arg));
    case 'sub': {
      const key = `${node.base.name}_${node.sub.value ?? node.sub.name}`;
      if (key in env) return env[key];
      throw new EvalError(`No value for ${key}.`);
    }
    case 'deg': return ev(node.arg) * Math.PI / 180;
    case 'pm': throw new EvalError('Plus or minus gives two values, not one.');
    case 'matrix': case 'row': throw new EvalError('A matrix is not a single number.');
    case 'bigop': {
      // The lower limit is written "i = 1".
      if (node.lower.type !== 'rel' || node.lower.ops[0] !== '=' || node.lower.items[0].type !== 'var') {
        throw new EvalError('Write the start like i = 1.');
      }
      const v = node.lower.items[0].name;
      const from = ev(node.lower.items[1]);
      const to = ev(node.upper);
      if (!Number.isInteger(from) || !Number.isInteger(to) || to - from > 100000) throw new EvalError('The limits need to be whole numbers.');
      let acc = node.op === 'sum' ? 0 : 1;
      for (let k = from; k <= to; k++) {
        const x = evaluate(node.body, { ...env, [v]: k });
        acc = node.op === 'sum' ? acc + x : acc * x;
      }
      return acc;
    }
    case 'integral': {
      if (!node.lower) throw new EvalError('An integral with no limits is not a single number.');
      const v = varName(node.v);
      const a = ev(node.lower);
      const b = ev(node.upper);
      const f = (x) => evaluate(node.body, { ...env, [v]: x });
      // Simpson's rule.
      const n = 400;
      const h = (b - a) / n;
      let s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
      return (s * h) / 3;
    }
    case 'limit': {
      const v = varName(node.v);
      const to = ev(node.to);
      const f = (x) => evaluate(node.body, { ...env, [v]: x });
      if (!Number.isFinite(to)) return f(to > 0 ? 1e7 : -1e7);
      const left = f(to - 1e-6);
      const right = f(to + 1e-6);
      if (Math.abs(left - right) > 1e-3 * Math.max(1, Math.abs(left))) throw new EvalError('This limit is different from the left and the right.');
      return (left + right) / 2;
    }
    case 'deriv': {
      const v = varName(node.v);
      if (!(v in env)) throw new EvalError(`No value for ${v}.`);
      const f = (x) => evaluate(node.body, { ...env, [v]: x });
      const x0 = env[v];
      // Central differences, first to third order. Step sizes balance rounding and truncation error.
      let h = 1e-5;
      if (node.order === 1) return (f(x0 + h) - f(x0 - h)) / (2 * h);
      h = 1e-4;
      if (node.order === 2) return (f(x0 + h) - 2 * f(x0) + f(x0 - h)) / (h * h);
      h = 1e-3;
      if (node.order === 3) return (f(x0 + 2 * h) - 2 * f(x0 + h) + 2 * f(x0 - h) - f(x0 - 2 * h)) / (2 * h ** 3);
      throw new EvalError('Only up to the third derivative can be checked.');
    }
    case 'func': {
      if (node.name === 'det') {
        if (node.arg.type !== 'matrix') throw new EvalError('det needs a matrix, like det([[1, 2], [3, 4]]).');
        return det(node.arg.rows.map((r) => r.items.map(ev)));
      }
      const x = ev(node.arg);
      if (node.base) return Math.log(x) / Math.log(ev(node.base));
      return FUNCS[node.name](x);
    }
    default: throw new EvalError('That is not a single value.');
  }
}

export function variables(node, out = new Set()) {
  if (node.type === 'var' && node.name !== 'e') out.add(node.name);
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') {
      if (Array.isArray(v)) v.forEach((x) => x && typeof x === 'object' && variables(x.node || x, out));
      else if (v.type) variables(v, out);
    }
  }
  return out;
}

const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Calculus is worked out numerically, so it needs a looser comparison.
const numeric = (n) => JSON.stringify(n).match(/"type":"(deriv|integral|limit)"/) !== null;

// Compares a learner's typed answer with the expected answer.
// `solveFor`: for "solve for x" problems, accepts "4" or "x = 4".
// Returns { ok, reason, tree }.
export function checkAnswer(typed, expected, { solveFor } = {}) {
  let tree;
  try {
    tree = parse(typed).tree;
  } catch (e) {
    return { ok: false, reason: 'unreadable', message: e.message, error: e };
  }
  if (solveFor && tree.type === 'rel' && tree.ops.length === 1 && tree.ops[0] === '='
      && tree.items[0].type === 'var' && tree.items[0].name === solveFor) {
    tree = tree.items[1];
  }
  if (tree.type === 'rel') return { ok: false, reason: 'not-a-value', tree };
  const want = parse(expected).tree;
  const names = [...new Set([...variables(want), ...variables(tree)])];
  if (solveFor && variables(tree).size) return { ok: false, reason: 'still-has-letters', tree };

  // Try several values for the letters; equivalent expressions agree on all.
  const trials = names.length ? [0.7, 1.3, 2.9, -1.6, 4.2] : [0];
  const tol = numeric(tree) || numeric(want) ? 1e-4 : 1e-6;
  try {
    for (const t of trials) {
      const env = Object.fromEntries(names.map((n, i) => [n, t + i * 0.37]));
      const a = evaluate(tree, env);
      const b = evaluate(want, env);
      if (!Number.isFinite(b)) continue;
      if (!close(a, b, tol)) return { ok: false, reason: 'wrong', tree };
    }
  } catch (e) {
    return { ok: false, reason: 'unreadable', message: e.message, tree };
  }
  return { ok: true, tree };
}
