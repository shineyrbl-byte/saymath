/* global DATA, M_parser, M_speak, M_render, M_explorer, M_evaluate, M_lang_en, M_lang_hi, M_lang_mr, M_lang_ta, M_lang_bn, M_cues */
// Runs inside a downloaded worksheet file. Not a module: it is inlined
// after the bundled engine, which defines the M_* objects.
(() => {
  const { parse } = M_parser;
  const { speak, explain } = M_speak;
  const { render } = M_render;
  const { attachExplorer } = M_explorer;
  const { checkAnswer } = M_evaluate;
  // Only English and the teacher's chosen language are inside the file.
  const PHRASES = Object.fromEntries(Object.entries({ en: M_lang_en.EN, hi: M_lang_hi.HI, mr: M_lang_mr.MR, ta: M_lang_ta.TA, bn: M_lang_bn.BN }).filter(([, v]) => v));

  const T = {
    en: { question: (i, n) => `Question ${i} of ${n}`, hear: 'Hear it', yours: 'Your answer', check: 'Check',
      hears: 'SayMath hears:', correct: 'Correct!', wrong: (w) => `Not yet. Your answer reads as: ${w}.`,
      letters: 'Your answer still has a letter in it. Give a number.', empty: 'Type an answer first.',
      bad: (m) => `I couldn't read that. ${m}`, score: (c, n) => `${c} of ${n} correct`, voice: 'Speak aloud',
      hint: 'Hint', copy: 'Copy my results (to send to my teacher)', copied: 'Results copied. Paste them into WhatsApp, SMS or email.', right: 'right', wrong: 'not yet', notTried: 'not tried',
      lang: 'Language', offline: 'This worksheet works offline. Made with SayMath.' },
    hi: { question: (i, n) => `प्रश्न ${i}, ${n} में से`, hear: 'सुनिए', yours: 'आपका उत्तर', check: 'जाँचिए',
      hears: 'SayMath सुनता है:', correct: 'सही!', wrong: (w) => `अभी नहीं। आपका उत्तर: ${w}।`,
      letters: 'आपके उत्तर में अभी भी अक्षर है। एक संख्या लिखिए।', empty: 'पहले उत्तर लिखिए।',
      bad: (m) => `मैं यह पढ़ नहीं पाया। ${m}`, score: (c, n) => `${n} में से ${c} सही`, voice: 'आवाज़ में सुनें',
      hint: 'संकेत', copy: 'मेरे परिणाम कॉपी कीजिए (शिक्षक को भेजने के लिए)', copied: 'परिणाम कॉपी हो गए। WhatsApp, SMS या ईमेल में पेस्ट कीजिए।', right: 'सही', wrong: 'अभी नहीं', notTried: 'नहीं किया',
      lang: 'भाषा', offline: 'यह वर्कशीट बिना इंटरनेट के चलती है। SayMath से बनी।' },
    mr: { question: (i, n) => `प्रश्न ${i}, ${n} पैकी`, hear: 'ऐका', yours: 'तुमचे उत्तर', check: 'तपासा',
      hears: 'SayMath ऐकते:', correct: 'बरोबर!', wrong: (w) => `अजून नाही. तुमचे उत्तर: ${w}.`,
      letters: 'तुमच्या उत्तरात अजून अक्षर आहे. एक संख्या लिहा.', empty: 'आधी उत्तर लिहा.',
      bad: (m) => `मला हे वाचता आले नाही. ${m}`, score: (c, n) => `${n} पैकी ${c} बरोबर`, voice: 'आवाजात ऐका',
      hint: 'संकेत', copy: 'माझे निकाल कॉपी करा (शिक्षकांना पाठवण्यासाठी)', copied: 'निकाल कॉपी झाले. WhatsApp, SMS किंवा ईमेलमध्ये पेस्ट करा.', right: 'बरोबर', wrong: 'अजून नाही', notTried: 'केले नाही',
      lang: 'भाषा', offline: 'ही वर्कशीट इंटरनेटशिवाय चालते. SayMath ने बनवली.' },
    ta: { question: (i, n) => `கேள்வி ${n} இல் ${i}`, hear: 'கேளுங்கள்', yours: 'உங்கள் விடை', check: 'சரிபார்',
      hears: 'SayMath கேட்பது:', correct: 'சரி!', wrong: (w) => `இன்னும் இல்லை. உங்கள் விடை: ${w}.`,
      letters: 'உங்கள் விடையில் இன்னும் எழுத்து உள்ளது. ஒரு எண்ணைத் தாருங்கள்.', empty: 'முதலில் விடையை எழுதுங்கள்.',
      bad: (m) => `இதைப் படிக்க முடியவில்லை. ${m}`, score: (c, n) => `${n} இல் ${c} சரி`, voice: 'குரலில் கேளுங்கள்',
      hint: 'குறிப்பு', copy: 'என் முடிவுகளை நகலெடு (ஆசிரியருக்கு அனுப்ப)', copied: 'முடிவுகள் நகலெடுக்கப்பட்டன. WhatsApp, SMS அல்லது மின்னஞ்சலில் ஒட்டுங்கள்.', right: 'சரி', wrong: 'இன்னும் இல்லை', notTried: 'முயலவில்லை',
      lang: 'மொழி', offline: 'இந்தப் பணித்தாள் இணையமில்லாமல் இயங்கும். SayMath ஆல் உருவாக்கப்பட்டது.' },
    bn: { question: (i, n) => `প্রশ্ন ${n}টির মধ্যে ${i}`, hear: 'শুনুন', yours: 'আপনার উত্তর', check: 'যাচাই করুন',
      hears: 'SayMath শুনছে:', correct: 'ঠিক!', wrong: (w) => `এখনও হয়নি। আপনার উত্তর: ${w}।`,
      letters: 'আপনার উত্তরে এখনও অক্ষর আছে। একটি সংখ্যা লিখুন।', empty: 'আগে উত্তর লিখুন।',
      bad: (m) => `এটি পড়া গেল না। ${m}`, score: (c, n) => `${n}টির মধ্যে ${c}টি ঠিক`, voice: 'কণ্ঠে শুনুন',
      hint: 'সংকেত', copy: 'আমার ফলাফল কপি করুন (শিক্ষককে পাঠাতে)', copied: 'ফলাফল কপি হয়েছে। WhatsApp, SMS বা ইমেলে পেস্ট করুন।', right: 'ঠিক', wrong: 'এখনও হয়নি', notTried: 'চেষ্টা হয়নি',
      lang: 'ভাষা', offline: 'এই ওয়ার্কশিট ইন্টারনেট ছাড়াই চলে। SayMath দিয়ে তৈরি।' },
  };

  let lang = DATA.lang in PHRASES ? DATA.lang : 'en';
  let voiceOn = true;
  const done = new Set();
  const tried = new Set();
  const opts = () => ({ lang, mode: 'clear' });
  const words = (src) => speak(parse(src).tree, opts());

  function announce(text) {
    const a = document.getElementById('announcer');
    a.textContent = '';
    setTimeout(() => { a.textContent = text; }, 30);
  }
  function say(text) {
    announce(text);
    if (!voiceOn || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = PHRASES[lang].speechLang;
    const voices = speechSynthesis.getVoices();
    const fb = PHRASES[lang].fallbackSpeechLang;
    const v = voices.find((x) => x.lang.startsWith(lang)) || (fb && voices.find((x) => x.lang.startsWith(fb.slice(0, 2))));
    if (v) u.voice = v;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }
  const h = (tag, props = {}, ...kids) => {
    const e = Object.assign(document.createElement(tag), props);
    e.append(...kids);
    return e;
  };

  function build() {
    const t = T[lang] || T.en;
    const main = document.getElementById('main');
    document.documentElement.lang = lang;
    const qs = DATA.questions;
    const score = h('p', { className: 'score', id: 'score' });
    const updateScore = () => { score.textContent = t.score(done.size, qs.filter((q) => q.answer).length); };

    const langSel = h('select', { id: 'wsLang' },
      ...Object.keys(PHRASES).map((code) => h('option', { value: code, textContent: PHRASES[code].name, selected: lang === code })));
    langSel.addEventListener('change', () => { lang = langSel.value; build(); });
    const voice = h('input', { type: 'checkbox', checked: voiceOn, id: 'wsVoice' });
    voice.addEventListener('change', () => { voiceOn = voice.checked; });

    main.replaceChildren(
      h('h1', { textContent: DATA.title }),
      DATA.instructions ? h('p', { className: 'lead', textContent: DATA.instructions }) : '',
      h('div', { className: 'row ws-controls' },
        h('label', {}, `${t.lang} `, langSel),
        h('label', { className: 'check' }, voice, ` ${t.voice}`)),
      h('p', { className: 'hint', textContent: PHRASES[lang].keyHelp }),
    );

    qs.forEach((q, i) => {
      const tree = parse(q.math).tree;
      const spoken = `${q.prompt ? `${q.prompt}. ` : ''}${words(q.math)}`;
      const box = h('div', { className: 'visual', tabIndex: 0 });
      box.setAttribute('role', 'application');
      box.setAttribute('aria-roledescription', PHRASES[lang].explorer);
      box.setAttribute('aria-label', spoken);
      const crumbs = h('span');
      const rendered = render(tree);
      rendered.root.setAttribute('aria-hidden', 'true');
      box.append(rendered.root);
      attachExplorer(box, rendered, { onSay: say, getOpts: opts, crumbs, lang: () => PHRASES[lang], onCue: M_cues.cue });

      const card = h('article', { className: 'card problem' },
        h('h2', { className: 'label', textContent: t.question(i + 1, qs.length) }),
        q.prompt ? h('p', { className: 'prompt', textContent: q.prompt }) : '',
        box,
        h('p', { className: 'crumbs', ariaHidden: 'true' }, crumbs));
      const hear = h('button', { type: 'button', textContent: t.hear });
      hear.addEventListener('click', () => say(spoken));
      const buttons = h('div', { className: 'row' }, hear);
      if (q.hint) {
        // The teacher's own hint, shown and spoken when asked for.
        const hintText = h('p', { className: 'hint-box', textContent: q.hint, hidden: true });
        const hintBtn = h('button', { type: 'button', textContent: t.hint });
        hintBtn.addEventListener('click', () => { hintText.hidden = false; say(q.hint); });
        buttons.append(hintBtn);
        card.append(buttons, hintText);
      } else card.append(buttons);

      if (q.answer) {
        const id = `a${i}`;
        const input = h('input', { type: 'text', id, spellcheck: false, autocomplete: 'off' });
        const echo = h('span', { textContent: '…' });
        const echoLine = h('p', { className: 'echo', id: `${id}e` }, h('span', { className: 'label-inline', textContent: `${t.hears} ` }), echo);
        input.setAttribute('aria-describedby', echoLine.id);
        const fb = h('div', { className: 'feedback' });
        fb.setAttribute('role', 'status');
        input.addEventListener('input', () => {
          try { echo.textContent = input.value.trim() ? words(input.value) : '…'; } catch (e) { echo.textContent = explain(e, lang); }
        });
        const form = h('form', { className: 'answer' },
          h('label', { htmlFor: id, className: 'big-label', textContent: t.yours }),
          h('div', { className: 'field' }, input, h('button', { type: 'submit', className: 'primary', textContent: t.check })),
          echoLine);
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!input.value.trim()) { fb.textContent = t.empty; fb.className = 'feedback bad'; say(t.empty); return; }
          const r = checkAnswer(input.value, q.answer, { solveFor: q.solveFor });
          tried.add(i);
          M_cues.cue(r.ok ? 'right' : 'wrong');
          let msg;
          if (r.ok) { msg = t.correct; done.add(i); fb.className = 'feedback good'; } else {
            fb.className = 'feedback bad';
            msg = r.reason === 'wrong' ? t.wrong(words(input.value))
              : r.reason === 'still-has-letters' ? t.letters : t.bad(r.error ? explain(r.error, lang) : (r.message || ''));
          }
          fb.textContent = msg;
          updateScore();
          say(msg);
        });
        card.append(form, fb);
      }
      main.append(card);
    });
    // Results a student can send to their teacher: no server needed.
    const results = h('button', { type: 'button', textContent: t.copy, id: 'copyResults' });
    results.addEventListener('click', async () => {
      const lines = [DATA.title, t.score(done.size, qs.filter((q) => q.answer).length), ''];
      qs.forEach((q, i) => { if (q.answer) lines.push(`${i + 1}. ${done.has(i) ? t.right : tried.has(i) ? t.wrong : t.notTried}`); });
      const text = lines.join('\n');
      try { await navigator.clipboard.writeText(text); say(t.copied); } catch {
        const box = h('textarea', { value: text, rows: lines.length, readOnly: true });
        results.after(box);
        box.select();
      }
    });
    main.append(score, h('div', { className: 'row' }, results), h('p', { className: 'hint', textContent: t.offline }));
    updateScore();
  }

  build();
})();
