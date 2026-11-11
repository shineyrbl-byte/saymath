// Teach tab: type questions, check them, download an offline worksheet.

import { parse } from './parser.js';
import { speak, explain } from './speak.js';
import { ui } from './i18n.js';
import { render } from './render.js';
import { parseWorksheet, worksheetText, worksheetBraille, buildWorksheetHTML } from './worksheet.js';
import { toBraille, toASCII, textToBraille } from './braille.js';
import { download as save } from './download.js';
import { $, announce, settings } from './ui.js';

const slug = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'worksheet';

export function initTeacher() {
  const lang = () => $('wsLangSel').value;
  const t = () => ui(settings.lang);
  const err = (q) => (q.errorObj ? (q.errorInAnswer ? t().wsAnswerError(explain(q.errorObj, settings.lang)) : explain(q.errorObj, settings.lang)) : q.error);
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
        li.append(Object.assign(document.createElement('p'), { className: 'ws-raw', textContent: t().wsLine(q.line, q.raw) }),
          Object.assign(document.createElement('p'), { className: 'msg-inline error', textContent: err(q) }));
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
          textContent: q.answer ? t().wsAnswer(`${q.solveFor ? `${q.solveFor} = ` : ''}${q.answer}`) : t().wsNoAnswer });
        li.append(ans);
        for (const w of q.warningObjs || []) {
          problems++;
          li.append(Object.assign(document.createElement('p'), { className: 'msg-inline warning', textContent: explain(w, settings.lang) }));
        }
      }
      list.append(li);
    }
    const ok = questions.filter((q) => !q.error).length;
    $('wsStatus').textContent = questions.length
      ? t().wsReady(ok, problems)
      : t().wsEmpty;
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
      $('wsSize').textContent = t().wsDownloaded(a.download, kb);
      announce($('wsSize').textContent);
    } catch (e) {
      $('wsSize').textContent = t().wsBuildFailed(e.message);
      announce($('wsSize').textContent);
    }
  }

  async function copyText() {
    const d = data();
    const text = worksheetText(d.title, d.instructions, questions, { lang: d.lang });
    try {
      await navigator.clipboard.writeText(text);
      $('wsSize').textContent = t().wsCopied;
    } catch {
      $('wsSize').textContent = t().wsCopyFailed;
    }
    announce($('wsSize').textContent);
  }

  function brf() {
    const d = data();
    const name = `${slug(d.title)}.brf`;
    save(name, worksheetBraille(d.title, d.instructions, questions, { toBraille, toASCII, textToBraille }));
    $('wsSize').textContent = t().wsBrfDone(name);
    announce($('wsSize').textContent);
  }

  let timer;
  $('wsLines').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(preview, 250); });
  $('wsLangSel').addEventListener('change', preview);
  document.addEventListener('saymath:settings', preview);
  $('wsDownload').addEventListener('click', download);
  $('wsCopy').addEventListener('click', copyText);
  $('wsBrf').addEventListener('click', brf);
  preview();
}
