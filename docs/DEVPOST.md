# Devpost submission text (ready to paste)

**Name:** SayMath

**Tagline (short pitch):** Math you can hear: equations read aloud clearly in English, Hindi and Marathi, explorable by keyboard, in braille, from a photo, and in offline worksheets that fit in a WhatsApp message.

**Built with:** javascript, html5, css3, web-speech-api, service-worker, pwa, aria, claude, anthropic-api, nemeth-braille, axe-core, node.js, github-actions, github-pages

**Links:**
- Live demo: https://shineyrbl-byte.github.io/saymath/
- Demo video: https://youtu.be/OQ8i_HQ8HNc
- Source: https://github.com/shineyrbl-byte/saymath

---

## Inspiration
When a blind student gets maths homework as typed text, their screen reader says "left paren x caret 2 plus 3 x right paren slash…". They have to rebuild the fraction in their head from a stream of symbols. Even then, "square root of x plus 1" could mean two different things. Sighted classmates read the same equation at a glance. For students in Hindi- and Marathi-medium schools, every tool also reads the maths in the wrong language. And most homework arrives as a printed sheet or a photo, which a screen reader can't read at all.

## What it does
- **Listen:** type maths and hear it read with clear rules: every fraction, root and bracket says where it ends. A before/after panel plays what a screen reader says for the raw text next to SayMath.
- **Explore:** arrow keys walk the equation: ↓ into the fraction, → to the denominator ("denominator: 2 a"), ↑ back out.
- **Practice:** 18 problems, from equations to calculus. SayMath reads your answer back as you type, then checks it by value (8/2 counts as 4). Answers can be typed or spoken (**Say it**).
- **Teach:** teachers type questions, and SayMath flags ambiguous ones like 1/2x. It then builds a single ~70 KB offline HTML worksheet with speech, explorer and answer checking inside, or a braille (.brf) file for an embosser.
- **Read from a photo:** photograph a printed or handwritten worksheet; Claude turns it into typed maths, flags anything unsure, and SayMath reads it.
- **Braille:** every equation in Nemeth Code braille, to copy or emboss (experimental).
- **Three languages:** English, Hindi and Marathi, for the spoken maths (in each language's word order) and the whole interface.
- **More maths:** sums, integrals, limits, derivatives, matrices, ±, degrees.
- **Offline**, large text, high contrast, large-print printing, shareable links.

## One before-and-after
**Before:** "x equals left paren dash b plus s q r t left paren b caret 2 dash 4 a c right paren right paren slash left paren 2 a right paren"
**After:** "x equals the fraction with numerator negative b plus the square root of b squared minus 4 a c, end root, and denominator 2 a, end fraction". The learner can then press ↓ → to hear "denominator: 2 a".

## How we built it
Plain JavaScript modules with no framework, build step or server. A parser turns typed maths into a tree. A speech engine walks the tree with a language phrasebook (English, Hindi, Marathi). The same tree is turned into Nemeth braille. A renderer draws the equation with one element per part, for the explorer. An evaluator checks answers at several values. For worksheets, a tiny bundler inlines the engine into one HTML file. A service worker makes it work offline. Photo reading calls Claude (claude-opus-5-5) with the learner's own API key, asking for structured JSON in SayMath's typed syntax; every line is then checked by SayMath's own parser before anyone hears it.

## Challenges
- Making speech **unambiguous without being slow**. The rule "say where a group ends unless it holds one symbol" keeps it short. Small tricks remove more end markers: "x to the n-th power" closes itself, and so does "sine squared of x".
- **Hindi word order** puts powers and roots after the base (एक्स का वर्ग), so the phrasebook needed patterns, not word swaps.
- Fitting the whole engine into a worksheet file a phone with no data can open. It came out at about 70 KB, by bundling only the language the teacher picks.
- **Braille level indicators:** Nemeth marks every move up into a power and back down. Getting nested powers right (e^(x²)) meant tidying runs of level changes after the fact.

## Accomplishments
55 unit tests and 61 browser checks run on every push. The browser checks press real keys, open the worksheet with zero network requests, reload the app offline, check a 390px phone, and run an axe-core audit with **0 violations** across all tabs and themes.

## What we learned
Accessibility work is mostly about removing ambiguity. A sighted reader gets grouping for free from layout, so a listener needs it put into words. Testing with automated tools is necessary but not enough: the next step is testing with blind students and Hindi-medium teachers.

## What's next
- Testing with blind and low-vision students, Hindi- and Marathi-medium maths teachers, and a braille transcriber
- Bharati braille for Hindi and Marathi words in braille worksheets
- More languages (Tamil, Bengali), each written with native-speaking teachers
- Reading PDFs directly, not just photos

## Credits and disclosure
Built during the event; no pre-existing work. AI assistance: Claude Code (Anthropic) helped plan, write code and tests, and draft text, and I reviewed and tested everything. Font: Atkinson Hyperlegible (Braille Institute, OFL). axe-core used only in tests. Photo reading uses Claude through the Anthropic TypeScript SDK (MIT), with the user's own key. All problems and examples are made up. No real student data.
