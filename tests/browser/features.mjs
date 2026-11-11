// Browser checks for newer features: calculus and matrix exploring, braille, photo panel, shared links.
export default async function ({ evaluate, press, wait, check, heard, send }) {
  await evaluate("document.getElementById('tab-listen').click()");
  await evaluate("document.querySelector('[data-ex^=\"int(\"]').click()");
  await wait(150);
  check('integral example is read', await heard(), 'the integral from 0 to 1 of x squared, d x, equals one third');
  await evaluate("document.getElementById('visual').focus()");
  await press('ArrowDown'); await press('ArrowDown');
  check('explorer: lower limit of the integral', await heard(), 'lower limit: 0');
  await press('ArrowRight'); await press('ArrowRight');
  check('explorer: integrand', await heard(), 'integrand: x squared');

  await evaluate("document.querySelector('[data-ex^=\"det(\"]').click()");
  await wait(150);
  await evaluate("document.getElementById('visual').focus()");
  await press('ArrowDown'); await press('ArrowDown'); await press('ArrowDown'); await press('ArrowDown');
  check('explorer: matrix row then entry', await heard(), 'entry 1 of 2: a');
  await press('ArrowUp'); await press('ArrowRight');
  check('explorer: second row', await heard(), 'row 2 of 2: c, d');

  await evaluate("document.querySelector('[data-ex^=\"x = (-b\"]').click()");
  await wait(150);
  check('braille panel shows Nemeth for the quadratic formula', await evaluate("document.getElementById('brailleOut').textContent"), '⠭⠀⠨⠅⠀⠹⠤⠃⠬⠜⠃⠘⠆⠐⠤⠲⠁⠉⠻⠌⠆⠁⠼');

  await evaluate("(() => { document.getElementById('photoBox').open = true; document.getElementById('photoRead').click(); })()");
  await wait(100);
  check('photo panel asks for a photo first', await evaluate("document.getElementById('photoStatus').textContent"), 'Choose a photo first.');
  check('photo panel explains privacy', await evaluate("document.querySelector('.photo-privacy').textContent"), /sent from your device to Anthropic/);

  await evaluate("(() => { window.__buzz = 0; navigator.vibrate = () => { window.__buzz++; return true; }; document.querySelector('[data-ex^=\"a^2\"]').click(); document.getElementById('visual').focus(); })()");
  await press('ArrowLeft');
  check('edge of the equation: a buzz and a message', await evaluate('window.__buzz') + ' ' + await heard(), '1 No more parts to the left.');
  await evaluate("(() => { const c = document.getElementById('spacing'); c.checked = true; c.dispatchEvent(new Event('change')); })()");
  check('extra spacing setting', await evaluate("document.documentElement.classList.contains('spaced')"), true);
  await evaluate("(() => { const c = document.getElementById('spacing'); c.checked = false; c.dispatchEvent(new Event('change')); })()");
  const hl = await evaluate(`(() => {
    document.getElementById('voiceOn').checked = true;
    speechSynthesis.speak = (u) => { u.onboundary({ charIndex: 0 }); window.__hl = [...document.querySelectorAll('.reading')].map((e) => e.textContent).join(' | '); u.onend(); };
    document.querySelector('[data-ex^="a^2"]').click();
    document.getElementById('voiceOn').checked = false;
    return window.__hl + ' / left after: ' + document.querySelectorAll('.reading').length;
  })()`);
  check('read-along highlights the part being spoken, in the equation and the words', hl, /^a2\+b2 \| a squared plus b squared \/ left after: 0$/);
  await send('Page.navigate', { url: `http://localhost:8765/?m=${encodeURIComponent('a^2 + b^2 = c^2')}&lang=hi&t=${Date.now()}#listen` });
  await wait(1200);
  check('a shared link opens that maths in that language', await evaluate("document.getElementById('spoken').textContent"), 'ए का वर्ग प्लस बी का वर्ग बराबर सी का वर्ग');
  await evaluate("(() => { const l = document.getElementById('lang'); l.value = 'en'; l.dispatchEvent(new Event('change')); })()");
}
