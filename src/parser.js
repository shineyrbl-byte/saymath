// Parses typed math (like "(x^2 + 3x)/(2x - 1) = sqrt(5)") into a tree.
// The syntax is close to what students type on a calculator or in AsciiMath.

// `code` and `arg` let the app show the message in the learner's language
// (see `errors` in the phrasebooks). `message` is the English version.
export class ParseError extends Error {
  constructor(message, pos, code, arg) {
    super(message);
    this.pos = pos;
    this.code = code;
    this.arg = arg;
  }
}

const FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'log', 'ln', 'exp', 'det'];
const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'rho', 'sigma', 'tau', 'phi', 'omega'];
const SPECIAL = ['sqrt', 'root', 'abs', 'infinity', 'inf'];
// Calculus words count only when a bracket follows: sum(...), so "suma" stays letters.
const CALC = ['sum', 'prod', 'int', 'lim', 'diff'];
// Longest first, so "sqrt" wins over "s", "theta" over "t".
const WORDS = [...FUNCS, ...GREEK, ...SPECIAL, ...CALC].sort((a, b) => b.length - a.length);

const UNICODE = {
  '×': '*', '·': '*', '÷': '/', '−': '-', '–': '-', '≤': '<=', '≥': '>=', '≠': '!=',
  '√': 'sqrt', 'π': 'pi', 'θ': 'theta', 'α': 'alpha', 'β': 'beta', '∞': 'infinity',
  'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'λ': 'lambda', 'μ': 'mu', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau',
  'φ': 'phi', 'ω': 'omega', '∑': 'sum', '∏': 'prod', '∫': 'int', '→': '->', '±': '+/-', '≈': '~=',
  '²': '^2', '³': '^3',
};

export function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (CALC.includes(UNICODE[ch])) { tokens.push({ type: 'calc', value: UNICODE[ch], pos: i }); i++; continue; }
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
      const after = (w) => src.slice(i + w.length).trimStart()[0];
      const word = WORDS.find((w) => rest.startsWith(w) && (!CALC.includes(w) || after(w) === '('));
      if (word) {
        const name = word === 'inf' ? 'infinity' : word;
        const type = FUNCS.includes(name) ? 'func' : GREEK.includes(name) || name === 'infinity' ? 'const'
          : CALC.includes(name) ? 'calc' : name;
        tokens.push({ type, value: name, pos: i });
        i += word.length;
      } else {
        // Unknown words split into single letters: "xy" means x times y.
        tokens.push({ type: 'var', value: ch, pos: i });
        i++;
      }
      continue;
    }
    if (src.startsWith('+/-', i)) { tokens.push({ type: 'pm', value: '±', pos: i }); i += 3; continue; }
    const two = src.slice(i, i + 2);
    if (two === '->') { tokens.push({ type: 'arrow', value: '->', pos: i }); i += 2; continue; }
    if (two === '~=') { tokens.push({ type: 'rel', value: '~=', pos: i }); i += 2; continue; }
    if (['<=', '>=', '!='].includes(two)) {
      tokens.push({ type: 'rel', value: two, pos: i });
      i += 2;
      continue;
    }
    if ('=<>'.includes(ch)) { tokens.push({ type: 'rel', value: ch, pos: i }); i++; continue; }
    if ('+-*/^_!(),|'.includes(ch)) { tokens.push({ type: ch, value: ch, pos: i }); i++; continue; }
    if (ch === '°') { tokens.push({ type: 'deg', value: ch, pos: i }); i++; continue; }
    if ('[{'.includes(ch)) { tokens.push({ type: '(', value: ch, pos: i }); i++; continue; }
    if (']}'.includes(ch)) { tokens.push({ type: ')', value: ch, pos: i }); i++; continue; }
    throw new ParseError(`I don't know the symbol "${ch}".`, i, 'symbol', ch);
  }
  return tokens;
}

// A tree node is a plain object with a `type`. Types:
//   num {value} | var {name} | const {name}
//   add {items:[{op:'+'|'-'|null, node}]}   mul {factors, explicit:[bool]}
//   frac {num, den} | pow {base, exp} | sub {base, sub} | neg {arg}
//   sqrt {arg} | root {index, arg} | abs {arg} | fact {arg} | paren {arg}
//   func {name, arg, base?} | rel {items, ops} | list {items}
//   bigop {op:'sum'|'prod', lower, upper, body} | integral {body, v, lower?, upper?}
//   limit {v, to, body} | deriv {body, v, order} | matrix {rows:[row]} | row {items}
//   deg {arg}       add items can also have op '±'
export function parse(src) {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new ParseError('Type some math to start.', 0, 'empty');
  const warnings = [];
  let p = 0;
  let absDepth = 0;

  const peek = () => tokens[p];
  const at = (type) => tokens[p] && tokens[p].type === type;
  const next = () => tokens[p++];
  const expect = (type, msg, code) => {
    if (!at(type)) throw new ParseError(msg, peek() ? peek().pos : src.length, code);
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
    while (at('+') || at('-') || at('pm')) {
      const op = next().type === 'pm' ? '±' : tokens[p - 1].type;
      items.push({ op, node: term() });
    }
    return items.length > 1 ? { type: 'add', items } : items[0].node;
  }

  // Can the current token begin a factor? Used for implicit multiplication ("3x").
  function startsFactor() {
    const t = peek();
    if (!t) return false;
    if (t.type === '|') return absDepth === 0;
    return ['num', 'var', 'const', 'func', 'sqrt', 'root', 'abs', 'calc', '('].includes(t.type);
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
            code: 'ambiguousFraction',
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
        warnings.push({ pos: tokens[p - 1].pos, code: 'numberAfter', message: 'A number after a letter or bracket was read as multiplication. Use * to make it clear.' });
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
    if (at('pm')) { next(); return { type: 'pm', arg: unary() }; }
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
        if (!peek()) throw new ParseError('Something is missing after ^ (the power).', src.length, 'missingPower');
        node = { type: 'pow', base: node, exp: unwrap(exponent()) };
      } else if (at('_')) {
        next();
        node = { type: 'sub', base: node, sub: unwrap(primary()) };
      } else if (at('!')) {
        next();
        node = { type: 'fact', arg: node };
      } else if (at('deg')) {
        next();
        node = { type: 'deg', arg: node };
      } else {
        return node;
      }
    }
  }

  // The argument of sqrt/sin/etc: a bracket group, or a single factor ("sin x").
  function argument(name) {
    if (!peek()) throw new ParseError(`Something is missing after ${name}.`, src.length, 'missingAfter', name);
    if (at('(')) return unwrap(primary());
    return postfix(primary());
  }

  function primary() {
    const t = peek();
    if (!t) throw new ParseError('The math ends too early. Is something missing at the end?', src.length, 'endsEarly');
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
          expect(')', 'A bracket was opened but never closed.', 'unclosed');
          // [[1, 2], [3, 4]] is a matrix: square-bracket rows of the same length.
          const rows = items.every((it) => it.type === 'list' && it.square) && items.length > 1
            && items.every((it) => it.items.length === items[0].items.length);
          if (t.value === '[' && rows) return { type: 'matrix', rows: items.map((r) => ({ type: 'row', items: r.items })) };
          return { type: 'list', items, square: t.value === '[' };
        }
        expect(')', 'A bracket was opened but never closed.', 'unclosed');
        return { type: 'paren', arg: inner };
      }
      case '|': {
        next();
        absDepth++;
        const inner = expr();
        absDepth--;
        expect('|', 'An absolute value bar | was opened but never closed.', 'unclosedAbs');
        return { type: 'abs', arg: inner };
      }
      case 'sqrt': next(); return { type: 'sqrt', arg: argument('sqrt') };
      case 'abs': next(); return { type: 'abs', arg: argument('abs') };
      case 'root': {
        next();
        expect('(', 'Write a root like root(3, x) for the cube root of x.', 'rootForm');
        const index = expr();
        expect(',', 'Write a root like root(3, x) for the cube root of x.', 'rootForm');
        const arg = relation();
        expect(')', 'A bracket was opened but never closed.', 'unclosed');
        return { type: 'root', index, arg };
      }
      case 'func': {
        next();
        let base;
        let power;
        if (at('_')) { next(); base = unwrap(primary()); }
        // "sin^2 x" means (sin x)^2.
        if (at('^')) { next(); power = unwrap(exponent()); }
        const fn = { type: 'func', name: t.value, base, arg: argument(t.value) };
        return power ? { type: 'pow', base: fn, exp: power } : fn;
      }
      case 'calc': next(); return calculus(t);
      case ')': throw new ParseError('There is a closing bracket with no opening bracket.', t.pos, 'extraClose');
      default: throw new ParseError(`"${t.value}" can't go here.`, t.pos, 'cantGo', t.value);
    }
  }

  // sum(i=1, n, body)  prod(i=1, n, body)  int(body, x)  int(body, x, a, b)
  // lim(x -> a, body)  diff(body, x)  diff(body, x, 2)
  function calculus(t) {
    const name = t.value;
    const form = { sum: 'sum(i=1, n, i^2)', prod: 'prod(k=1, n, k)', int: 'int(x^2, x) or int(x^2, x, 0, 1)',
      lim: 'lim(x -> 0, sin(x)/x)', diff: 'diff(x^3, x)' }[name];
    const bad = () => new ParseError(`Write it like ${form}.`, t.pos, 'calcForm', form);
    expect('(', `Write it like ${form}.`, 'calcForm');
    const args = [];
    let arrow = null;
    while (true) {
      if (name === 'lim' && args.length === 0) {
        const v = expr();
        if (!at('arrow')) throw bad();
        next();
        arrow = { v, to: expr() };
        args.push(null);
      } else {
        args.push(relation());
      }
      if (at(',')) { next(); continue; }
      break;
    }
    expect(')', 'A bracket was opened but never closed.', 'unclosed');
    const isVar = (n) => n && (n.type === 'var' || n.type === 'const');
    switch (name) {
      case 'sum': case 'prod':
        if (args.length !== 3) throw bad();
        return { type: 'bigop', op: name, lower: args[0], upper: args[1], body: args[2] };
      case 'int':
        if (!(args.length === 2 || args.length === 4) || !isVar(args[1])) throw bad();
        return args.length === 2 ? { type: 'integral', body: args[0], v: args[1] }
          : { type: 'integral', body: args[0], v: args[1], lower: args[2], upper: args[3] };
      case 'lim':
        if (args.length !== 2 || !isVar(arrow.v)) throw bad();
        return { type: 'limit', v: arrow.v, to: arrow.to, body: args[1] };
      default: {
        if (!(args.length === 2 || args.length === 3) || !isVar(args[1])) throw bad();
        const order = args[2] ? args[2] : null;
        if (order && !(order.type === 'num' && /^\d+$/.test(order.value))) throw bad();
        return { type: 'deriv', body: args[0], v: args[1], order: order ? Number(order.value) : 1 };
      }
    }
  }

  const tree = relation();
  if (p < tokens.length) {
    const t = peek();
    throw new ParseError(
      t.type === ')' ? 'There is a closing bracket with no opening bracket.' : `I didn't expect "${t.value}" here.`,
      t.pos,
      t.type === ')' ? 'extraClose' : 'unexpected',
      t.value,
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
    case 'bigop': return [{ role: 'from', node: node.lower }, { role: 'to', node: node.upper }, { role: 'body', node: node.body }];
    case 'integral': return [...(node.lower ? [{ role: 'from', node: node.lower }, { role: 'to', node: node.upper }] : []),
      { role: 'integrand', node: node.body }, { role: 'variable', node: node.v }];
    case 'limit': return [{ role: 'variable', node: node.v }, { role: 'approaches', node: node.to }, { role: 'body', node: node.body }];
    case 'deriv': return [{ role: 'function', node: node.body }, { role: 'variable', node: node.v }];
    case 'matrix': return node.rows.map((r, i) => ({ role: 'row', node: r, index: i }));
    case 'row': return node.items.map((n, i) => ({ role: 'entry', node: n, index: i }));
    case 'neg': case 'abs': case 'fact': case 'paren': case 'pm': case 'deg':
      return [{ role: 'inside', node: node.arg }];
    default: return [];
  }
}
