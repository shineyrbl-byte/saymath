// "Read maths from a photo" panel on the Listen tab.
import { readPhoto, prepareImage, PhotoError } from './photo.js';
import { explain } from './speak.js';
import { ui } from './i18n.js';
import { $, settings, announce } from './ui.js';

const KEY = 'saymath-anthropic-key';

export function initPhoto({ useMath, toTeach }) {
  const t = () => ui(settings.lang);
  let items = [];

  try { const k = localStorage.getItem(KEY); if (k) { $('photoKey').value = k; $('photoRemember').checked = true; } } catch { /* storage blocked */ }
  const remember = () => {
    try {
      if ($('photoRemember').checked && $('photoKey').value.trim()) localStorage.setItem(KEY, $('photoKey').value.trim());
      else localStorage.removeItem(KEY);
    } catch { /* storage blocked */ }
  };
  $('photoRemember').addEventListener('change', remember);
  $('photoKey').addEventListener('change', remember);

  function status(text) {
    $('photoStatus').textContent = text;
    announce(text);
  }

  function draw() {
    const list = $('photoItems');
    list.replaceChildren(...items.map((it) => {
      const li = document.createElement('li');
      li.className = 'ws-item';
      if (it.prompt) li.append(Object.assign(document.createElement('p'), { className: 'prompt', textContent: it.prompt }));
      li.append(Object.assign(document.createElement('p'), { className: 'ws-raw', textContent: it.math }));
      if (it.unsure) li.append(Object.assign(document.createElement('p'), { className: 'msg-inline warning', textContent: t().photoUnsure }));
      if (it.error) li.append(Object.assign(document.createElement('p'), { className: 'msg-inline error', textContent: explain(it.error, settings.lang) }));
      const use = Object.assign(document.createElement('button'), { type: 'button', textContent: t().photoUse });
      use.addEventListener('click', () => useMath(it.math));
      li.append(use);
      return li;
    }));
    $('photoToTeach').hidden = !items.some((it) => !it.error);
  }

  $('photoRead').addEventListener('click', async () => {
    const file = $('photoFile').files[0];
    if (!file) { status(t().photoNoFile); return; }
    remember();
    $('photoRead').disabled = true;
    status(t().photoReading);
    try {
      const img = await prepareImage(file);
      const result = await readPhoto({ apiKey: $('photoKey').value.trim(), ...img });
      items = result.items;
      draw();
      status(items.length ? `${t().photoFound(items.length)}${result.note ? ` ${result.note}` : ''}` : t().photoNone);
    } catch (e) {
      const code = e instanceof PhotoError ? e.code : 'badImage';
      status(t().photoErrors[code] || e.message);
    } finally {
      $('photoRead').disabled = false;
    }
  });
  $('photoToTeach').addEventListener('click', () => toTeach(items.filter((it) => !it.error)));
  document.addEventListener('saymath:settings', draw);
}
