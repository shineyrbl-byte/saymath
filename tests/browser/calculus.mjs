// Browser checks: calculus and matrices can be explored with the arrow keys.
export default async function ({ evaluate, press, wait, check, heard }) {
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
}
