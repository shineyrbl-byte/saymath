// Captures the README / Devpost screenshots into docs/screenshots.
//   node tests/browser/smoke.mjs ../../scripts/screenshots.mjs
import { writeFileSync } from 'node:fs';

export default async function ({ evaluate, wait, send, press }) {
  const out = new URL('../docs/screenshots/', import.meta.url);
  const shot = async (name, w = 1100, h = 900) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 500 });
    await wait(400);
    const { result } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(new URL(`${name}.png`, out), Buffer.from(result.data, 'base64'));
    console.log(`saved ${name}.png`);
  };
  const go = async (hash, theme = 'light') => {
    await send('Page.navigate', { url: `http://localhost:8765/?t=${Date.now()}${hash}` });
    await wait(1200);
    await evaluate(`(() => { const t = document.getElementById('theme'); t.value = '${theme}'; t.dispatchEvent(new Event('change')); document.getElementById('voiceOn').checked = false; scrollTo(0, 0); })()`);
  };

  await go('#listen');
  await evaluate("document.querySelector('[data-ex^=\"x = (-b\"]').click()");
  await wait(200);
  await shot('1-listen-before-after', 1100, 1250);

  await evaluate("document.getElementById('visual').focus()");
  await press('ArrowDown'); await press('ArrowRight'); await press('ArrowRight'); await press('ArrowDown'); await press('ArrowRight');
  await evaluate("document.getElementById('result').scrollIntoView()");
  await shot('2-explorer-denominator', 1100, 700);

  await go('#practice');
  await evaluate("(() => { const i = document.getElementById('pAnswer'); i.value = 'x = 5'; i.dispatchEvent(new Event('input')); })()");
  await wait(300);
  await evaluate("document.getElementById('pForm').requestSubmit(); document.getElementById('pHint').click(); document.getElementById('pCount').scrollIntoView()");
  await shot('3-practice-feedback', 1100, 900);

  await go('#practice');
  await evaluate("(() => { const l = document.getElementById('lang'); l.value = 'hi'; l.dispatchEvent(new Event('change')); })()");
  await wait(200);
  await evaluate("document.querySelectorAll('[name=set]')[1].click()");
  await wait(200);
  await evaluate("document.querySelector('.problem').scrollIntoView()");
  await shot('4-practice-hindi', 1100, 700);
  await evaluate("(() => { const l = document.getElementById('lang'); l.value = 'en'; l.dispatchEvent(new Event('change')); })()");

  await go('#teach');
  await shot('5-teach-worksheet', 1100, 1100);

  await go('#listen', 'contrast');
  await evaluate("(() => { const s = document.getElementById('textSize'); s.value = '1.2'; s.dispatchEvent(new Event('change')); })()");
  await shot('6-high-contrast-phone', 390, 844);
  await evaluate("(() => { const s = document.getElementById('textSize'); s.value = '1'; s.dispatchEvent(new Event('change')); const t = document.getElementById('theme'); t.value = 'auto'; t.dispatchEvent(new Event('change')); })()");

  await go('#teach');
  await evaluate(`import('./src/worksheet.js').then(async (m) => {
    const html = await m.buildWorksheetHTML({ title: 'Homework: equations and powers', instructions: 'Listen to each question, explore it with the arrow keys, then type your answer.', lang: 'en',
      questions: [{ prompt: 'Solve for x', math: '(x + 2)/4 = 3', answer: '10', solveFor: 'x' }, { prompt: 'Work out', math: '2^4 + sqrt(9)', answer: '19' }] });
    document.open(); document.write(html); document.close();
  })`);
  await wait(400);
  await evaluate("(() => { document.getElementById('wsVoice').checked = false; document.getElementById('wsVoice').dispatchEvent(new Event('change')); const i = document.getElementById('a0'); i.value = 'x = 10'; i.dispatchEvent(new Event('input')); i.form.requestSubmit(); })()");
  await wait(200);
  await shot('7-offline-worksheet-file', 390, 844);
  await send('Emulation.clearDeviceMetricsOverride');
}
