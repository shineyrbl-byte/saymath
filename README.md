# SayMath

**Math you can hear.** SayMath turns typed equations into clear, unambiguous speech in English, Hindi and Marathi, from school algebra to calculus and matrices. Learners can explore an equation piece by piece with the arrow keys, practise by ear (typing or speaking their answers), and get Nemeth braille. Teachers can make offline worksheets that fit in a WhatsApp message, or a braille file for an embosser, and can even start from a photo of a printed worksheet.

**Live demo:** https://shineyrbl-byte.github.io/saymath/ (no sign-up, no install, works offline after the first visit)

**Demo video (2.5 min, captioned):** https://youtu.be/OQ8i_HQ8HNc · transcript: [docs/DEMO.md](docs/DEMO.md)

Built for **AccessED Hacks** (October 17 – November 20, 2026). Everything in this repository was written during the event: there is no pre-existing foundation.

![SayMath reading the quadratic formula, with the before/after comparison](docs/screenshots/1-listen-before-after.png)

## The barrier

A blind or low-vision student gets maths homework as a PDF, a WhatsApp message or a web page. The equation is either an image (silent to a screen reader) or typed text like `x = (-b + sqrt(b^2 - 4ac))/(2a)`. A screen reader reads that typed text symbol by symbol:

> **Before:** "x equals left paren dash b plus s q r t left paren b caret 2 dash 4 a c right paren right paren slash left paren 2 a right paren"

To understand it, the student has to hold every bracket in their head and rebuild the fraction from the symbols. Sighted classmates see it in one glance. Worse, the same words can mean different things: "square root of x plus 1" could be √x + 1 or √(x + 1).

> **After (SayMath):** "x equals the fraction with numerator negative b plus the square root of b squared minus 4 a c, end root, and denominator 2 a, end fraction"

And then they can explore it: press ↓ to go into the fraction, → to jump to the denominator ("denominator: 2 a"), ↑ to come back out.

The same barrier is doubled for students in Hindi-medium schools, where maths is taught and spoken in Hindi but every tool reads it in English.

### Who it's for

- **Blind and low-vision students** who use screen readers or listen to text, from middle school to early college maths
- **Students with dyslexia** or reading difficulties who understand maths better by hearing it, with highlighting
- **Hindi- and Marathi-medium learners**, who can hear the same maths in their own language's word order, with the whole interface in that language
- **Braille readers**, who can copy Nemeth braille or print it on an embosser
- **Learners who find typing hard**, who can say their answers out loud
- **Teachers** (especially in schools with no specialist support) who need to send accessible maths to one student without special software

*Example learner (made-up, a composite):* Meera is in Class 9 at a Hindi-medium school. She is blind and uses a screen reader on a shared family laptop and an old Android phone with patchy data. Her teacher sends algebra homework on WhatsApp. Today she asks her brother to read it out. With SayMath, her teacher sends one 70 KB file. Meera opens it with no data, hears each question in Hindi, explores the fraction with the arrow keys, types her answer and hears "सही!" (correct).

## What it does

| | |
|---|---|
| **Listen** | Type or paste math. SayMath shows it as a real equation and reads it aloud with clear rules (below). A side-by-side *before/after* shows what a screen reader says for the raw text. |
| **Explore** | Arrow keys walk the equation like a tree: ↓ into a part, ↑ back out, ← → between parts, Home for the whole thing, Space to repeat. Each step says its role ("numerator", "term 2 of 3"). Sighted users see the part highlighted and a breadcrumb ("whole expression › side › denominator"). |
| **Practice** | 18 practice problems in 4 sets (equations; fractions, powers and roots; simplifying; calculus and matrices). Hear the problem, explore it, type an answer. **SayMath reads your answer back as you type** ("SayMath hears: x equals 5"), so you know it understood you. Answers are checked by value: `8/2`, `x = 4` and `4` all count; for simplifying, any equivalent expression counts. Hints in all three languages. Answers can also be spoken (**Say it**). |
| **Teach** | A teacher types one question per line (`Solve for x: 3x - 4 = 11 answer: x = 5`). SayMath previews every line as speech and **flags anything a listener could misunderstand**, like `1/2x`. One click downloads a **single HTML file of about 70 KB** with the whole engine inside: speech, explorer, the chosen language and answer checking, with no internet needed. Or download a **braille worksheet (.brf)** for an embosser, or copy the questions as plain words for SMS. Questions can be written with Hindi or Marathi prompts. |
| **Hindi and Marathi** | Every spoken pattern has a Hindi and a Marathi version in that language's word order: एक्स का वर्ग, ए बटा बी, एक्स, 5 से कम है (Hindi); एक्स चा वर्ग, ए भागिले बी, एक्स, 5 पेक्षा लहान आहे (Marathi). Every button, label, hint and error message is translated too. Devices with no Marathi voice use a Hindi voice. |
| **More maths** | Sums, products, integrals, limits, derivatives, matrices and determinants, ±, degrees, ≈, inverse and hyperbolic trig. All spoken, drawn, explorable and checked by value. |
| **Braille** | Each equation's **Nemeth Code** braille, to copy to a braille display or download as a .brf file for an embosser (experimental). |
| **Read from a photo** | Photograph a printed or handwritten worksheet: Claude, an AI model by Anthropic, turns it into typed maths, flags anything it was unsure of, and the questions can be heard or added to a worksheet. Needs the internet and your own Anthropic API key; the photo goes straight from your device to Anthropic. |
| **Say it** | Speak maths or answers ("x squared plus 3 equals 7") in English, Hindi or Marathi. SayMath types it and reads it back so you can check it heard you. |
| **Share and print** | Copy a link that opens the same maths in the same language. Print just the maths, its words and braille in large print. Press Esc to stop speech at any time. |
| **Offline** | After the first visit the app works with no signal and can be installed to the home screen. |
| **Readable** | Atkinson Hyperlegible font (designed for low vision), large / extra-large text, light, dark and high-contrast (yellow on black) themes, 44px touch targets. |

![Explorer on the denominator](docs/screenshots/2-explorer-denominator.png)

## How SayMath decides what to say

The main rule: **anything that groups says where it ends**, unless it only holds a single number or letter.

| You type | SayMath says | Why |
|---|---|---|
| `sqrt(x+1)` | the square root of x plus 1, **end root** | Different from √x + 1 |
| `sqrt(x)+1` | the square root of x plus 1 | Root holds one letter: no end needed |
| `x^n + 1` | x to the **n-th power** plus 1 | "power" closes the exponent |
| `x^(n+1)` | x to the power n plus 1, **end power** | |
| `(a+b)^2` | the quantity a plus b, end quantity, squared | |
| `sin^2 x` | sine squared of x | Never "sine of x squared" (that is sin(x²)) |
| `1/2 + 3/4` | one half plus three quarters | Natural names for simple fractions |
| `2(x+1)` | 2 **times** the quantity x plus 1, end quantity | "times" before brackets |
| `1/2x` | ⚠️ *Warning: could mean (1/2)·x or 1/(2x)* | Ambiguous input is flagged, not guessed silently |

In Hindi: `x^n + 1` → "एक्स की एन घात प्लस 1" and `x^(n+1)` → "एक्स की घात एन प्लस 1, घात समाप्त".

A **Brief** mode drops the end marker only at the very end of an expression, where it can't be ambiguous.

Input supports `^ / * _ ! | ( ) [ ]`, `sqrt()`, `root(3, x)`, `abs()`, `sin cos tan log ln asin cosh…`, `log_2(8)`, `pi theta alpha…`, `<= >= != ~=`, `+/-`, `30°`, `sum(i=1, n, i^2)`, `prod(k=1, n, k)`, `int(x^2, x, 0, 1)`, `lim(x -> 0, sin(x)/x)`, `diff(x^3, x)`, `[[1, 2], [3, 4]]`, `det(...)`, and Unicode (`x² √ ≤ ÷ π ± ∫ ∑ →`).

Calculus reads naturally and closes itself where it can: `int(x^2, x, 0, 1)` → "the integral from 0 to 1 of x squared, d x"; `[[1, 2], [3, 4]]` → "the 2 by 2 matrix: row 1: 1, 2; row 2: 3, 4; end matrix".

## Try it in 2 minutes (for judges)

1. Open the [live demo](https://shineyrbl-byte.github.io/saymath/). Press **Quadratic formula**. Press **Hear the before**, then **Hear again**. That is the before and after.
2. Click the equation (or Tab to it) and use ↓ → ↑ to walk into the fraction.
3. Press **An ambiguous one** to see the warning.
4. Open **Practice**. Type `x = 5` and press Check (wrong, with your answer read back). Press **Hint**, then type `8/2` (accepted: it's 4).
5. Open **Settings → Language → हिन्दी** (or मराठी): the whole app and the maths switch language.
6. Open **Teach** and press **Download worksheet**. Turn off Wi-Fi and open the file: it still reads, explores and checks answers.
7. Back on **Listen**, press **Calculus** or **Matrix**, and open **Braille** under the equation.

For the full experience, turn on a screen reader (VoiceOver: Cmd+F5 on Mac; NVDA on Windows) and set **Settings → Speak with this device's voice** off, so you only hear the screen reader.

## Run it locally

No build step and no dependencies. You need Node 20+ (or any static file server, such as `python3 -m http.server`).

```bash
git clone https://github.com/shineyrbl-byte/saymath.git
cd saymath
npm start                         # small built-in server, no installs
# open http://localhost:8080
```

Tests (Node 20+; browser tests need Google Chrome):

```bash
npm test                          # 55 unit tests: parser, speech (3 languages), calculus, braille, answer checking, voice, photo, worksheets
node scripts/serve.mjs 8765 &     # browser tests expect the site here
npm run test:browser              # 61 checks in headless Chrome with real key presses
```

## Testing evidence

Automated, run on every push by GitHub Actions:

- **Keyboard:** real arrow-key presses walk the quadratic formula and check every announcement, edge message and breadcrumb; Tab order; the ARIA tabs pattern.
- **Practice:** wrong answers get read back, hints are spoken, `8/2` is accepted for `x = 4`, focus moves to Next, Hindi and Marathi prompts.
- **Languages:** switching to Hindi or Marathi changes every label, message and error, and the page language.
- **Calculus and matrices:** arrow keys reach the limits of an integral and each matrix entry; answers like `3x^2` for `diff(x^3, x)` are accepted.
- **Braille:** the Nemeth output for standard examples (like the quadratic formula) is pinned by tests.
- **Photo reading:** the request and reply handling are tested with a stand-in for Claude; a real browser check confirmed the SDK loads and reaches the API.
- **Shared links:** a link opens the same maths in the same language.
- **Worksheet file:** opened as its own page, **0 external requests**, answer checking and explorer work inside it, fits a phone, under 80 KB.
- **Offline:** the app reloads with the network cut off; settings are remembered.
- **Phone width:** no sideways scrolling at 390px on any tab or in the worksheet.
- **Accessibility audit:** [axe-core](https://github.com/dequelabs/axe-core) on every tab in light, dark and high-contrast themes: **0 violations** in all 9 runs.
- **Content:** every built-in answer key is checked to satisfy its equation.

Manual:

- **VoiceOver on macOS:** I tested the first version of the app myself with VoiceOver and the app's own voice turned off. VoiceOver read the equation, the arrow keys walked into the fraction and announced each part ("numerator", "denominator: 2 a"), and Practice read back my answer and the feedback. Everything worked as designed.

Not yet done (and important): **testing with blind and low-vision students, with Hindi- and Marathi-medium maths teachers, and with a braille transcriber.** My own VoiceOver test shows the app works with a screen reader, but I'm not a daily screen reader user. Only real learners can show whether the design is right for them. This is the next step.

## Limitations

- **Reading a photo needs the internet and an Anthropic API key**, and sends the photo to Anthropic. AI can misread, especially handwriting, so every line should be checked; unsure lines are flagged. PDFs aren't supported yet: take a photo or screenshot of the page.
- **Hindi and Marathi wording are first versions.** They follow common classroom usage, but haven't been reviewed by Hindi- or Marathi-medium maths teachers. The calculus words in particular (समाकल, संकलन, लक्ष…) need checking.
- **Braille is experimental.** The Nemeth output follows the code's main rules (numeric indicator, levels, fractions, radicals), but hasn't been checked by a transcriber. Sums, limits and matrices use a simplified layout. Braille worksheets leave out Hindi and Marathi prompts (only the maths is in braille), because Bharati braille isn't supported yet.
- **Say it depends on the browser.** It works in Chrome, Edge and Safari, not Firefox, and those browsers may send the voice to their own speech service (the app says so). It understands common phrases, not every way of saying maths.
- **Voices depend on the device.** Speech uses the browser's built-in voice. Some devices have no Hindi or Marathi voice, and the app says so. Screen reader users can turn the built-in voice off and hear everything through their screen reader instead.
- **Screen readers: tested only with VoiceOver on macOS.** The explorer uses `role="application"` and a live region, and works with keyboard only. NVDA, JAWS and TalkBack haven't been tested yet and may behave differently.
- **Up to early college maths:** calculus answers are checked numerically (very close counts as equal); no vectors, set notation, piecewise functions or chemistry.
- **Answer checking compares values**, not working: it can't give credit for method, and it can't check proofs.
- **Three languages so far.** Tamil, Bengali and other languages need a phrasebook each, written with native-speaking maths teachers.

## How it's built

Plain JavaScript ES modules, no framework, no build step, no server. Nothing the learner types leaves their device; the only exceptions are the two features that say so (Read from a photo, Say it), and only when the learner uses them.

```
src/parser.js        typed math → tree (implicit multiplication, Unicode, friendly errors, ambiguity warnings)
src/speak.js         tree → words, with the "say where groups end" rule; language-independent
src/lang/en.js       English phrasebook
src/lang/hi.js       Hindi phrasebook (Hindi word order)
src/lang/mr.js       Marathi phrasebook (Marathi word order)
src/i18n.js          interface text in English, Hindi and Marathi
src/braille.js       Nemeth braille, ASCII braille (.brf), uncontracted text braille
src/photo.js         reads maths from a photo with Claude (structured JSON output)
src/voice.js         spoken maths → typed maths, for Say it
src/render.js        tree → HTML equation, one element per part
src/explorer.js      arrow-key explorer
src/evaluate.js      evaluates trees; checks answers by value at several points
src/practice.js      Practice tab
src/worksheet.js     worksheet parsing + a tiny bundler that inlines the engine into one HTML file
src/worksheet-runtime.js  the code that runs inside a downloaded worksheet
sw.js                offline cache
tests/               unit tests (node:test) and browser tests (Chrome DevTools Protocol, no dependencies)
```

## Credits and disclosure

- **AI assistance:** built with help from Claude Code (Anthropic), which was used for planning, writing code and tests, and drafting this README. I reviewed, ran and tested everything.
- **AI inside the app:** Read from a photo uses Claude (`claude-opus-5-5`) through the [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) (MIT), pinned to version 1.8.0 and loaded from jsDelivr only when a photo is read. It uses the person's own API key.
- **Font:** [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) by the Braille Institute (SIL Open Font License), loaded from Google Fonts. If it can't load, the app falls back to system fonts.
- **Testing only:** [axe-core](https://github.com/dequelabs/axe-core) (MPL-2.0), loaded from cdnjs during the accessibility audit. It is not part of the app.
- **Data:** no datasets. All practice problems, worksheet examples and the learner example are made up. No real student data is used anywhere.
- **Inspiration:** the idea of speaking where groups end follows the approach of MathSpeak-style rules used in accessible maths. All code and wording here are original.
- **Pre-existing work:** none.

## License

MIT
