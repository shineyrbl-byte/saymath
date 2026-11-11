// Shared page helpers: settings, speaking, announcing.

import { EN } from './lang/en.js';
import { HI } from './lang/hi.js';
import { MR } from './lang/mr.js';
import { TA } from './lang/ta.js';
import { BN } from './lang/bn.js';
import { ui } from './i18n.js';
import { cue } from './cues.js';
import { parse } from './parser.js';
import { speak } from './speak.js';

export const $ = (id) => document.getElementById(id);
export const LANG_INFO = { en: EN, hi: HI, mr: MR, ta: TA, bn: BN };

export const settings = {
  get lang() { return $('lang').value; },
  get mode() { return $('mode').value; },
  get voiceOn() { return $('voiceOn').checked; },
  get rate() { return Number($('rate').value); },
  get cues() { return $('cues').checked; },
  get phrases() { return LANG_INFO[$('lang').value] || EN; },
};

// Screen reader users hear this through the live region.
export function announce(text) {
  const a = $('announcer');
  a.textContent = '';
  setTimeout(() => { a.textContent = text; }, 30);
}

// The voice the learner picked for a language (remembered on this device).
const VOICE_KEY = 'saymath-voice';
function chosenVoice() {
  try { return (JSON.parse(localStorage.getItem(VOICE_KEY)) || {})[settings.lang] || ''; } catch { return ''; }
}

// Lists this device's voices for the current language in Settings.
export function fillVoices() {
  if (!('speechSynthesis' in window)) return;
  const sel = $('voicePick');
  const info = LANG_INFO[settings.lang] || EN;
  const codes = [info.speechLang, info.fallbackSpeechLang].filter(Boolean).map((c) => c.slice(0, 2));
  const list = speechSynthesis.getVoices().filter((v) => codes.includes(v.lang.slice(0, 2)));
  sel.replaceChildren(sel.options[0], ...list.map((v) => Object.assign(document.createElement('option'), { value: v.name, textContent: `${v.name} (${v.lang})` })));
  sel.value = list.some((v) => v.name === chosenVoice()) ? chosenVoice() : '';
}

export function initVoicePick() {
  $('voicePick').addEventListener('change', () => {
    try {
      const all = JSON.parse(localStorage.getItem(VOICE_KEY)) || {};
      all[settings.lang] = $('voicePick').value;
      localStorage.setItem(VOICE_KEY, JSON.stringify(all));
    } catch { /* storage blocked */ }
    // A short sample, so the learner hears the voice they picked.
    say(speak(parse('1 + 1 = 2').tree, { lang: settings.lang }));
  });
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillVoices);
  document.addEventListener('saymath:settings', fillVoices);
  fillVoices();
}

// Speaks with the device's built-in voice (works offline on most phones).
// `onBoundary(charIndex)` and `onEnd()` (optional) follow the speech, for read-along highlighting.
export function say(text, lang = settings.lang, { onBoundary, onEnd } = {}) {
  announce(text);
  if (!settings.voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const info = LANG_INFO[lang] || EN;
  const want = info.speechLang;
  u.lang = want;
  const voices = speechSynthesis.getVoices();
  const find = (code) => code && (voices.find((v) => v.lang === code) || voices.find((v) => v.lang.startsWith(code.slice(0, 2))));
  // No voice for this language: a related one (Hindi for Marathi) is better than none.
  const chosen = voices.find((v) => v.name === chosenVoice() && v.lang.slice(0, 2) === want.slice(0, 2));
  const voice = chosen || find(want) || find(info.fallbackSpeechLang);
  if (voice) u.voice = voice;
  else if (lang !== 'en') announce(`${text} ${ui(settings.lang).noVoice(want)}`);
  u.rate = settings.rate;
  if (onBoundary) u.onboundary = (e) => onBoundary(e.charIndex);
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  speechSynthesis.speak(u);
}

// Renders a tree into an explorer box and wires up the keyboard explorer.
export function mountMath(box, crumbs, rendered, words, attachExplorer) {
  rendered.root.setAttribute('aria-hidden', 'true');
  box.replaceChildren(rendered.root);
  box.setAttribute('aria-label', `${ui(settings.lang).mathExplorer}: ${words}`);
  box._explorer?.detach();
  box._explorer = attachExplorer(box, rendered, {
    onSay: (t) => say(t),
    getOpts: () => ({ lang: settings.lang, mode: settings.mode }),
    crumbs,
    lang: () => settings.phrases,
    onCue: (kind) => settings.cues && cue(kind),
  });
}
