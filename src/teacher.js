// Teach tab: type questions, check them, download an offline worksheet.

import { parse } from './parser.js';
import { speak } from './speak.js';
import { render } from './render.js';
import { parseWorksheet, worksheetText, buildWorksheetHTML } from './worksheet.js';
import { $, announce } from './ui.js';

const slug = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'worksheet';

export function initTeacher() {
  const lang = () => $('wsLangSel').value;
  let questions = [];

  function preview() {
    questions = parseWorksheet($('wsLines').value);
    const list = $('wsPreview');
    list.replaceChildren();
    let problems = 0;
    for (const q of questions) {
      const li = document.createElement('li');
      li.className = 'ws-item';
      if (q.error) {
        problems++;
        li.classList.add('has-error');
        li.append(Object.assign(document.createElement('p'), { className: 'ws-raw', textContent: `Line ${q.line}: ${q.raw}` }),
          Object.assign(document.createElement('p'), { className: 'msg-inline error', textContent: q.error }));
      } else {
        const tree = parse(q.math).tree;
        const vis = document.createElement('div');
        vis.className = 'ws-math';
        vis.setAttribute('aria-hidden', 'true');
        vis.append(render(tree).root);
        const words = speak(tree, { lang: lang() });
        const said = Object.assign(document.createElement('p'), { className: 'ws-words', textContent: `${q.prompt ? `${q.prompt}: ` : ''}${words}` });
        said.lang = lang();
        li.append(vis, said);
        const ans = Object.assign(document.createElement('p'), { className: 'hint',
          textContent: q.answer ? `Answer: ${q.solveFor ? `${q.solveFor} = ` : ''}${q.answer} (students can check it)` : 'No answer given: students can listen and explore, but not check.' });
        li.append(ans);
        for (const w of q.warnings) {
          problems++;
          li.append(Object.assign(document.createElement('p'), { className: 'msg-inline warning', textContent: w }));
        }
      }
      list.append(li);
    }
    const ok = questions.filter((q) => !q.error).length;
    $('wsStatus').textContent = questions.length
      ? `${ok} question${ok === 1 ? '' : 's'} ready${problems ? `, ${problems} to look at` : ''}.`
      : 'Type at least one question.';
    $('wsDownload').disabled = ok === 0;
  }

  function data() {
    return {
      title: $('wsTitle').value.trim() || 'Maths worksheet',
      instructions: $('wsInstr').value.trim(),
      lang: lang(),
      questions: questions.filter((q) => !q.error).map(({ prompt, math, answer, solveFor }) => ({ prompt, math, answer, solveFor })),
    };
  }

  async function download() {
    const d = data();
    try {
      const html = await buildWorksheetHTML(d);
      const blob = new Blob([html], { type: 'text/html' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${slug(d.title)}.html` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      const kb = Math.ceil(blob.size / 1024);
      $('wsSize').textContent = `Downloaded ${a.download} (${kb} KB). Share it by WhatsApp, Bluetooth, email or a USB stick: it opens in any browser, with no internet.`;
      announce($('wsSize').textContent);
    } catch (e) {
      $('wsSize').textContent = `Could not build the worksheet: ${e.message}`;
      announce($('wsSize').textContent);
    }
  }

  async function copyText() {
    const d = data();
    const text = worksheetText(d.title, d.instructions, questions, { lang: d.lang });
    try {
      await navigator.clipboard.writeText(text);
      $('wsSize').textContent = 'Copied the questions as plain words. Paste into an SMS, WhatsApp, or a braille display.';
    } catch {
      $('wsSize').textContent = 'Could not copy. Your browser blocked the clipboard.';
    }
    announce($('wsSize').textContent);
  }

  let timer;
  $('wsLines').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(preview, 250); });
  $('wsLangSel').addEventListener('change', preview);
  $('wsDownload').addEventListener('click', download);
  $('wsCopy').addEventListener('click', copyText);
  preview();
}
