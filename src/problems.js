// Built-in practice sets. All problems are made up for this app.
// kind: 'solve' (answer is a number for `solveFor`), 'value' (work it out),
//       'simplify' (any equivalent expression is accepted).

export const PROMPTS = {
  en: { solve: (v) => `Solve for ${v}.`, value: () => 'Work this out.', simplify: () => 'Simplify.' },
  hi: { solve: (v) => `${v} का मान ज्ञात कीजिए।`, value: () => 'इसका मान निकालिए।', simplify: () => 'सरल कीजिए।' },
  mr: { solve: (v) => `${v} ची किंमत काढा.`, value: () => 'याची किंमत काढा.', simplify: () => 'सोपे रूप द्या.' },
};

export const SETS = [
  {
    id: 'equations',
    title: { en: 'Linear equations', hi: 'रैखिक समीकरण', mr: 'रेषीय समीकरणे' },
    problems: [
      { kind: 'solve', solveFor: 'x', math: '2x + 3 = 11', answer: '4',
        hint: { en: 'Take 3 from both sides, then divide both sides by 2.', hi: 'दोनों पक्षों से 3 घटाइए, फिर दोनों पक्षों को 2 से भाग दीजिए।', mr: 'दोन्ही बाजूंतून 3 वजा करा, मग दोन्ही बाजूंना 2 ने भागा.' } },
      { kind: 'solve', solveFor: 'x', math: '5x - 7 = 3x + 9', answer: '8',
        hint: { en: 'Move the x terms to one side: 5x minus 3x is 2x.', hi: 'एक्स वाले पद एक ओर लाइए: 5 एक्स माइनस 3 एक्स, 2 एक्स है।', mr: 'एक्स असलेली पदे एका बाजूला आणा: 5 एक्स वजा 3 एक्स म्हणजे 2 एक्स.' } },
      { kind: 'solve', solveFor: 'x', math: '(x + 4)/3 = 5', answer: '11',
        hint: { en: 'Multiply both sides by 3 to clear the fraction.', hi: 'भिन्न हटाने के लिए दोनों पक्षों को 3 से गुणा कीजिए।', mr: 'अपूर्णांक काढण्यासाठी दोन्ही बाजूंना 3 ने गुणा.' } },
      { kind: 'solve', solveFor: 'x', math: '3(x - 2) = 2x + 1', answer: '7',
        hint: { en: 'Open the bracket first: 3 times x is 3x, 3 times negative 2 is negative 6.', hi: 'पहले कोष्ठक खोलिए: 3 गुणा एक्स, 3 एक्स है।', mr: 'आधी कंस सोडवा: 3 गुणिले एक्स म्हणजे 3 एक्स, 3 गुणिले ऋण 2 म्हणजे ऋण 6.' } },
    ],
  },
  {
    id: 'numbers',
    title: { en: 'Fractions, powers and roots', hi: 'भिन्न, घात और मूल', mr: 'अपूर्णांक, घात आणि मुळे' },
    problems: [
      { kind: 'value', math: '1/2 + 1/3', answer: '5/6',
        hint: { en: 'Use sixths: one half is 3 sixths, one third is 2 sixths.', hi: 'छठे भाग में बदलिए: आधा, 3 बटा 6 है।', mr: 'सहाव्या भागांत बदला: अर्धा म्हणजे 3 भागिले 6, एक तृतीयांश म्हणजे 2 भागिले 6.' } },
      { kind: 'value', math: '2^5', answer: '32',
        hint: { en: 'Multiply 2 by itself 5 times.', hi: '2 को 5 बार आपस में गुणा कीजिए।', mr: '2 ला 5 वेळा स्वतःशी गुणा.' } },
      { kind: 'value', math: 'sqrt(144)', answer: '12',
        hint: { en: 'Which number times itself makes 144?', hi: 'कौन-सी संख्या को उसी से गुणा करने पर 144 आता है?', mr: 'कोणत्या संख्येला तिच्याच संख्येने गुणल्यावर 144 येतात?' } },
      { kind: 'value', math: '3/4 * 8/9', answer: '2/3',
        hint: { en: 'Multiply the tops and the bottoms, then simplify.', hi: 'अंश को अंश से और हर को हर से गुणा कीजिए, फिर सरल कीजिए।', mr: 'अंशाला अंशाने आणि छेदाला छेदाने गुणा, मग सोपे रूप द्या.' } },
      { kind: 'value', math: '10^-2', answer: '0.01',
        hint: { en: 'A negative power means 1 over the power: 1 over 10 squared.', hi: 'ऋण घात का अर्थ है 1 बटा घात: 1 बटा 10 का वर्ग।', mr: 'ऋण घात म्हणजे 1 भागिले घात: 1 भागिले 10 चा वर्ग.' } },
    ],
  },
  {
    id: 'algebra',
    title: { en: 'Simplifying', hi: 'सरलीकरण', mr: 'सोपे रूप' },
    problems: [
      { kind: 'simplify', math: 'x^2 * x^3', answer: 'x^5',
        hint: { en: 'When you multiply powers of the same letter, add the powers.', hi: 'एक ही अक्षर की घातों को गुणा करते समय घातें जोड़िए।', mr: 'एकाच अक्षराचे घात गुणताना घातांकांची बेरीज करा.' } },
      { kind: 'simplify', math: '(2x)(3x^2)', answer: '6x^3',
        hint: { en: 'Multiply the numbers, then the x parts.', hi: 'पहले संख्याओं को गुणा कीजिए, फिर एक्स वाले भागों को।', mr: 'आधी संख्यांचा गुणाकार करा, मग एक्स असलेल्या भागांचा.' } },
      { kind: 'simplify', math: '(x^2 - 9)/(x - 3)', answer: 'x + 3',
        hint: { en: 'x squared minus 9 is a difference of squares: the quantity x minus 3 times the quantity x plus 3.', hi: 'एक्स का वर्ग माइनस 9 को (एक्स माइनस 3)(एक्स प्लस 3) लिख सकते हैं।', mr: 'एक्स चा वर्ग वजा 9 हे (एक्स वजा 3)(एक्स अधिक 3) असे लिहिता येते.' } },
      { kind: 'simplify', math: '(a + b)^2', answer: 'a^2 + 2ab + b^2',
        hint: { en: 'Multiply the quantity a plus b by itself: you get four parts.', hi: '(ए प्लस बी) को उसी से गुणा कीजिए: चार पद मिलेंगे।', mr: '(ए अधिक बी) ला त्याच्याच कंसाने गुणा: चार पदे मिळतील.' } },
    ],
  },
  {
    id: 'calculus',
    title: { en: 'Calculus and matrices', hi: 'कलन और आव्यूह', mr: 'कलन आणि आव्यूह' },
    problems: [
      { kind: 'value', math: 'diff(x^3, x)', answer: '3x^2',
        hint: { en: 'Bring the power down in front, then take one off the power.', hi: 'घात को आगे लाइए, फिर घात में से 1 घटाइए।', mr: 'घातांक पुढे आणा, मग घातांकातून 1 वजा करा.' } },
      { kind: 'value', math: 'int(2x, x, 0, 3)', answer: '9',
        hint: { en: 'The integral of 2 x is x squared. Work out 3 squared minus 0 squared.', hi: '2 एक्स का समाकल एक्स का वर्ग है। 3 का वर्ग माइनस 0 का वर्ग निकालिए।', mr: '2 एक्स चे संकलन म्हणजे एक्स चा वर्ग. 3 चा वर्ग वजा 0 चा वर्ग काढा.' } },
      { kind: 'value', math: 'lim(x -> 2, (x^2 - 4)/(x - 2))', answer: '4',
        hint: { en: 'x squared minus 4 is the quantity x minus 2 times the quantity x plus 2. Cancel, then put x equals 2.', hi: 'एक्स का वर्ग माइनस 4 को (एक्स माइनस 2)(एक्स प्लस 2) लिखिए। काटिए, फिर एक्स बराबर 2 रखिए।', mr: 'एक्स चा वर्ग वजा 4 हे (एक्स वजा 2)(एक्स अधिक 2) असे लिहा. सामाईक भाग काढून टाका, मग एक्स बरोबर 2 ठेवा.' } },
      { kind: 'value', math: 'sum(k=1, 5, k)', answer: '15',
        hint: { en: 'Add 1, 2, 3, 4 and 5.', hi: '1, 2, 3, 4 और 5 को जोड़िए।', mr: '1, 2, 3, 4 आणि 5 यांची बेरीज करा.' } },
      { kind: 'value', math: 'det([[2, 1], [4, 3]])', answer: '2',
        hint: { en: 'For a 2 by 2 matrix: top left times bottom right, minus top right times bottom left.', hi: '2 गुणा 2 आव्यूह के लिए: ऊपर बाएँ गुणा नीचे दाएँ, माइनस ऊपर दाएँ गुणा नीचे बाएँ।', mr: '2 गुणिले 2 आव्यूहासाठी: वर डावा गुणिले खाली उजवा, वजा वर उजवा गुणिले खाली डावा.' } },
    ],
  },
];
