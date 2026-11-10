// Shared page helpers: settings, speaking, announcing.

import { EN } from './lang/en.js';
import { HI } from './lang/hi.js';

export const $ = (id) => document.getElementById(id);
export const LANG_INFO = { en: EN, hi: HI };

export const settings = {
  get lang() { return $('lang').value; },
  get mode() { return $('mode').value; },
  get voiceOn() { return $('voiceOn').checked; },
  get rate() { return Number($('rate').value); },
  get phrases() { return LANG_INFO[$('lang').value] || EN; },
};

// Screen reader users hear this through the live region.
export function announce(text) {
  const a = $('announcer');
  a.textContent = '';
  setTimeout(() => { a.textContent = text; }, 30);
}

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
  else if (lang !== 'en') announce(`${text} (No ${want} voice on this device: install one in your system speech settings.)`);
  u.rate = settings.rate;
  speechSynthesis.speak(u);
}

// Renders a tree into an explorer box and wires up the keyboard explorer.
export function mountMath(box, crumbs, rendered, words, attachExplorer) {
  rendered.root.setAttribute('aria-hidden', 'true');
  box.replaceChildren(rendered.root);
  box.setAttribute('aria-label', `Math explorer: ${words}`);
  box._explorer?.detach();
  box._explorer = attachExplorer(box, rendered, {
    onSay: (t) => say(t),
    getOpts: () => ({ lang: settings.lang, mode: settings.mode }),
    crumbs,
    lang: () => settings.phrases,
  });
}
