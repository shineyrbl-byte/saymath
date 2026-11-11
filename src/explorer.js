// Keyboard explorer: walk through an equation one part at a time.
//   Down  - go inside the current part (numerator first, then denominator...)
//   Up    - back out to the bigger part
//   Left / Right - previous / next part at the same level
//   Home  - the whole expression     Space or Enter - say it again
// Clicking a part also selects it.

import { describeStep } from './speak.js';
import { EN } from './lang/en.js';

export const KEY_HELP = EN.keyHelp;

// `onCue(kind)` (optional) plays a sound: 'in', 'out', 'move' or 'edge'.
export function attachExplorer(container, rendered, { onSay, getOpts, crumbs, lang, onCue = () => {} }) {
  const { root, info } = rendered;
  const top = info.get(root);
  let cur = top;
  const t = lang();

  function stepFor(entry) {
    return { node: entry.node, role: entry.role, index: entry.index, count: entry.count };
  }

  function path(entry) {
    const parts = [];
    for (let e = entry; e && e.parent; e = e.parent) parts.unshift(t.roles[e.role] || e.role);
    return parts;
  }

  function show(entry, extra = '') {
    container.querySelectorAll('.is-current').forEach((n) => n.classList.remove('is-current'));
    if (entry !== top) entry.el.classList.add('is-current');
    const p = path(entry);
    crumbs.textContent = p.length ? `${t.wholeThing} › ${p.join(' › ')}` : t.wholeThing;
    const words = describeStep(stepFor(entry), getOpts());
    onSay(extra ? `${words}. ${extra}` : words);
  }

  function go(entry, edgeMsg, kind) {
    if (!entry) { onCue('edge'); onSay(edgeMsg); return; }
    if (kind) onCue(kind);
    cur = entry;
    show(entry);
  }

  function siblings() {
    return cur.parent ? cur.parent.kids : [cur];
  }

  function onKey(e) {
    const sib = siblings();
    const i = sib.indexOf(cur);
    switch (e.key) {
      case 'ArrowDown': go(cur.kids[0], t.nothingInside, 'in'); break;
      case 'ArrowUp': go(cur.parent, t.atTop, 'out'); break;
      case 'ArrowRight': go(sib[i + 1], t.lastPart, 'move'); break;
      case 'ArrowLeft': go(sib[i - 1], t.firstPart, 'move'); break;
      case 'Home': go(top, '', 'out'); break;
      case ' ': case 'Enter': show(cur); break;
      // W: where am I? Reads the path from the whole expression to this part.
      case 'w': case 'W': onSay(`${t.whereLabel}: ${[t.wholeThing, ...path(cur)].join(', ')}`); break;
      default: return;
    }
    e.preventDefault();
  }

  function onClick(e) {
    const hit = e.target.closest('.m-node');
    if (!hit || !info.has(hit)) return;
    container.focus({ preventScroll: true });
    go(info.get(hit));
  }

  container.addEventListener('keydown', onKey);
  container.addEventListener('click', onClick);
  crumbs.textContent = t.wholeThing;

  return {
    detach() {
      container.removeEventListener('keydown', onKey);
      container.removeEventListener('click', onClick);
    },
  };
}
