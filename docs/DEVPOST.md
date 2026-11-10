# Devpost submission text (ready to paste)

**Name:** SayMath

**Tagline (short pitch):** Math you can hear: typed equations read aloud clearly in English and Hindi, explorable by keyboard, with offline worksheets that fit in a WhatsApp message.

**Built with:** javascript, html5, css3, web-speech-api, service-worker, pwa, aria, axe-core, github-actions, github-pages

**Links:**
- Live demo: https://shineyrbl-byte.github.io/saymath/
- Source: https://github.com/shineyrbl-byte/saymath

---

## Inspiration
When a blind student gets maths homework as typed text, their screen reader says "left paren x caret 2 plus 3 x right paren slash…". They have to rebuild the fraction in their head from a stream of symbols. Even then, "square root of x plus 1" could mean two different things. Sighted classmates read the same equation at a glance. For students in Hindi-medium schools, every tool also reads the maths in the wrong language.

## What it does
- **Listen:** type maths and hear it read with clear rules: every fraction, root and bracket says where it ends. A before/after panel plays what a screen reader says for the raw text next to SayMath.
- **Explore:** arrow keys walk the equation: ↓ into the fraction, → to the denominator ("denominator: 2 a"), ↑ back out.
- **Practice:** 13 problems. SayMath reads your answer back as you type, then checks it by value (8/2 counts as 4). Hints in English and Hindi.
- **Teach:** teachers type questions, and SayMath flags ambiguous ones like 1/2x. It then builds a single 53 KB offline HTML worksheet with speech, explorer and answer checking inside.
- **Hindi**, **offline**, large text, and a high-contrast theme.

## One before-and-after
**Before:** "x equals left paren dash b plus s q r t left paren b caret 2 dash 4 a c right paren right paren slash left paren 2 a right paren"
**After:** "x equals the fraction with numerator negative b plus the square root of b squared minus 4 a c, end root, and denominator 2 a, end fraction". The learner can then press ↓ → to hear "denominator: 2 a".

## How we built it
Plain JavaScript modules with no framework, build step, server or API keys. A parser turns typed maths into a tree. A speech engine walks the tree with a language phrasebook (English and Hindi). A renderer draws the equation with one element per part, for the explorer. An evaluator checks answers at several values. For worksheets, a tiny bundler inlines the engine into one HTML file. A service worker makes it work offline.

## Challenges
- Making speech **unambiguous without being slow**. The rule "say where a group ends unless it holds one symbol" keeps it short. Small tricks remove more end markers: "x to the n-th power" closes itself, and so does "sine squared of x".
- **Hindi word order** puts powers and roots after the base (एक्स का वर्ग), so the phrasebook needed patterns, not word swaps.
- Fitting the whole engine into a worksheet file a phone with no data can open. It came out at 53 KB.

## Accomplishments
27 unit tests and 46 browser checks run on every push. The browser checks press real keys, open the worksheet with zero network requests, reload the app offline, check a 390px phone, and run an axe-core audit with **0 violations** across all tabs and themes.

## What we learned
Accessibility work is mostly about removing ambiguity. A sighted reader gets grouping for free from layout, so a listener needs it put into words. Testing with automated tools is necessary but not enough: the next step is testing with blind students and Hindi-medium teachers.

## What's next
- Testing with blind and low-vision students and Hindi-medium maths teachers
- Reading equations from photos of worksheets
- Bharati braille maths output
- More languages (Marathi, Tamil, Bengali)

## Credits and disclosure
Built during the event; no pre-existing work. AI assistance: Claude Code (Anthropic) helped plan, write code and tests, and draft text, and I reviewed and tested everything. Font: Atkinson Hyperlegible (Braille Institute, OFL). axe-core used only in tests. All problems and examples are made up. No real student data.
