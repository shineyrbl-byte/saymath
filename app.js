import { parse, ParseError } from './src/parser.js';
import { speak } from './src/speak.js';
import { render, rawScreenReader } from './src/render.js';
import { attachExplorer } from './src/explorer.js';
import { $, settings, say, announce, mountMath } from './src/ui.js';
import { initPractice } from './src/practice.js';
import { initTeacher } from './src/teacher.js';
import { initSettings } from './src/settings.js';

let current = null; // { tree, words, src }

function showMessages(errors, warnings) {
  const box = $('mathMsg');
  box.replaceChildren();
  for (const e of errors) box.append(Object.assign(document.createElement('p'), { className: 'error', textContent: e }));
  for (const w of warnings) box.append(Object.assign(document.createElement('p'), { className: 'warning', textContent: w }));
}

function update({ speakNow = true } = {}) {
  const src = $('mathIn').value;
  let parsed;
  try {
    parsed = parse(src);
  } catch (err) {
    if (!(err instanceof ParseError)) throw err;
    const where = err.pos !== undefined && src.trim() ? ` (at character ${err.pos + 1})` : '';
    showMessages([err.message + where], []);
    if (speakNow) say(err.message, 'en');
    return;
  }
  showMessages([], parsed.warnings.map((w) => w.message));
  const words = speak(parsed.tree, { lang: settings.lang, mode: settings.mode });
  current = { tree: parsed.tree, words, src };

  mountMath($('visual'), $('crumbs'), render(parsed.tree), words, attachExplorer);
  $('spoken').textContent = words;
  // Tells screen readers which voice to use for the words.
  for (const id of ['spoken', 'afterText']) $(id).lang = settings.lang;
  $('result').hidden = false;

  $('beforeText').textContent = rawScreenReader(src);
  $('afterText').textContent = words;
  $('compare').hidden = false;

  if (speakNow) say(words);
}

$('mathForm').addEventListener('submit', (e) => { e.preventDefault(); update(); });
$('replay').addEventListener('click', () => current && say(current.words));
$('hearBefore').addEventListener('click', () => current && say(rawScreenReader(current.src), 'en'));
$('copySpoken').addEventListener('click', async () => {
  if (!current) return;
  try { await navigator.clipboard.writeText(current.words); announce('Copied.'); } catch { announce('Could not copy.'); }
});
document.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => {
  $('mathIn').value = b.dataset.ex;
  update();
}));
['lang', 'mode'].forEach((id) => $(id).addEventListener('change', () => {
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
update({ speakNow: false });
initPractice();
initTeacher();

// Offline: after the first visit, SayMath works with no internet.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    $('offlineNote').textContent = 'Saved for offline use.';
  }).catch(() => {});
}
