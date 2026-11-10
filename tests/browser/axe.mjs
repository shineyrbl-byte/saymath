// Accessibility audit with axe-core on every tab, in every colour theme.
// Needs internet once to load axe-core from cdnjs.
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

export default async function ({ evaluate, wait, check, send }) {
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  for (const theme of ['light', 'dark', 'contrast']) {
    for (const tab of ['listen', 'practice', 'teach']) {
      await send('Page.navigate', { url: `http://localhost:8765/?t=${Date.now()}#${tab}` });
      await wait(1200);
      const result = await evaluate(`(async () => {
        const t = document.getElementById('theme'); t.value = '${theme}'; t.dispatchEvent(new Event('change'));
        document.querySelector('.settings').open = true;
        if (!window.axe) await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = '${AXE}'; s.onload = ok; s.onerror = bad; document.head.append(s); });
        const r = await axe.run(document, { resultTypes: ['violations'] });
        return r.violations.map((v) => v.id + ' (' + v.nodes.length + '): ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', '));
      })()`);
      check(`axe: no violations on ${tab}, ${theme} theme`, Array.isArray(result) ? result.join(' | ') : `did not run: ${JSON.stringify(result)}`, '');
    }
  }
}
