// Phone width (390px): nothing may stick out sideways on any tab.
export default async function ({ evaluate, wait, check, send }) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  // Every tab in English, plus the longest-worded languages.
  for (const [lang, tab] of [['en', 'listen'], ['en', 'practice'], ['en', 'teach'], ['ta', 'listen'], ['ta', 'teach'], ['bn', 'practice']]) {
    await send('Page.navigate', { url: `http://localhost:8765/?lang=${lang}&t=${Date.now()}#${tab}` });
    await wait(1000);
    const wide = await evaluate(`(() => {
      const w = document.documentElement.clientWidth;
      const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > w + 1 && !e.closest('.visual'));
      return document.documentElement.scrollWidth + 'px; ' + bad.slice(0, 4).map((e) => e.tagName + '.' + e.className + '#' + e.id).join(', ');
    })()`);
    check(`no sideways scroll at 390px on ${tab} (${lang})`, wide, /^390px; $/);
  }
  // The downloaded worksheet file, too.
  await evaluate(`import('./src/worksheet.js').then(async (m) => {
    const html = await m.buildWorksheetHTML({ title: 'T', instructions: '', lang: 'en',
      questions: [{ prompt: 'Solve for x', math: '(x + 2)/4 = 3', answer: '10', solveFor: 'x' }] });
    document.open(); document.write(html); document.close();
  })`);
  await wait(300);
  const ws = await evaluate(`(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('.card, button, input, select')].filter((e) => e.getBoundingClientRect().right > w - 15);
    return bad.map((e) => e.tagName + '.' + e.className).slice(0, 3).join(', ');
  })()`);
  check('worksheet file fits a 390px phone', ws, '');
  await send('Emulation.clearDeviceMetricsOverride');
}
