// Phone width (390px): nothing may stick out sideways on any tab.
export default async function ({ evaluate, wait, check, send }) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const tab of ['listen', 'practice', 'teach']) {
    await send('Page.navigate', { url: `http://localhost:8765/#${tab}` });
    await wait(1000);
    const wide = await evaluate(`(() => {
      const w = document.documentElement.clientWidth;
      const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > w + 1 && !e.closest('.visual'));
      return document.documentElement.scrollWidth + 'px; ' + bad.slice(0, 4).map((e) => e.tagName + '.' + e.className + '#' + e.id).join(', ');
    })()`);
    check(`no sideways scroll at 390px on ${tab}`, wide, /^390px; $/);
  }
  await send('Emulation.clearDeviceMetricsOverride');
}
