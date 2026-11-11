import { parse, ParseError } from './src/parser.js';
import { speak, explain, children } from './src/speak.js';
import { applyUI, ui } from './src/i18n.js';
import { render, rawScreenReader } from './src/render.js';
import { attachExplorer } from './src/explorer.js';
import { $, settings, say, announce, mountMath } from './src/ui.js';
import { initPractice } from './src/practice.js';
import { initTeacher } from './src/teacher.js';
import { initSettings } from './src/settings.js';
import { toBraille, toASCII } from './src/braille.js';
import { download } from './src/download.js';
import { initPhoto } from './src/photo-ui.js';
import { toMathML, toLatex } from './src/export.js';
import { initKeypad } from './src/keypad.js';
import { canListen, listenOnce, spokenToMath } from './src/voice.js';

let current = null; // { tree, words, src }

function showMessages(errors, warnings) {
  const box = $('mathMsg');
  box.replaceChildren();
  for (const e of errors) box.append(Object.assign(document.createElement('p'), { className: 'error', textContent: e }));
  for (const w of warnings) box.append(Object.assign(document.createElement('p'), { className: 'warning', textContent: w }));
}

// Read-along: find where each top-level part of the maths is in the spoken
// sentence, so the part being read can be highlighted in the equation and in
// the words below it.
function segment(tree, words, rendered) {
  const top = rendered.info.get(rendered.root);
  const segs = [];
  let from = 0;
  children(tree).forEach((kid, i) => {
    const w = speak(kid.node, { lang: settings.lang, mode: 'clear' });
    const at = words.indexOf(w, from);
    if (at < 0 || !top.kids[i]) return;
    segs.push({ start: at, end: at + w.length, el: top.kids[i].el });
    from = at + w.length;
  });
  return segs;
}

function drawSpoken(words, segs) {
  const box = $('spoken');
  box.replaceChildren();
  let pos = 0;
  for (const s of segs) {
    if (s.start > pos) box.append(words.slice(pos, s.start));
    s.span = Object.assign(document.createElement('span'), { textContent: words.slice(s.start, s.end) });
    box.append(s.span);
    pos = s.end;
  }
  box.append(words.slice(pos));
}

function clearReading() {
  document.querySelectorAll('.reading').forEach((e) => e.classList.remove('reading'));
}

function readAlong() {
  const { words, segments } = current;
  clearReading();
  say(words, settings.lang, {
    onBoundary(i) {
      clearReading();
      const s = segments.find((x) => i >= x.start && i < x.end);
      if (s) { s.el.classList.add('reading'); s.span.classList.add('reading'); }
    },
    onEnd: clearReading,
  });
}

function update({ speakNow = true } = {}) {
  const src = $('mathIn').value;
  let parsed;
  try {
    parsed = parse(src);
  } catch (err) {
    if (!(err instanceof ParseError)) throw err;
    const L = settings.lang;
    const where = err.pos !== undefined && src.trim() ? ` ${explain({ code: 'at', arg: err.pos + 1 }, L)}` : '';
    showMessages([explain(err, L) + where], []);
    if (speakNow) say(explain(err, L));
    return;
  }
  showMessages([], parsed.warnings.map((w) => explain(w, settings.lang)));
  if (parsed.latex) $('mathMsg').append(Object.assign(document.createElement('p'), { className: 'hint', textContent: ui(settings.lang).latexNote(parsed.latex) }));
  const words = speak(parsed.tree, { lang: settings.lang, mode: settings.mode });
  current = { tree: parsed.tree, words, src };

  const rendered = render(parsed.tree);
  mountMath($('visual'), $('crumbs'), rendered, words, attachExplorer);
  current.segments = segment(parsed.tree, words, rendered);
  drawSpoken(words, current.segments);
  current.braille = toBraille(parsed.tree);
  $('brailleOut').textContent = current.braille;
  // Tells screen readers which voice to use for the words.
  for (const id of ['spoken', 'afterText']) $(id).lang = settings.lang;
  $('result').hidden = false;

  $('beforeText').textContent = rawScreenReader(src);
  $('afterText').textContent = words;
  $('compare').hidden = false;

  if (speakNow) readAlong();
}

$('mathForm').addEventListener('submit', (e) => { e.preventDefault(); update(); });
$('replay').addEventListener('click', () => current && readAlong());
$('hearBefore').addEventListener('click', () => current && say(rawScreenReader(current.src), 'en'));
$('copySpoken').addEventListener('click', async () => {
  if (!current) return;
  try { await navigator.clipboard.writeText(current.words); announce(ui(settings.lang).copied); } catch { announce(ui(settings.lang).copyFailed); }
});
$('copyBraille').addEventListener('click', async () => {
  if (!current) return;
  try { await navigator.clipboard.writeText(current.braille); announce(ui(settings.lang).brailleCopied); } catch { announce(ui(settings.lang).copyFailed); }
});
$('downloadBrf').addEventListener('click', () => current && download('saymath.brf', `${toASCII(current.braille)}\r\n`, 'text/plain'));
// A link that opens SayMath on this maths: ?m=<maths>&lang=<language>#listen
$('copyLink').addEventListener('click', async () => {
  if (!current) return;
  const url = new URL(location.href);
  url.search = new URLSearchParams({ m: current.src, lang: settings.lang }).toString();
  url.hash = 'listen';
  try { await navigator.clipboard.writeText(url.href); announce(ui(settings.lang).linkCopied); } catch { announce(ui(settings.lang).copyFailed); }
});
$('printPage').addEventListener('click', () => window.print());
async function copyAs(convert) {
  if (!current) return;
  try { await navigator.clipboard.writeText(convert(current.tree)); announce(ui(settings.lang).copied); } catch { announce(ui(settings.lang).copyFailed); }
}
$('copyMathML').addEventListener('click', () => copyAs(toMathML));
$('copyLatex').addEventListener('click', () => copyAs(toLatex));
// Say it: answer or enter maths by voice.
async function hearSpeech(input, after) {
  const t = ui(settings.lang);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  announce(t.voiceListening);
  try {
    const heard = await listenOnce(settings.lang);
    const typed = spokenToMath(heard, settings.lang);
    input.value = typed;
    input.dispatchEvent(new Event('input'));
    announce(t.voiceHeard(heard, typed));
    after();
  } catch {
    announce(t.voiceFailed);
  }
}
if (canListen()) {
  document.querySelectorAll('.mic-row').forEach((r) => { r.hidden = false; });
  $('mathMic').addEventListener('click', () => hearSpeech($('mathIn'), () => update()));
  $('pMic').addEventListener('click', () => hearSpeech($('pAnswer'), () => setTimeout(() => $('pEchoHear').click(), 250)));
}
// Keyboard shortcuts list: the ? key (when not typing) or the footer button.
function openKeys() {
  const list = $('keysList');
  list.replaceChildren(...ui(settings.lang).shortcuts.flatMap(([k, what]) => [
    Object.assign(document.createElement('dt'), { textContent: k }),
    Object.assign(document.createElement('dd'), { textContent: what }),
  ]));
  $('keysDialog').showModal();
}
$('keysOpen').addEventListener('click', openKeys);
document.addEventListener('keydown', (e) => {
  const typing = e.target.closest && e.target.closest('input, textarea, select');
  if (e.key === '?' && !typing && !$('keysDialog').open) { e.preventDefault(); openKeys(); }
});
// Esc stops speaking, anywhere on the page.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && 'speechSynthesis' in window) speechSynthesis.cancel();
});
document.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => {
  $('mathIn').value = b.dataset.ex;
  update();
}));
['lang', 'mode'].forEach((id) => $(id).addEventListener('change', () => {
  applyUI(settings.lang);
  update({ speakNow: false });
  document.dispatchEvent(new Event('saymath:settings'));
}));

// Tabs: Left/Right arrows move between them (ARIA tabs pattern).
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = true) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute('aria-controls')).hidden = !on;
  }
  if (focus) tab.focus();
  try { history.replaceState(null, '', `#${tab.getAttribute('aria-controls')}`); } catch { /* file:// */ }
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (e.key === 'Home') selectTab(tabs[0]);
    else if (e.key === 'End') selectTab(tabs[tabs.length - 1]);
    else if (step) selectTab(tabs[(i + step + tabs.length) % tabs.length]);
    else return;
    e.preventDefault();
  });
});
// Open the tab named in the link (#practice, #teach), also on back/forward.
function tabFromHash() {
  const t = tabs.find((x) => `#${x.getAttribute('aria-controls')}` === location.hash);
  if (t) selectTab(t, false);
}
tabFromHash();
window.addEventListener('hashchange', tabFromHash);

// Chrome loads voices late.
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

initSettings();
// Opened from a shared link: show that maths, in that language.
const shared = new URLSearchParams(location.search);
if (shared.get('lang') && [...$('lang').options].some((o) => o.value === shared.get('lang'))) $('lang').value = shared.get('lang');
if (shared.get('m')) $('mathIn').value = shared.get('m').slice(0, 500);
applyUI(settings.lang);
update({ speakNow: false });
initPractice();
initTeacher();
initKeypad($('mathKeys'), $('mathIn'));
initKeypad($('pKeys'), $('pAnswer'));
initPhoto({
  useMath(math) {
    $('mathIn').value = math;
    update();
    $('visual').focus();
  },
  toTeach(items) {
    const box = $('wsLines');
    const lines = items.map((it) => (it.prompt ? `${it.prompt.replace(/:\s*$/, '')}: ${it.math}` : it.math));
    box.value = `${box.value.trim()}\n${lines.join('\n')}`.trim();
    box.dispatchEvent(new Event('input'));
    selectTab(tabs.find((x) => x.id === 'tab-teach'));
  },
});

// Offline: after the first visit, SayMath works with no internet.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    $('offlineNote').textContent = ui(settings.lang).savedOffline;
  }).catch(() => {});
}
