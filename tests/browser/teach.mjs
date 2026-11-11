// Browser checks for the Teach tab and the downloaded worksheet file.
export default async function ({ evaluate, press, wait, check, heard }) {
  check('Teach preview lists 4 questions', await evaluate("document.getElementById('wsStatus').textContent"), '4 questions ready.');
  await evaluate("(() => { const t = document.getElementById('wsLines'); t.value += '\\n1/2x answer: 3\\n(x + 1 answer: 2'; t.dispatchEvent(new Event('input')); })()");
  await wait(400);
  check('Teach flags ambiguous and broken lines', await evaluate("document.getElementById('wsStatus').textContent"), '5 questions ready, 2 to look at.');

  const size = await evaluate(`import('./src/worksheet.js').then(async (m) => {
    const html = await m.buildWorksheetHTML({ title: 'Test sheet', instructions: '', lang: 'en',
      questions: [{ prompt: 'Solve for x', math: '3x - 4 = 11', answer: '5', solveFor: 'x' }, { prompt: '', math: 'sqrt(x+1)', answer: '' }] });
    window.__ws = html;
    return new Blob([html]).size;
  })`);
  check(`worksheet file is small (${Math.round(size / 1024)} KB)`, size < 100000, true);
  const hindi = await evaluate(`import('./src/worksheet.js').then(async (m) => {
    const html = await m.buildWorksheetHTML({ title: 'T', instructions: '', lang: 'hi', questions: [{ prompt: '', math: 'x^2', answer: '' }] });
    return [Math.round(new Blob([html]).size / 1024), html.includes('एक्स'), html.includes('भागिले')].join(' ');
  })`);
  check('Hindi worksheet has Hindi but not Marathi, and stays small', hindi, /^\d+ true false$/);

  // Open the worksheet file as its own page, then cut the network: it must still work.
  await evaluate("document.open(); document.write(window.__ws); document.close(); 'ok'");
  await wait(300);
  check('worksheet renders both questions', await evaluate("document.querySelectorAll('article.problem').length"), 2);
  check('worksheet has no external requests', await evaluate("[...document.querySelectorAll('script[src],link[href],img[src]')].length"), 0);
  await evaluate("document.getElementById('wsVoice').checked = false; document.getElementById('wsVoice').dispatchEvent(new Event('change'))");
  await evaluate("(() => { const i = document.getElementById('a0'); i.value = 'x = 5'; i.dispatchEvent(new Event('input')); i.form.requestSubmit(); })()");
  check('worksheet checks answers offline', await heard(), 'Correct!');
  await evaluate("document.querySelectorAll('.visual')[1].focus()");
  await press('ArrowDown');
  check('worksheet explorer works', await heard(), /^inside the root: x plus 1$/);
  const results = await evaluate(`(async () => {
    let copied = '';
    navigator.clipboard.writeText = async (t) => { copied = t; };
    document.getElementById('copyResults').click();
    await new Promise((r) => setTimeout(r, 100));
    return copied;
  })()`);
  check('worksheet: student can copy results for the teacher', results, 'Test sheet\n1 of 1 correct\n\n1. right');
}
