// Parses typed math (like "(x^2 + 3x)/(2x - 1) = sqrt(5)") into a tree.
// The syntax is close to what students type on a calculator or in AsciiMath.

export class ParseError extends Error {
  constructor(message, pos) {
    super(message);
    this.pos = pos;
  }
}

const FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp'];
const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'phi', 'omega'];
const SPECIAL = ['sqrt', 'root', 'abs', 'infinity', 'inf'];
// Longest first, so "sqrt" wins over "s", "theta" over "t".
const WORDS = [...FUNCS, ...GREEK, ...SPECIAL].sort((a, b) => b.length - a.length);

const UNICODE = {
  '×': '*', '·': '*', '÷': '/', '−': '-', '–': '-', '≤': '<=', '≥': '>=', '≠': '!=',
  '√': 'sqrt', 'π': 'pi', 'θ': 'theta', 'α': 'alpha', 'β': 'beta', '∞': 'infinity',
  '²': '^2', '³': '^3',
};

export function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (UNICODE[ch]) {
      // Re-tokenize the ASCII replacement in place.
      for (const t of tokenize(UNICODE[ch])) tokens.push({ ...t, pos: i });
      i++;
      continue;
    }
    const num = /^(\d+(\.\d+)?|\.\d+)/.exec(src.slice(i));
    if (num) {
      tokens.push({ type: 'num', value: num[0], pos: i });
      i += num[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const rest = src.slice(i).toLowerCase();
      const word = WORDS.find((w) => rest.startsWith(w));
      if (word) {
        const name = word === 'inf' ? 'infinity' : word;
        const type = FUNCS.includes(name) ? 'func' : GREEK.includes(name) || name === 'infinity' ? 'const' : name;
        tokens.push({ type, value: name, pos: i });
        i += word.length;
      } else {
        // Unknown words split into single letters: "xy" means x times y.
        tokens.push({ type: 'var', value: ch, pos: i });
        i++;
      }
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '!='].includes(two)) {
      tokens.push({ type: 'rel', value: two, pos: i });
      i += 2;
      continue;
    }
    if ('=<>'.includes(ch)) { tokens.push({ type: 'rel', value: ch, pos: i }); i++; continue; }
    if ('+-*/^_!(),|'.includes(ch)) { tokens.push({ type: ch, value: ch, pos: i }); i++; continue; }
    if ('[{'.includes(ch)) { tokens.push({ type: '(', value: ch, pos: i }); i++; continue; }
    if (']}'.includes(ch)) { tokens.push({ type: ')', value: ch, pos: i }); i++; continue; }
    throw new ParseError(`I don't know the symbol "${ch}".`, i);
  }
  return tokens;
}

// A tree node is a plain object with a `type`. Types:
//   num {value} | var {name} | const {name}
//   add {items:[{op:'+'|'-'|null, node}]}   mul {factors, explicit:[bool]}
//   frac {num, den} | pow {base, exp} | sub {base, sub} | neg {arg}
//   sqrt {arg} | root {index, arg} | abs {arg} | fact {arg} | paren {arg}
//   func {name, arg, base?} | rel {items, ops} | list {items}
export function parse(src) {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new ParseError('Type some math to start.', 0);
  const warnings = [];
  let p = 0;
  let absDepth = 0;

  const peek = () => tokens[p];
  const at = (type) => tokens[p] && tokens[p].type === type;
  const next = () => tokens[p++];
  const expect = (type, msg) => {
    if (!at(type)) throw new ParseError(msg, peek() ? peek().pos : src.length);
    return next();
  };
  const unwrap = (n) => (n.type === 'paren' ? n.arg : n);

  function relation() {
    const items = [expr()];
    const ops = [];
    while (at('rel')) {
      ops.push(next().value);
      items.push(expr());
    }
    return ops.length ? { type: 'rel', items, ops } : items[0];
  }

  function expr() {
    const items = [{ op: null, node: term() }];
    while (at('+') || at('-')) {
      const op = next().type;
      items.push({ op, node: term() });
    }
    return items.length > 1 ? { type: 'add', items } : items[0].node;
  }

  // Can the current token begin a factor? Used for implicit multiplication ("3x").
  function startsFactor() {
    const t = peek();
    if (!t) return false;
    if (t.type === '|') return absDepth === 0;
    return ['num', 'var', 'const', 'func', 'sqrt', 'root', 'abs', '('].includes(t.type);
  }

  function term() {
    let acc = unary();
    let lastWasBareFrac = false;
    while (true) {
      if (at('*') || (startsFactor() && !at('num'))) {
        const explicit = at('*');
        if (explicit) next();
        const f = unary();
        if (lastWasBareFrac && !explicit) {
          warnings.push({
            pos: tokens[p - 1].pos,
            message: 'This could mean two things, like 1/2x: (1/2)·x or 1/(2x). I read it as (1/2)·x. Add brackets to make it clear.',
          });
        }
        if (acc.type === 'mul') {
          acc.factors.push(f);
          acc.explicit.push(explicit);
        } else {
          acc = { type: 'mul', factors: [acc, f], explicit: [explicit] };
        }
        lastWasBareFrac = false;
      } else if (at('num') && startsFactor()) {
        // "x 2" or "(x+1)3" is unusual; read it as multiplication but say so.
        const f = unary();
        warnings.push({ pos: tokens[p - 1].pos, message: 'A number after a letter or bracket was read as multiplication. Use * to make it clear.' });
        acc = acc.type === 'mul' ? (acc.factors.push(f), acc.explicit.push(false), acc) : { type: 'mul', factors: [acc, f], explicit: [false] };
      } else if (at('/')) {
        next();
        const den = unary();
        lastWasBareFrac = den.type !== 'paren';
        acc = { type: 'frac', num: unwrap(acc), den: unwrap(den) };
      } else {
        return acc;
      }
    }
  }

  function unary() {
    if (at('-')) { next(); return { type: 'neg', arg: unary() }; }
    if (at('+')) { next(); return unary(); }
    return postfix(primary());
  }

  function exponent() {
    if (at('-')) { next(); return { type: 'neg', arg: exponent() }; }
    let base = primary();
    while (at('!')) { next(); base = { type: 'fact', arg: base }; }
    if (at('^')) { next(); return { type: 'pow', base, exp: unwrap(exponent()) }; }
    return base;
  }

  function postfix(node) {
    while (true) {
      if (at('^')) {
        next();
        if (!peek()) throw new ParseError('Something is missing after ^ (the power).', src.length);
        node = { type: 'pow', base: node, exp: unwrap(exponent()) };
      } else if (at('_')) {
        next();
        node = { type: 'sub', base: node, sub: unwrap(primary()) };
      } else if (at('!')) {
        next();
        node = { type: 'fact', arg: node };
      } else {
        return node;
      }
    }
  }

  // The argument of sqrt/sin/etc: a bracket group, or a single factor ("sin x").
  function argument(name) {
    if (!peek()) throw new ParseError(`Something is missing after ${name}.`, src.length);
    if (at('(')) return unwrap(primary());
    return postfix(primary());
  }

  function primary() {
    const t = peek();
    if (!t) throw new ParseError('The math ends too early. Is something missing at the end?', src.length);
    switch (t.type) {
      case 'num': next(); return { type: 'num', value: t.value };
      case 'var': next(); return { type: 'var', name: t.value };
      case 'const': next(); return { type: 'const', name: t.value };
      case '(': {
        next();
        const inner = relation();
        if (at(',')) {
          const items = [inner];
          while (at(',')) { next(); items.push(relation()); }
          expect(')', 'A bracket was opened but never closed.');
          return { type: 'list', items };
        }
        expect(')', 'A bracket was opened but never closed.');
        return { type: 'paren', arg: inner };
      }
      case '|': {
        next();
        absDepth++;
        const inner = expr();
        absDepth--;
        expect('|', 'An absolute value bar | was opened but never closed.');
        return { type: 'abs', arg: inner };
      }
      case 'sqrt': next(); return { type: 'sqrt', arg: argument('sqrt') };
      case 'abs': next(); return { type: 'abs', arg: argument('abs') };
      case 'root': {
        next();
        expect('(', 'Write a root like root(3, x) for the cube root of x.');
        const index = expr();
        expect(',', 'Write a root like root(3, x) for the cube root of x.');
        const arg = relation();
        expect(')', 'A bracket was opened but never closed.');
        return { type: 'root', index, arg };
      }
      case 'func': {
        next();
        let base;
        if (at('_')) { next(); base = unwrap(primary()); }
        return { type: 'func', name: t.value, base, arg: argument(t.value) };
      }
      case ')': throw new ParseError('There is a closing bracket with no opening bracket.', t.pos);
      default: throw new ParseError(`"${t.value}" can't go here.`, t.pos);
    }
  }

  const tree = relation();
  if (p < tokens.length) {
    const t = peek();
    throw new ParseError(
      t.type === ')' ? 'There is a closing bracket with no opening bracket.' : `I didn't expect "${t.value}" here.`,
      t.pos,
    );
  }
  return { tree, warnings };
}

// The child nodes of a tree node, with a name for each position.
export function children(node) {
  switch (node.type) {
    case 'add': return node.items.map((it, i) => ({ role: 'term', node: it.node, index: i }));
    case 'mul': return node.factors.map((n, i) => ({ role: 'factor', node: n, index: i }));
    case 'rel': return node.items.map((n, i) => ({ role: 'side', node: n, index: i }));
    case 'list': return node.items.map((n, i) => ({ role: 'item', node: n, index: i }));
    case 'frac': return [{ role: 'numerator', node: node.num }, { role: 'denominator', node: node.den }];
    case 'pow': return [{ role: 'base', node: node.base }, { role: 'exponent', node: node.exp }];
    case 'sub': return [{ role: 'base', node: node.base }, { role: 'subscript', node: node.sub }];
    case 'root': return [{ role: 'index', node: node.index }, { role: 'radicand', node: node.arg }];
    case 'func': return [...(node.base ? [{ role: 'base', node: node.base }] : []), { role: 'argument', node: node.arg }];
    case 'sqrt': return [{ role: 'radicand', node: node.arg }];
    case 'neg': case 'abs': case 'fact': case 'paren':
      return [{ role: 'inside', node: node.arg }];
    default: return [];
  }
}
