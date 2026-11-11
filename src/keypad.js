// On-screen maths keys: insert symbols at the cursor, for phones and for
// anyone who finds ^, / and brackets hard to type. `|` marks where the
// cursor goes after inserting.
import { ui } from './i18n.js';
import { settings } from './ui.js';

export const KEYS = [
  ['x²', '^2', 'squared'], ['xⁿ', '^', 'power'], ['√', 'sqrt(|)', 'root'], ['a/b', '/', 'over'],
  ['(', '(', 'open'], [')', ')', 'close'], ['π', 'pi', 'pi'], ['±', '+/-', 'plusMinus'],
  ['=', ' = ', 'equals'], ['≤', ' <= ', 'le'], ['≥', ' >= ', 'ge'], ['×', '*', 'times'],
  ['x', 'x', 'x'], ['y', 'y', 'y'], ['∫', 'int(|, x)', 'integral'], ['Σ', 'sum(i=1, n, |)', 'sum'], ['⌫', null, 'back'],
];

export function initKeypad(box, input) {
  const draw = () => {
    const names = ui(settings.lang).keyNames;
    box.replaceChildren(...KEYS.map(([label, insert, name]) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label, className: 'key' });
      b.setAttribute('aria-label', names[name] || label);
      b.addEventListener('click', () => {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        if (insert === null) {
          const from = start === end ? Math.max(0, start - 1) : start;
          input.value = input.value.slice(0, from) + input.value.slice(end);
          input.setSelectionRange(from, from);
        } else {
          const at = insert.indexOf('|');
          const text = insert.replace('|', '');
          input.value = input.value.slice(0, start) + text + input.value.slice(end);
          const pos = start + (at < 0 ? text.length : at);
          input.setSelectionRange(pos, pos);
        }
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
      return b;
    }));
  };
  draw();
  document.addEventListener('saymath:settings', draw);
}
