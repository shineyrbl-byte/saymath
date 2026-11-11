/* global DATA, M_parser, M_speak, M_render, M_explorer, M_evaluate, M_lang_en, M_lang_hi */
// Runs inside a downloaded worksheet file. Not a module: it is inlined
// after the bundled engine, which defines the M_* objects.
(() => {
  const { parse } = M_parser;
  const { speak, explain } = M_speak;
  const { render } = M_render;
  const { attachExplorer } = M_explorer;
  const { checkAnswer } = M_evaluate;
  const PHRASES = { en: M_lang_en.EN, hi: M_lang_hi.HI };

  const T = {
    en: { question: (i, n) => `Question ${i} of ${n}`, hear: 'Hear it', yours: 'Your answer', check: 'Check',
      hears: 'SayMath hears:', correct: 'Correct!', wrong: (w) => `Not yet. Your answer reads as: ${w}.`,
      letters: 'Your answer still has a letter in it. Give a number.', empty: 'Type an answer first.',
      bad: (m) => `I couldn't read that. ${m}`, score: (c, n) => `${c} of ${n} correct`, voice: 'Speak aloud',
      lang: 'Language', offline: 'This worksheet works offline. Made with SayMath.' },
    hi: { question: (i, n) => `प्रश्न ${i}, ${n} में से`, hear: 'सुनिए', yours: 'आपका उत्तर', check: 'जाँचिए',
      hears: 'SayMath सुनता है:', correct: 'सही!', wrong: (w) => `अभी नहीं। आपका उत्तर: ${w}।`,
      letters: 'आपके उत्तर में अभी भी अक्षर है। एक संख्या लिखिए।', empty: 'पहले उत्तर लिखिए।',
      bad: (m) => `मैं यह पढ़ नहीं पाया। ${m}`, score: (c, n) => `${n} में से ${c} सही`, voice: 'आवाज़ में सुनें',
      lang: 'भाषा', offline: 'यह वर्कशीट बिना इंटरनेट के चलती है। SayMath से बनी।' },
  };

  let lang = DATA.lang in T ? DATA.lang : 'en';
  let voiceOn = true;
  const done = new Set();
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
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang));
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
    const t = T[lang];
    const main = document.getElementById('main');
    document.documentElement.lang = lang;
    const qs = DATA.questions;
    const score = h('p', { className: 'score', id: 'score' });
    const updateScore = () => { score.textContent = t.score(done.size, qs.filter((q) => q.answer).length); };

    const langSel = h('select', { id: 'wsLang' },
      h('option', { value: 'en', textContent: 'English', selected: lang === 'en' }),
      h('option', { value: 'hi', textContent: 'हिन्दी', selected: lang === 'hi' }));
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
      attachExplorer(box, rendered, { onSay: say, getOpts: opts, crumbs, lang: () => PHRASES[lang] });

      const card = h('article', { className: 'card problem' },
        h('h2', { className: 'label', textContent: t.question(i + 1, qs.length) }),
        q.prompt ? h('p', { className: 'prompt', textContent: q.prompt }) : '',
        box,
        h('p', { className: 'crumbs', ariaHidden: 'true' }, crumbs));
      const hear = h('button', { type: 'button', textContent: t.hear });
      hear.addEventListener('click', () => say(spoken));
      card.append(h('div', { className: 'row' }, hear));

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
    main.append(score, h('p', { className: 'hint', textContent: t.offline }));
    updateScore();
  }

  build();
})();
