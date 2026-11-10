import { parse, ParseError } from './src/parser.js';
import { speak } from './src/speak.js';
import { render, rawScreenReader } from './src/render.js';
import { EN } from './src/lang/en.js';

const $ = (id) => document.getElementById(id);
const LANG_INFO = { en: EN };

export const settings = {
  get lang() { return $('lang').value; },
  get mode() { return $('mode').value; },
  get voiceOn() { return $('voiceOn').checked; },
  get rate() { return Number($('rate').value); },
};

// Speaks with the device's built-in voice (works offline on most phones).
export function say(text, lang = settings.lang) {
  announce(text);
  if (!settings.voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const want = (LANG_INFO[lang] || EN).speechLang;
  u.lang = want;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === want) || voices.find((v) => v.lang.startsWith(want.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = settings.rate;
  speechSynthesis.speak(u);
}

// Screen reader users hear this through the live region.
export function announce(text) {
  const a = $('announcer');
  a.textContent = '';
  setTimeout(() => { a.textContent = text; }, 30);
}

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
    if (speakNow) say(err.message);
    return;
  }
  showMessages([], parsed.warnings.map((w) => w.message));
  const words = speak(parsed.tree, { lang: settings.lang, mode: settings.mode });
  current = { tree: parsed.tree, words, src };

  const { root } = render(parsed.tree);
  $('visual').replaceChildren(root);
  $('spoken').textContent = words;
  $('result').hidden = false;

  $('beforeText').textContent = rawScreenReader(src);
  $('afterText').textContent = words;
  $('compare').hidden = false;

  document.dispatchEvent(new CustomEvent('saymath:update', { detail: { ...current, parsed } }));
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
['lang', 'mode'].forEach((id) => $(id).addEventListener('change', () => update({ speakNow: false })));

// Chrome loads voices late.
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

update({ speakNow: false });
