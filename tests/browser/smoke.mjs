// Browser smoke test: drives headless Chrome with real key presses and
// checks what SayMath announces. No dependencies (uses the DevTools protocol).
//   node tests/browser/smoke.mjs  (expects the site at http://localhost:8765)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SITE = process.env.URL || 'http://localhost:8765/';
const port = 9333;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sm-'))}`, ...(process.env.CI ? ['--no-sandbox'] : []), 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let ws; let id = 0; const pending = new Map();
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://localhost:${port}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener('open', r));
      ws.addEventListener('message', (m) => {
        const d = JSON.parse(m.data);
        if (pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      });
      return;
    } catch { await wait(100); }
  }
  throw new Error('Chrome did not start');
}
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.result.value;
const KEYS = { ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Home: 36, Enter: 13, ' ': 32, Tab: 9 };
async function press(key) {
  await evaluate("document.getElementById('announcer').textContent = ''");
  const code = KEYS[key];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: code, code: key === ' ' ? 'Space' : key });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: code, code: key === ' ' ? 'Space' : key });
  await wait(80);
}
// Waits until the live region has text that stops changing.
async function heard() {
  let last = null;
  for (let i = 0; i < 40; i++) {
    const now = await evaluate("document.getElementById('announcer').textContent");
    if (now && now === last) return now;
    last = now;
    await wait(40);
  }
  return last;
}
async function until(expr) {
  for (let i = 0; i < 100; i++) { if (await evaluate(expr)) return; await wait(50); }
  throw new Error(`Timed out waiting for: ${expr}`);
}

let failures = 0;
function check(name, actual, expected) {
  const ok = expected instanceof RegExp ? expected.test(actual) : actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got: ${actual}`}`);
  if (!ok) failures++;
}

export const steps = [];
try {
  await connect();
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: SITE });
  await until("document.getElementById('result') && !document.getElementById('result').hidden");
  await evaluate("document.getElementById('voiceOn').checked = false");

  await evaluate("document.getElementById('mathIn').value = '(x+1)/(x-1) = 2'; document.getElementById('mathForm').requestSubmit()");
  await wait(150);
  check('reads the whole equation', await heard(), /fraction with numerator x plus 1, and denominator x minus 1, end fraction, equals 2/);

  await evaluate("document.getElementById('visual').focus()");
  await press('ArrowDown');
  check('Down goes to the first side', await heard(), /^side 1 of 2: the fraction/);
  await press('ArrowDown');
  check('Down again goes to the numerator', await heard(), /^numerator: x plus 1$/);
  await press('ArrowRight');
  check('Right goes to the denominator', await heard(), /^denominator: x minus 1$/);
  await press('ArrowRight');
  check('Right at the end says so', await heard(), /No more parts to the right/);
  await press('ArrowDown'); await press('ArrowRight');
  check('can reach a single term', await heard(), /^term 2 of 2: 1$/);
  await press('ArrowUp'); await press('ArrowUp'); await press('ArrowRight');
  check('Up twice then Right reaches the other side', await heard(), /^side 2 of 2: 2$/);
  check('breadcrumb shows where you are', await evaluate("document.getElementById('crumbs').textContent"), 'whole expression › side');
  await press('Home');
  check('Home goes back to the whole thing', await heard(), /^the fraction/);

  await evaluate("document.getElementById('mathIn').value = '(x+1'; document.getElementById('mathForm').requestSubmit()");
  await wait(100);
  check('errors are explained', await evaluate("document.getElementById('mathMsg').textContent"), /never closed/);

  await evaluate("document.getElementById('mathIn').value = '1/2x'; document.getElementById('mathForm').requestSubmit()");
  await wait(100);
  check('ambiguity is flagged', await evaluate("document.getElementById('mathMsg').textContent"), /could mean two things/);

  // Keyboard only: Tab from the input reaches the Hear it button.
  await evaluate("document.getElementById('mathIn').focus()");
  await press('Tab');
  check('Tab order: input then Hear it', await evaluate('document.activeElement.textContent'), 'Hear it');

  for (const extra of process.argv.slice(2)) {
    await import(new URL(extra, import.meta.url)).then((m) => m.default({ evaluate, press, wait, check, heard, send }));
  }
} catch (e) {
  console.error(e); failures++;
} finally {
  ws?.close(); chrome.kill();
}
console.log(failures ? `\n${failures} failed` : '\nAll browser checks passed');
process.exit(failures ? 1 : 0);
