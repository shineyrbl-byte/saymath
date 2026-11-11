// Extra browser checks for Practice mode (run by smoke.mjs).
export default async function ({ evaluate, press, wait, check, heard }) {
  await evaluate("document.getElementById('tab-listen').focus()");
  await press('ArrowRight');
  check('Right arrow on the tabs opens Practice', await evaluate("!document.getElementById('practice').hidden && document.activeElement.id"), 'tab-practice');

  check('first problem is shown', await evaluate("document.getElementById('pPrompt').textContent + ' ' + document.getElementById('pVisual').getAttribute('aria-label')"),
    /Solve for x\. Math explorer: Solve for x\. 2 x plus 3 equals 11/);

  const type = async (v) => {
    await evaluate(`(() => { const i = document.getElementById('pAnswer'); i.value = ${JSON.stringify(v)}; i.dispatchEvent(new Event('input')); })()`);
    await wait(300);
  };
  await type('x = 5');
  check('answer is read back as you type', await evaluate("document.getElementById('pEcho').textContent"), 'x equals 5');
  await evaluate("document.getElementById('pForm').requestSubmit()");
  check('wrong answer gets kind feedback', await heard(), /^Not quite\. Your answer reads as: x equals 5/);
  await evaluate("document.getElementById('pForm').requestSubmit()");
  check('after two tries, Show the answer appears', await evaluate("!document.getElementById('pShow').hidden"), true);

  await evaluate("document.getElementById('pHint').click()");
  check('hint is spoken', await heard(), /Take 3 from both sides/);

  await type('8/2');
  await evaluate("document.getElementById('pForm').requestSubmit()");
  check('equivalent answer 8/2 is accepted', await heard(), /^Correct! x equals 4/);
  check('focus moves to Next', await evaluate('document.activeElement.id'), 'pNext');

  await evaluate("document.getElementById('pNext').click()");
  check('Next reads the next problem', await heard(), /^Problem 2 of 4\. Solve for x\. 5 x minus 7 equals 3 x plus 9/);

  await evaluate("document.getElementById('lang').value = 'hi'; document.getElementById('lang').dispatchEvent(new Event('change'))");
  await wait(100);
  check('Hindi prompt', await evaluate("document.getElementById('pPrompt').textContent"), 'x का मान ज्ञात कीजिए।');
  check('Hindi interface: tabs, buttons and page language', await evaluate("[document.getElementById('tab-listen').textContent, document.getElementById('pNext').textContent, document.documentElement.lang].join(' | ')"),
    'सुनिए | अगला प्रश्न | hi');
  await evaluate("(() => { const i = document.getElementById('mathIn'); i.value = '(x + 1'; document.getElementById('mathForm').requestSubmit(); })()");
  await wait(100);
  check('Hindi interface: error messages', await evaluate("document.getElementById('mathMsg').textContent"), /कोष्ठक खोला गया, पर बंद नहीं किया गया। \(अक्षर 7 पर\)/);
  await evaluate("(() => { const i = document.getElementById('mathIn'); i.value = '(x^2 + 3x)/(2x - 1) = sqrt(5)'; document.getElementById('mathForm').requestSubmit(); })()");
  await evaluate("document.getElementById('lang').value = 'en'; document.getElementById('lang').dispatchEvent(new Event('change'))");
  check('back to English interface', await evaluate("document.getElementById('tab-listen').textContent + ' ' + document.documentElement.lang"), 'Listen en');
}
