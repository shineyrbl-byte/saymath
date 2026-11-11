// Practice by ear: hear a problem, explore it, type an answer, get it checked.
// The typed answer is read back first, so a learner who can't see the screen
// knows SayMath understood what they meant.

import { parse } from './parser.js';
import { speak, explain } from './speak.js';
import { render } from './render.js';
import { attachExplorer } from './explorer.js';
import { checkAnswer } from './evaluate.js';
import { SETS, PROMPTS } from './problems.js';
import { $, settings, say, mountMath } from './ui.js';

const T = {
  en: {
    count: (i, n) => `Problem ${i} of ${n}`,
    correct: (w) => `Correct! ${w}.`,
    wrong: (w) => `Not quite. Your answer reads as: ${w}. Try again, or ask for a hint.`,
    letters: (v) => `Your answer still has a letter in it. Give a number for ${v}.`,
    notValue: 'Type just the answer, like 4 or x = 4.',
    unreadable: (m) => `I couldn't read that answer. ${m}`,
    empty: 'Type an answer first.',
    answerIs: (w) => `The answer is ${w}.`,
    score: (c, n) => `Correct on the first try: ${c} of ${n}.`,
    done: (c, n) => `Set finished! First-try score: ${c} of ${n}. Pick another set, or start again.`,
    hears: 'SayMath hears:',
    best: (b, n) => `best ${b} of ${n}`,
  },
  hi: {
    count: (i, n) => `प्रश्न ${i}, ${n} में से`,
    correct: (w) => `सही! ${w}।`,
    wrong: (w) => `अभी नहीं। आपका उत्तर: ${w}। फिर से कोशिश कीजिए, या संकेत लीजिए।`,
    letters: (v) => `आपके उत्तर में अभी भी अक्षर है। ${v} के लिए एक संख्या लिखिए।`,
    notValue: 'केवल उत्तर लिखिए, जैसे 4 या x = 4।',
    unreadable: (m) => `मैं यह उत्तर पढ़ नहीं पाया। ${m}`,
    empty: 'पहले उत्तर लिखिए।',
    answerIs: (w) => `उत्तर है ${w}।`,
    score: (c, n) => `पहली कोशिश में सही: ${c}, ${n} में से।`,
    done: (c, n) => `सेट पूरा हुआ! पहली कोशिश में सही: ${c}, ${n} में से।`,
    hears: 'SayMath सुनता है:',
    best: (b, n) => `सबसे अच्छा ${b}, ${n} में से`,
  },
  mr: {
    count: (i, n) => `प्रश्न ${i}, ${n} पैकी`,
    correct: (w) => `बरोबर! ${w}.`,
    wrong: (w) => `अजून नाही. तुमचे उत्तर: ${w}. पुन्हा प्रयत्न करा, किंवा संकेत घ्या.`,
    letters: (v) => `तुमच्या उत्तरात अजून अक्षर आहे. ${v} साठी एक संख्या लिहा.`,
    notValue: 'फक्त उत्तर लिहा, जसे 4 किंवा x = 4.',
    unreadable: (m) => `मला हे उत्तर वाचता आले नाही. ${m}`,
    empty: 'आधी उत्तर लिहा.',
    answerIs: (w) => `उत्तर आहे ${w}.`,
    score: (c, n) => `पहिल्या प्रयत्नात बरोबर: ${n} पैकी ${c}.`,
    done: (c, n) => `संच पूर्ण झाला! पहिल्या प्रयत्नात बरोबर: ${n} पैकी ${c}.`,
    hears: 'SayMath ऐकते:',
    best: (b, n) => `सर्वोत्तम ${n} पैकी ${b}`,
  },
  ta: {
    count: (i, n) => `கேள்வி ${n} இல் ${i}`,
    correct: (w) => `சரி! ${w}.`,
    wrong: (w) => `இன்னும் இல்லை. உங்கள் விடை: ${w}. மீண்டும் முயலுங்கள், அல்லது குறிப்பு கேளுங்கள்.`,
    letters: (v) => `உங்கள் விடையில் இன்னும் எழுத்து உள்ளது. ${v} க்கு ஒரு எண்ணைத் தாருங்கள்.`,
    notValue: 'விடையை மட்டும் எழுதுங்கள், எ.கா. 4 அல்லது x = 4.',
    unreadable: (m) => `இந்த விடையைப் படிக்க முடியவில்லை. ${m}`,
    empty: 'முதலில் விடையை எழுதுங்கள்.',
    answerIs: (w) => `விடை ${w}.`,
    score: (c, n) => `முதல் முயற்சியில் சரி: ${n} இல் ${c}.`,
    done: (c, n) => `தொகுப்பு முடிந்தது! முதல் முயற்சியில் சரி: ${n} இல் ${c}.`,
    hears: 'SayMath கேட்பது:',
    best: (b, n) => `சிறந்தது ${n} இல் ${b}`,
  },
  bn: {
    count: (i, n) => `প্রশ্ন ${n} টির মধ্যে ${i}`,
    correct: (w) => `ঠিক! ${w}।`,
    wrong: (w) => `এখনও হয়নি। আপনার উত্তর: ${w}। আবার চেষ্টা করুন, অথবা সংকেত নিন।`,
    letters: (v) => `আপনার উত্তরে এখনও অক্ষর আছে। ${v} এর জন্য একটি সংখ্যা লিখুন।`,
    notValue: 'শুধু উত্তর লিখুন, যেমন 4 অথবা x = 4।',
    unreadable: (m) => `এই উত্তরটি পড়া গেল না। ${m}`,
    empty: 'আগে উত্তর লিখুন।',
    answerIs: (w) => `উত্তর হলো ${w}।`,
    score: (c, n) => `প্রথম চেষ্টায় ঠিক: ${n} টির মধ্যে ${c}।`,
    done: (c, n) => `সেট শেষ! প্রথম চেষ্টায় ঠিক: ${n} টির মধ্যে ${c}।`,
    hears: 'SayMath শুনছে:',
    best: (b, n) => `সেরা ${n} টির মধ্যে ${b}`,
  },
};

// Best first-try score for each set, remembered on this device only.
const PROGRESS = 'saymath-progress';
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS)) || {}; } catch { return {}; }
}
function saveBest(id, score) {
  const p = loadProgress();
  if (!(id in p) || score > p[id]) p[id] = score;
  try { localStorage.setItem(PROGRESS, JSON.stringify(p)); } catch { /* storage blocked */ }
}

export function initPractice() {
  let set = SETS[0];
  let index = 0;
  let tries = 0;
  let firstTry = 0;
  const solved = new Set();

  const t = () => T[settings.lang] || T.en;
  const words = (src) => speak(parse(src).tree, { lang: settings.lang, mode: settings.mode });
  const problem = () => set.problems[index];
  const promptText = () => {
    const p = problem();
    return (PROMPTS[settings.lang] || PROMPTS.en)[p.kind](p.solveFor);
  };

  // Set picker (radio buttons, so arrow keys work).
  const picker = $('sets');
  function drawPicker() {
    picker.replaceChildren(...SETS.map((s) => {
      const label = document.createElement('label');
      label.className = 'set-choice';
      const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'set', value: s.id, checked: s === set });
      input.addEventListener('change', () => { set = s; reset(); show(true); });
      const best = loadProgress()[s.id];
      label.append(input, ` ${s.title[settings.lang] || s.title.en} (${best === undefined ? s.problems.length : t().best(best, s.problems.length)})`);
      return label;
    }));
  }

  function reset() {
    index = 0;
    firstTry = 0;
    solved.clear();
  }

  function feedback(text, kind) {
    const box = $('pFeedback');
    box.textContent = text;
    box.className = `feedback ${kind || ''}`;
    box.lang = settings.lang;
  }

  function show(speakNow) {
    const p = problem();
    tries = 0;
    $('pCount').textContent = t().count(index + 1, set.problems.length);
    $('pPrompt').textContent = promptText();
    $('pPrompt').lang = settings.lang;
    const tree = parse(p.math).tree;
    const w = words(p.math);
    mountMath($('pVisual'), $('pCrumbs'), render(tree), `${promptText()} ${w}`, attachExplorer);
    $('pVisual').classList.toggle('listen-only', $('listenOnly').checked);
    $('pHintText').hidden = true;
    $('pShow').hidden = true;
    $('pAnswer').value = '';
    $('pEcho').textContent = '…';
    $('pEchoLabel').textContent = t().hears;
    $('pScore').textContent = t().score(firstTry, set.problems.length);
    feedback('');
    if (speakNow) say(`${t().count(index + 1, set.problems.length)}. ${promptText()} ${w}`);
  }

  function echo() {
    const typed = $('pAnswer').value.trim();
    if (!typed) { $('pEcho').textContent = '…'; return ''; }
    try {
      const w = words(typed);
      $('pEcho').textContent = w;
      return w;
    } catch (e) {
      $('pEcho').textContent = explain(e, settings.lang);
      return '';
    }
  }

  function check() {
    const p = problem();
    const typed = $('pAnswer').value.trim();
    if (!typed) { feedback(t().empty, 'bad'); say(t().empty); return; }
    const result = checkAnswer(typed, p.answer, { solveFor: p.solveFor });
    tries++;
    let msg;
    if (result.ok) {
      if (tries === 1 && !solved.has(index)) firstTry++;
      solved.add(index);
      const ans = p.solveFor ? `${p.solveFor} = ${p.answer}` : p.answer;
      msg = t().correct(words(ans));
      feedback(msg, 'good');
      $('pScore').textContent = t().score(firstTry, set.problems.length);
      $('pNext').focus();
    } else {
      msg = {
        wrong: () => t().wrong(echo()),
        'still-has-letters': () => t().letters(p.solveFor),
        'not-a-value': () => t().notValue,
        unreadable: () => t().unreadable(result.error ? explain(result.error, settings.lang) : (result.message || '')),
      }[result.reason]();
      feedback(msg, 'bad');
      if (tries >= 2) $('pShow').hidden = false;
    }
    say(msg);
  }

  function next() {
    if (index < set.problems.length - 1) {
      index++;
      show(true);
    } else {
      const msg = t().done(firstTry, set.problems.length);
      saveBest(set.id, firstTry);
      drawPicker();
      feedback(msg, 'good');
      say(msg);
      reset();
      setTimeout(() => show(false), 0);
    }
  }

  let echoTimer;
  $('pAnswer').addEventListener('input', () => { clearTimeout(echoTimer); echoTimer = setTimeout(echo, 200); });
  $('pForm').addEventListener('submit', (e) => { e.preventDefault(); check(); });
  $('pEchoHear').addEventListener('click', () => { const w = echo(); say(w || t().empty); });
  $('pHear').addEventListener('click', () => say(`${promptText()} ${words(problem().math)}`));
  $('pHint').addEventListener('click', () => {
    // Hints not yet translated are shown and spoken in English.
    const hl = problem().hint[settings.lang] ? settings.lang : 'en';
    const h = problem().hint[hl];
    $('pHintText').textContent = h;
    $('pHintText').lang = hl;
    $('pHintText').hidden = false;
    say(h, hl);
  });
  $('pShow').addEventListener('click', () => {
    const p = problem();
    const msg = t().answerIs(words(p.solveFor ? `${p.solveFor} = ${p.answer}` : p.answer));
    feedback(msg, '');
    say(msg);
  });
  $('pNext').addEventListener('click', next);
  $('listenOnly').addEventListener('change', () => $('pVisual').classList.toggle('listen-only', $('listenOnly').checked));
  document.addEventListener('saymath:settings', () => { drawPicker(); show(false); });

  drawPicker();
  show(false);
}
