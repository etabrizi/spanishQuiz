import { shuffleCards } from './card-order.mjs';

// Meaning-changing alternatives, not synonyms. Phrase-level substitutions keep
// agreement intact (for example, "I am" becomes "you are", not "you am").
const CONTRASTS = [
  ['I want to', 'I need to', 'I have to', 'I am going to'],
  ['you want to', 'you need to', 'you have to', 'you are going to'],
  ['we want to', 'we need to', 'we have to', 'we are going to'],
  ['do you want to', 'do we want to', 'do they want to'],
  ['can you', 'can we', 'can they'],
  ['I cannot', 'I can'],
  ['I do not', 'we do not', 'they do not'],
  ['I am', 'we are', 'they are'],
  ['I have', 'we have', 'they have'],
  ['my', 'your', 'our', 'their'],
  ['today', 'tomorrow'],
  ['now', 'later'],
  ['tonight', 'tomorrow night'],
  ['this morning', 'this afternoon', 'this evening'],
  ['before', 'after'],
  ['near', 'far from'],
  ['inside', 'outside'],
  ['in front of', 'behind', 'next to'],
  ['under', 'above'],
  ['here', 'there'],
  ['hot', 'cold'],
  ['is open', 'is closed'],
  ['early', 'late'],
  ['expensive', 'cheap'],
  ['easy', 'difficult'],
  ['big', 'small'],
  ['is clean', 'is dirty'],
  ['boy', 'girl'],
  ['man', 'woman'],
  ['hotel', 'restaurant', 'station'],
  ['room', 'house', 'shop'],
  ['city', 'village'],
  ['door', 'window'],
  ['table', 'chair'],
  ['phone', 'key'],
  ['week', 'month', 'year'],
  ['always', 'never', 'sometimes']
];

const normalize = (text) => text.toLowerCase().replace(/[.!?,]/g, '').replace(/\s+/g, ' ').trim();
const tokens = (text) => normalize(text).split(' ');

export function buildTranslationOptions(acceptedAnswers, answerBank, random = Math.random) {
  const correct = acceptedAnswers[0];
  const accepted = new Set(acceptedAnswers.map(normalize));
  const candidates = new Map();
  const add = (answer) => {
    const key = normalize(answer);
    if (!accepted.has(key) && !candidates.has(key)) candidates.set(key, answer);
  };

  for (const group of CONTRASTS) {
    for (const phrase of group) {
      const pattern = new RegExp(`\\b${phrase}\\b`, 'gi');
      for (const match of correct.matchAll(pattern)) {
        // Modal statements cannot be substituted inside a do/does question.
        if (/^(you|we) (want|need|have|are)/.test(phrase)
          && /\b(do|does|did)\s+$/i.test(correct.slice(0, match.index))) continue;
        for (const replacement of group) {
          if (replacement === phrase) continue;
          let text = replacement;
          if (match.index === 0) text = text[0].toUpperCase() + text.slice(1);
          add(correct.slice(0, match.index) + text + correct.slice(match.index + match[0].length));
        }
      }
    }
  }

  const wrong = shuffleCards([...candidates.values()], random).slice(0, 2);
  if (wrong.length < 2) {
    // For phrases without a safe contrast, prefer translations sharing words
    // and sentence length instead of unrelated random answers.
    const correctWords = tokens(correct);
    const vocabulary = new Set(correctWords);
    const similarity = (answer) => {
      const words = tokens(answer);
      const overlap = new Set(words.filter((word) => vocabulary.has(word))).size;
      return overlap / new Set([...correctWords, ...words]).size
        - Math.abs(words.length - correctWords.length) / Math.max(words.length, correctWords.length);
    };
    const nearby = shuffleCards(answerBank, random).sort((a, b) => similarity(b) - similarity(a));
    for (const answer of nearby) {
      if (!accepted.has(normalize(answer)) && !wrong.some((entry) => normalize(entry) === normalize(answer))) {
        wrong.push(answer);
        if (wrong.length === 2) break;
      }
    }
  }
  return shuffleCards([correct, ...wrong], random);
}
