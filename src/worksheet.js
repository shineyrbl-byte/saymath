// Teacher worksheets: parse what the teacher typed, and build one
// self-contained offline HTML file (speech, explorer and answer checking
// included) that can be shared over WhatsApp, Bluetooth or a USB stick.

import { parse } from './parser.js';
import { speak } from './speak.js';

// One question per line:
//   Solve for x: 3x - 4 = 11   answer: x = 5
// The "text:" prefix and the "answer:" part are optional.
export function parseWorksheet(text) {
  const questions = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const q = { line: i + 1, raw: line, prompt: '', math: line, answer: '', solveFor: undefined, error: null, warnings: [] };
    const [left, ans] = line.split(/\s+(?:answer|उत्तर)\s*:\s*/i);
    q.math = left.trim();
    const pre = /^([\p{L}\s,.'()-]*\p{L}{3,}[\p{L}\s,.'()-]*):\s*(.+)$/u.exec(q.math);
    if (pre) { q.prompt = pre[1].trim(); q.math = pre[2].trim(); }
    if (ans) {
      const m = /^([a-z])\s*=\s*(.+)$/.exec(ans.trim());
      if (m) { q.solveFor = m[1]; q.answer = m[2].trim(); } else q.answer = ans.trim();
      try { parse(q.answer); } catch (e) { q.error = `Answer: ${e.message}`; q.errorObj = e; q.errorInAnswer = true; }
    }
    try {
      const w = parse(q.math).warnings;
      q.warnings = w.map((x) => x.message);
      q.warningObjs = w;
    } catch (e) {
      q.error = e.message;
      q.errorObj = e;
      q.errorInAnswer = false;
    }
    questions.push(q);
  });
  return questions;
}

// Plain text version, for SMS, WhatsApp or a braille display.
export function worksheetText(title, instructions, questions, opts) {
  const lines = [title, ''];
  if (instructions) lines.push(instructions, '');
  questions.filter((q) => !q.error).forEach((q, i) => {
    lines.push(`${i + 1}. ${q.prompt ? `${q.prompt} ` : ''}${speak(parse(q.math).tree, opts)}`);
  });
  return lines.join('\n');
}

// ---- A tiny bundler: turns the ES modules into one inline script. ----

export const ENGINE = ['parser', 'lang/en', 'lang/hi', 'speak', 'render', 'explorer', 'evaluate'];

const modVar = (name) => `M_${name.replace(/\W/g, '_')}`;
const resolve = (from, path) => new URL(path, `http://x/${from}.js`).pathname.slice(1).replace(/\.js$/, '');

export function wrapModule(name, src) {
  const names = new Set();
  let body = src.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?\s*$/gm,
    (_, list, path) => `const {${list}} = ${modVar(resolve(name, path))};`);
  body = body.replace(/^export\s+(async\s+function|function|const|let|class)\s+(\w+)/gm, (_, kw, id) => {
    names.add(id);
    return `${kw} ${id}`;
  });
  body = body.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, list) => {
    list.split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => names.add(n));
    return '';
  });
  return `const ${modVar(name)} = (() => {\n${body}\nreturn { ${[...names].join(', ')} };\n})();\n`;
}

export function bundle(sources) {
  return ENGINE.map((name) => wrapModule(name, sources[name])).join('\n');
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load ${url}`);
  return r.text();
}

export async function buildWorksheetHTML(data) {
  const base = new URL('./', import.meta.url);
  const sources = {};
  for (const name of ENGINE) sources[name] = await fetchText(new URL(`${name}.js`, base));
  const runtime = await fetchText(new URL('worksheet-runtime.js', base));
  const css = await fetchText(new URL('../styles.css', base));
  const safe = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  return `<!doctype html>
<html lang="${data.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.title)}</title>
<style>${safe(css)}</style>
</head>
<body>
<main class="wrap" id="main"></main>
<div id="announcer" class="sr-only" aria-live="polite"></div>
<script>
const DATA = ${safe(JSON.stringify(data))};
${safe(bundle(sources))}
${safe(runtime)}
</script>
</body>
</html>
`;
}
