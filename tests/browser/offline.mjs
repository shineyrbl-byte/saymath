// Browser checks: settings stick, and the app reloads with the network off.
export default async function ({ evaluate, wait, check, send }) {
  await send('Page.navigate', { url: 'http://localhost:8765/' });
  await wait(1500);
  await evaluate("(() => { const t = document.getElementById('theme'); t.value = 'contrast'; t.dispatchEvent(new Event('change')); const s = document.getElementById('textSize'); s.value = '1.45'; s.dispatchEvent(new Event('change')); })()");
  check('high contrast theme applies', await evaluate('document.documentElement.dataset.theme'), 'contrast');
  check('service worker is ready', await evaluate("navigator.serviceWorker.ready.then(() => document.getElementById('offlineNote').textContent)"), 'Saved for offline use.');
  await wait(500);

  await send('Network.enable');
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Page.reload', { ignoreCache: false });
  await wait(2000);
  check('reloads with no internet', await evaluate("document.getElementById('spoken').textContent"), /the fraction with numerator/);
  check('settings remembered after reload', await evaluate("document.documentElement.dataset.theme + ' ' + document.documentElement.style.getPropertyValue('--scale')"), 'contrast 1.45');
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
}
