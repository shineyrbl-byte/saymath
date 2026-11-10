// Built-in practice sets. All problems are made up for this app.
// kind: 'solve' (answer is a number for `solveFor`), 'value' (work it out),
//       'simplify' (any equivalent expression is accepted).

export const PROMPTS = {
  en: { solve: (v) => `Solve for ${v}.`, value: () => 'Work this out.', simplify: () => 'Simplify.' },
  hi: { solve: (v) => `${v} का मान ज्ञात कीजिए।`, value: () => 'इसका मान निकालिए।', simplify: () => 'सरल कीजिए।' },
};

export const SETS = [
  {
    id: 'equations',
    title: { en: 'Linear equations', hi: 'रैखिक समीकरण' },
    problems: [
      { kind: 'solve', solveFor: 'x', math: '2x + 3 = 11', answer: '4',
        hint: { en: 'Take 3 from both sides, then divide both sides by 2.', hi: 'दोनों पक्षों से 3 घटाइए, फिर दोनों पक्षों को 2 से भाग दीजिए।' } },
      { kind: 'solve', solveFor: 'x', math: '5x - 7 = 3x + 9', answer: '8',
        hint: { en: 'Move the x terms to one side: 5x minus 3x is 2x.', hi: 'एक्स वाले पद एक ओर लाइए: 5 एक्स माइनस 3 एक्स, 2 एक्स है।' } },
      { kind: 'solve', solveFor: 'x', math: '(x + 4)/3 = 5', answer: '11',
        hint: { en: 'Multiply both sides by 3 to clear the fraction.', hi: 'भिन्न हटाने के लिए दोनों पक्षों को 3 से गुणा कीजिए।' } },
      { kind: 'solve', solveFor: 'x', math: '3(x - 2) = 2x + 1', answer: '7',
        hint: { en: 'Open the bracket first: 3 times x is 3x, 3 times negative 2 is negative 6.', hi: 'पहले कोष्ठक खोलिए: 3 गुणा एक्स, 3 एक्स है।' } },
    ],
  },
  {
    id: 'numbers',
    title: { en: 'Fractions, powers and roots', hi: 'भिन्न, घात और मूल' },
    problems: [
      { kind: 'value', math: '1/2 + 1/3', answer: '5/6',
        hint: { en: 'Use sixths: one half is 3 sixths, one third is 2 sixths.', hi: 'छठे भाग में बदलिए: आधा, 3 बटा 6 है।' } },
      { kind: 'value', math: '2^5', answer: '32',
        hint: { en: 'Multiply 2 by itself 5 times.', hi: '2 को 5 बार आपस में गुणा कीजिए।' } },
      { kind: 'value', math: 'sqrt(144)', answer: '12',
        hint: { en: 'Which number times itself makes 144?', hi: 'कौन-सी संख्या को उसी से गुणा करने पर 144 आता है?' } },
      { kind: 'value', math: '3/4 * 8/9', answer: '2/3',
        hint: { en: 'Multiply the tops and the bottoms, then simplify.', hi: 'अंश को अंश से और हर को हर से गुणा कीजिए, फिर सरल कीजिए।' } },
      { kind: 'value', math: '10^-2', answer: '0.01',
        hint: { en: 'A negative power means 1 over the power: 1 over 10 squared.', hi: 'ऋण घात का अर्थ है 1 बटा घात: 1 बटा 10 का वर्ग।' } },
    ],
  },
  {
    id: 'algebra',
    title: { en: 'Simplifying', hi: 'सरलीकरण' },
    problems: [
      { kind: 'simplify', math: 'x^2 * x^3', answer: 'x^5',
        hint: { en: 'When you multiply powers of the same letter, add the powers.', hi: 'एक ही अक्षर की घातों को गुणा करते समय घातें जोड़िए।' } },
      { kind: 'simplify', math: '(2x)(3x^2)', answer: '6x^3',
        hint: { en: 'Multiply the numbers, then the x parts.', hi: 'पहले संख्याओं को गुणा कीजिए, फिर एक्स वाले भागों को।' } },
      { kind: 'simplify', math: '(x^2 - 9)/(x - 3)', answer: 'x + 3',
        hint: { en: 'x squared minus 9 is a difference of squares: the quantity x minus 3 times the quantity x plus 3.', hi: 'एक्स का वर्ग माइनस 9 को (एक्स माइनस 3)(एक्स प्लस 3) लिख सकते हैं।' } },
      { kind: 'simplify', math: '(a + b)^2', answer: 'a^2 + 2ab + b^2',
        hint: { en: 'Multiply the quantity a plus b by itself: you get four parts.', hi: '(ए प्लस बी) को उसी से गुणा कीजिए: चार पद मिलेंगे।' } },
    ],
  },
];
