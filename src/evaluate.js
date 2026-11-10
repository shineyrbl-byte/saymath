// Works out the value of a math tree, and checks whether a learner's answer
// matches the expected one (as a number, or as an equivalent expression).

import { parse } from './parser.js';

export class EvalError extends Error {}

const FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  cot: (x) => 1 / Math.tan(x), sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x),
  ln: Math.log, exp: Math.exp, log: Math.log10,
};

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
    case 'add': return node.items.reduce((s, it) => (it.op === '-' ? s - ev(it.node) : s + ev(it.node)), 0);
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
    case 'func': {
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

const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

// Compares a learner's typed answer with the expected answer.
// `solveFor`: for "solve for x" problems, accepts "4" or "x = 4".
// Returns { ok, reason, tree }.
export function checkAnswer(typed, expected, { solveFor } = {}) {
  let tree;
  try {
    tree = parse(typed).tree;
  } catch (e) {
    return { ok: false, reason: 'unreadable', message: e.message };
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
  try {
    for (const t of trials) {
      const env = Object.fromEntries(names.map((n, i) => [n, t + i * 0.37]));
      const a = evaluate(tree, env);
      const b = evaluate(want, env);
      if (!Number.isFinite(b)) continue;
      if (!close(a, b)) return { ok: false, reason: 'wrong', tree };
    }
  } catch (e) {
    return { ok: false, reason: 'unreadable', message: e.message, tree };
  }
  return { ok: true, tree };
}
