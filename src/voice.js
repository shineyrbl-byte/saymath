// Answering by voice: turns spoken maths ("x squared plus 3 equals 7")
// into typed maths ("x ^2 + 3 = 7") that SayMath then reads back, so the
// learner can check it heard them right.
//
// Speech recognition is done by the browser. In Chrome and Edge the voice
// is sent to the browser maker's speech service; the page says so.

import { EN } from './lang/en.js';
import { HI } from './lang/hi.js';
import { MR } from './lang/mr.js';

const EN_NUMBERS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

// Phrases, longest first within each language, to the typed form.
const PHRASES = {
  en: [
    ['is less than or equal to', '<='], ['less than or equal to', '<='], ['is greater than or equal to', '>='],
    ['greater than or equal to', '>='], ['is not equal to', '!='], ['not equal to', '!='], ['is equal to', '='],
    ['equal to', '='], ['equals', '='], ['equal', '='], ['is less than', '<'], ['less than', '<'],
    ['is greater than', '>'], ['greater than', '>'], ['plus or minus', '+/-'], ['plus', '+'], ['minus', '-'],
    ['negative', '-'], ['multiplied by', '*'], ['times', '*'], ['divided by', '/'], ['over', '/'],
    ['squared', '^2'], ['cubed', '^3'], ['to the power of', '^'], ['to the power', '^'], ['raised to', '^'],
    ['square root of', 'sqrt'], ['square root', 'sqrt'], ['open bracket', '('], ['open brackets', '('],
    ['left bracket', '('], ['close bracket', ')'], ['close brackets', ')'], ['right bracket', ')'],
    ['factorial', '!'], ['point', '.'], ['why', 'y'], ['ex', 'x'], ['zed', 'z'], ['zee', 'z'],
    ['the answer is', '='], ['my answer is', '='], ['answer', ''], ['the', ''], ['of', ''], ['is', '='],
  ],
  hi: [
    ['प्लस या माइनस', '+/-'], ['के बराबर', '='], ['बराबर', '='], ['प्लस', '+'], ['जमा', '+'], ['माइनस', '-'],
    ['ऋण', '-'], ['गुणा', '*'], ['बटा', '/'], ['भाग', '/'], ['का वर्गमूल', 'sqrt'], ['वर्गमूल', 'sqrt'],
    ['का वर्ग', '^2'], ['का घन', '^3'], ['की घात', '^'], ['घात', '^'], ['स्क्वेयर', '^2'], ['दशमलव', '.'],
    ['से कम या बराबर है', '<='], ['से अधिक या बराबर है', '>='], ['से कम है', '<'], ['से अधिक है', '>'],
    ['कोष्ठक खोलिए', '('], ['कोष्ठक बंद', ')'],
  ],
  mr: [
    ['अधिक किंवा वजा', '+/-'], ['च्या बरोबर', '='], ['बरोबर', '='], ['बराबर', '='], ['अधिक', '+'], ['वजा', '-'], ['ऋण', '-'],
    ['गुणिले', '*'], ['भागिले', '/'], ['चे वर्गमूळ', 'sqrt'], ['वर्गमूळ', 'sqrt'], ['चा वर्ग', '^2'],
    ['चा घन', '^3'], ['चा घात', '^'], ['घात', '^'], ['पूर्णांक', '.'],
    ['पेक्षा लहान किंवा बरोबर आहे', '<='], ['पेक्षा मोठा किंवा बरोबर आहे', '>='], ['पेक्षा लहान आहे', '<'],
    ['पेक्षा मोठा आहे', '>'], ['कंस उघडा', '('], ['कंस बंद', ')'],
  ],
};

// Letter names ("एक्स" for x), taken from the phrasebooks.
const letterNames = (L) => [...'abcdefghijklmnopqrstuvwxyz'].map((c) => [L.letter(c), c]).filter(([w, c]) => w !== c);
const LETTERS = { en: [], hi: letterNames(HI), mr: letterNames(MR) };
const DEVANAGARI_DIGITS = { '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9 };

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function spokenToMath(text, lang = 'en') {
  let s = ` ${text.toLowerCase().replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d])} `;
  s = s.replace(/[,?]/g, ' ');
  if (lang === 'en') {
    // "twenty one" -> 21, "five" -> 5
    s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/g,
      (_, t, o) => String(EN_NUMBERS[t] + EN_NUMBERS[o]));
    s = s.replace(new RegExp(`\\b(${Object.keys(EN_NUMBERS).join('|')})\\b`, 'g'), (w) => String(EN_NUMBERS[w]));
  }
  // Longer phrases first, so "is less than or equal to" wins over "less than".
  const list = [...(PHRASES[lang] || PHRASES.en), ...LETTERS[lang] || []].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of list) {
    const re = lang === 'en' ? new RegExp(`\\b${escape(from)}\\b`, 'g') : new RegExp(`(^|\\s)${escape(from)}(?=\\s|$)`, 'g');
    s = s.replace(re, (m, pre = '') => `${typeof pre === 'string' && lang !== 'en' ? pre : ''} ${to} `);
  }
  // "The answer is 4" leaves a leading "=": drop it.
  return s.replace(/\s+/g, ' ').replace(/\s*\^\s*/g, '^').trim().replace(/^=\s*/, '');
}

export const RECOGNITION_LANG = { en: EN.speechLang, hi: HI.speechLang, mr: MR.speechLang };

export function canListen() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Listens once. Resolves with what was heard (as text), or rejects.
export function listenOnce(lang) {
  return new Promise((resolve, reject) => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R();
    r.lang = RECOGNITION_LANG[lang] || 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => resolve(e.results[0][0].transcript);
    r.onerror = (e) => reject(new Error(e.error));
    r.onend = () => reject(new Error('no-speech'));
    r.start();
  });
}
