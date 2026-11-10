// Display settings (text size, theme) and remembering the learner's choices
// on this device. Storage can be blocked: everything still works without it.

import { $ } from './ui.js';

const KEY = 'saymath-settings';
const FIELDS = ['lang', 'mode', 'voiceOn', 'rate', 'textSize', 'theme'];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  const out = {};
  for (const f of FIELDS) { const el = $(f); out[f] = el.type === 'checkbox' ? el.checked : el.value; }
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* private mode */ }
}

function apply() {
  document.documentElement.style.setProperty('--scale', $('textSize').value);
  const theme = $('theme').value;
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = theme;
}

export function initSettings() {
  const saved = load();
  for (const f of FIELDS) {
    const el = $(f);
    if (!(f in saved)) continue;
    if (el.type === 'checkbox') el.checked = saved[f]; else el.value = saved[f];
  }
  apply();
  for (const f of FIELDS) $(f).addEventListener('change', () => { apply(); save(); });
}
