import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  Download,
  Flame,
  ListPlus,
  RotateCcw,
  Play,
  Plus,
  Speech,
  Timer,
  Trash2,
  Trophy,
  User,
  Volume2,
  X,
  XCircle
} from 'lucide-react';
import './styles.css';

const FALLBACK_CARDS = [{ question: 'hola', answers: ['hello'] }];

const ROUND_SECONDS = 10;
const ROUND_CARD_COUNT = 20;
const QUESTIONS_URL = '/questions.json';
const CUSTOM_CARDS_STORAGE_KEY = 'spanish-quiz-custom-cards';
const REMOVED_BASE_CARDS_STORAGE_KEY = 'spanish-quiz-removed-base-cards';
const LEADERBOARD_STORAGE_KEY = 'spanish-quiz-leaderboard';
const BEST_STREAKER_STORAGE_KEY = 'spanish-quiz-best-streaker';
const BEST_TRANSLATOR_STORAGE_KEY = 'spanish-quiz-best-translator';
const VIEW = {
  HOME: 'home',
  QUIZ: 'quiz',
  QUESTIONS: 'questions',
  REVIEW: 'review',
  LEADERBOARD: 'leaderboard'
};
const QUIZ_MODE = {
  NORMAL: 'normal',
  STREAK: 'streak',
  TRANSLATE: 'translate'
};
const QUIZ_MODE_LABEL = {
  [QUIZ_MODE.NORMAL]: 'Normal',
  [QUIZ_MODE.STREAK]: 'Streak',
  [QUIZ_MODE.TRANSLATE]: 'Translate'
};
const STREAK_MODES = [QUIZ_MODE.STREAK, QUIZ_MODE.TRANSLATE];
const NOUN_PHRASES = {
  casa: { definite: 'la casa', indefinite: 'una casa', englishDefinite: 'the house', englishIndefinite: 'a house' },
  agua: { definite: 'el agua', indefinite: 'agua', englishDefinite: 'the water', englishIndefinite: 'water' },
  comida: { definite: 'la comida', indefinite: 'comida', englishDefinite: 'the food', englishIndefinite: 'food' },
  amigo: { definite: 'el amigo', indefinite: 'un amigo', englishDefinite: 'the friend', englishIndefinite: 'a friend' },
  trabajo: { definite: 'el trabajo', indefinite: 'un trabajo', englishDefinite: 'the work', englishIndefinite: 'work' },
  familia: { definite: 'la familia', indefinite: 'una familia', englishDefinite: 'the family', englishIndefinite: 'a family' },
  problema: { definite: 'el problema', indefinite: 'un problema', englishDefinite: 'the problem', englishIndefinite: 'a problem' },
  telefono: { definite: 'el teléfono', indefinite: 'un teléfono', englishDefinite: 'the phone', englishIndefinite: 'a phone' },
  restaurante: {
    definite: 'el restaurante',
    indefinite: 'un restaurante',
    englishDefinite: 'the restaurant',
    englishIndefinite: 'a restaurant'
  },
  musica: { definite: 'la música', indefinite: 'música', englishDefinite: 'the music', englishIndefinite: 'music' },
  tiempo: { definite: 'el tiempo', indefinite: 'tiempo', englishDefinite: 'the time', englishIndefinite: 'time' },
  dinero: { definite: 'el dinero', indefinite: 'dinero', englishDefinite: 'the money', englishIndefinite: 'money' },
  coche: { definite: 'el coche', indefinite: 'un coche', englishDefinite: 'the car', englishIndefinite: 'a car' },
  calle: { definite: 'la calle', indefinite: 'una calle', englishDefinite: 'the street', englishIndefinite: 'a street' },
  tienda: { definite: 'la tienda', indefinite: 'una tienda', englishDefinite: 'the shop', englishIndefinite: 'a shop' },
  puerta: { definite: 'la puerta', indefinite: 'una puerta', englishDefinite: 'the door', englishIndefinite: 'a door' },
  ventana: { definite: 'la ventana', indefinite: 'una ventana', englishDefinite: 'the window', englishIndefinite: 'a window' },
  mesa: { definite: 'la mesa', indefinite: 'una mesa', englishDefinite: 'the table', englishIndefinite: 'a table' },
  silla: { definite: 'la silla', indefinite: 'una silla', englishDefinite: 'the chair', englishIndefinite: 'a chair' },
  ropa: { definite: 'la ropa', indefinite: 'ropa', englishDefinite: 'the clothes', englishIndefinite: 'clothes' },
  zapatos: { definite: 'los zapatos', indefinite: 'zapatos', englishDefinite: 'the shoes', englishIndefinite: 'shoes' },
  mano: { definite: 'la mano', indefinite: 'una mano', englishDefinite: 'the hand', englishIndefinite: 'a hand' },
  cabeza: { definite: 'la cabeza', indefinite: 'una cabeza', englishDefinite: 'the head', englishIndefinite: 'a head' },
  ojo: { definite: 'el ojo', indefinite: 'un ojo', englishDefinite: 'the eye', englishIndefinite: 'an eye' },
  dia: { definite: 'el día', indefinite: 'un día', englishDefinite: 'the day', englishIndefinite: 'a day' },
  noche: { definite: 'la noche', indefinite: 'una noche', englishDefinite: 'the night', englishIndefinite: 'a night' },
  semana: { definite: 'la semana', indefinite: 'una semana', englishDefinite: 'the week', englishIndefinite: 'a week' },
  ano: { definite: 'el año', indefinite: 'un año', englishDefinite: 'the year', englishIndefinite: 'a year' },
  verdad: { definite: 'la verdad', indefinite: 'la verdad', englishDefinite: 'the truth', englishIndefinite: 'the truth' },
  cosa: { definite: 'la cosa', indefinite: 'una cosa', englishDefinite: 'the thing', englishIndefinite: 'a thing' }
};
const VERB_FORMS = {
  ayudar: { yo: 'ayudo', tu: 'ayudas', english: 'help' },
  beber: { yo: 'bebo', tu: 'bebes', english: 'drink' },
  comer: { yo: 'como', tu: 'comes', english: 'eat' },
  entender: { yo: 'entiendo', tu: 'entiendes', english: 'understand' },
  gustar: { yo: 'me gusta', tu: 'te gusta', english: 'like' },
  hacer: { yo: 'hago', tu: 'haces', english: 'do' },
  hablar: { yo: 'hablo', tu: 'hablas', english: 'speak' },
  ir: { yo: 'voy', tu: 'vas', english: 'go' },
  necesitar: { yo: 'necesito', tu: 'necesitas', english: 'need' },
  pagar: { yo: 'pago', tu: 'pagas', english: 'pay' },
  poder: { yo: 'puedo', tu: 'puedes', english: 'can' },
  querer: { yo: 'quiero', tu: 'quieres', english: 'want' },
  saber: { yo: 'sé', tu: 'sabes', english: 'know' },
  tener: { yo: 'tengo', tu: 'tienes', english: 'have' },
  venir: { yo: 'vengo', tu: 'vienes', english: 'come' },
  ver: { yo: 'veo', tu: 'ves', english: 'see' }
};

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhraseKey(value) {
  return normalizeAnswer(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getEditDistance(firstValue, secondValue) {
  const first = normalizeAnswer(firstValue);
  const second = normalizeAnswer(secondValue);
  const distances = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let previousDiagonal = distances[0];
    distances[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const previousAbove = distances[secondIndex];
      const substitutionCost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      distances[secondIndex] = Math.min(
        distances[secondIndex] + 1,
        distances[secondIndex - 1] + 1,
        previousDiagonal + substitutionCost
      );
      previousDiagonal = previousAbove;
    }
  }

  return distances[second.length];
}

function checkAnswerMatch(userAnswer, correctAnswers) {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswers = correctAnswers.map((correctAnswer) => normalizeAnswer(correctAnswer));

  if (normalizedCorrectAnswers.includes(normalizedUserAnswer)) {
    return 'exact';
  }

  const closestAnswer = normalizedCorrectAnswers
    .map((correctAnswer) => {
      const typoCount = getEditDistance(normalizedUserAnswer, correctAnswer);
      const similarity = 1 - typoCount / Math.max(normalizedUserAnswer.length, correctAnswer.length);

      return { typoCount, similarity };
    })
    .sort((first, second) => first.typoCount - second.typoCount)[0];

  return closestAnswer.typoCount <= 3 && closestAnswer.similarity >= 0.55 ? 'close' : 'wrong';
}

function getCardQuestion(card) {
  return card.question ?? card.spanish;
}

function getCardAnswer(card) {
  return getCardAnswers(card)[0];
}

function splitAnswerText(answer) {
  return String(answer ?? '')
    .split(/[\/,]/)
    .map((answerPart) => answerPart.trim())
    .filter(Boolean);
}

function getCardAnswers(card) {
  const rawAnswers = card.answers ?? card.answer ?? card.english;
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];

  return [...new Set(answers.flatMap(splitAnswerText))];
}

function sanitizeCards(cards) {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .map((card) => ({
      question: String(getCardQuestion(card) ?? '').trim(),
      answers: getCardAnswers(card)
    }))
    .filter((card) => card.question && card.answers.length);
}

function getCardKey(card) {
  return `${normalizeAnswer(getCardQuestion(card) ?? '')}|${getCardAnswers(card).map(normalizeAnswer).join('|')}`;
}

function loadStoredCards(key) {
  try {
    return sanitizeCards(JSON.parse(window.localStorage.getItem(key) ?? '[]'));
  } catch (error) {
    return [];
  }
}

function loadStoredCardKeys(key) {
  try {
    const storedKeys = JSON.parse(window.localStorage.getItem(key) ?? '[]');

    return Array.isArray(storedKeys) ? storedKeys.filter((keyValue) => typeof keyValue === 'string') : [];
  } catch (error) {
    return [];
  }
}

function loadLeaderboard() {
  try {
    const scores = JSON.parse(window.localStorage.getItem(LEADERBOARD_STORAGE_KEY) ?? '[]');

    if (!Array.isArray(scores)) {
      return [];
    }

    return scores
      .filter((entry) => entry.name && Number.isFinite(entry.score))
      .sort(compareLeaderboardEntries)
      .slice(0, 10);
  } catch (error) {
    return [];
  }
}

function loadBestStreaker() {
  try {
    const streaker = JSON.parse(window.localStorage.getItem(BEST_STREAKER_STORAGE_KEY) ?? 'null');

    return streaker?.name && Number.isFinite(streaker.score) ? streaker : null;
  } catch (error) {
    return null;
  }
}

function loadBestTranslator() {
  try {
    const translator = JSON.parse(window.localStorage.getItem(BEST_TRANSLATOR_STORAGE_KEY) ?? 'null');

    return translator?.name && Number.isFinite(translator.score) ? translator : null;
  } catch (error) {
    return null;
  }
}

function saveCustomCards(cards) {
  window.localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(cards));
}

function saveRemovedBaseCardKeys(cardKeys) {
  window.localStorage.setItem(REMOVED_BASE_CARDS_STORAGE_KEY, JSON.stringify(cardKeys));
}

function saveLeaderboard(scores) {
  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
}

function saveBestStreaker(streaker) {
  window.localStorage.setItem(BEST_STREAKER_STORAGE_KEY, JSON.stringify(streaker));
}

function saveBestTranslator(translator) {
  window.localStorage.setItem(BEST_TRANSLATOR_STORAGE_KEY, JSON.stringify(translator));
}

function getQuestionPoints(matchType, secondsLeft) {
  if (matchType === 'exact') {
    return 10 + secondsLeft;
  }

  if (matchType === 'close') {
    return 7 + secondsLeft;
  }

  return 0;
}

function compareLeaderboardEntries(first, second) {
  const firstCorrect = Number.isFinite(first.correct) ? first.correct : 0;
  const secondCorrect = Number.isFinite(second.correct) ? second.correct : 0;
  const firstTotal = Number.isFinite(first.total) && first.total > 0 ? first.total : 1;
  const secondTotal = Number.isFinite(second.total) && second.total > 0 ? second.total : 1;
  const firstAccuracy = firstCorrect / firstTotal;
  const secondAccuracy = secondCorrect / secondTotal;

  if (secondAccuracy !== firstAccuracy) {
    return secondAccuracy - firstAccuracy;
  }

  if (secondCorrect !== firstCorrect) {
    return secondCorrect - firstCorrect;
  }

  return second.score - first.score;
}

function shuffleCards(cards) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function getRandomAnswer(card) {
  const answers = getCardAnswers(card);

  return answers[Math.floor(Math.random() * answers.length)];
}

function getPrimaryAnswer(card) {
  return getCardAnswers(card)[0];
}

function getCardByQuestion(cards, question) {
  const normalizedQuestion = normalizeAnswer(question);

  return cards.find((card) => normalizeAnswer(getCardQuestion(card)) === normalizedQuestion);
}

function getCardsByAnswerPrefix(cards, prefix) {
  const normalizedPrefix = normalizeAnswer(prefix);

  return cards.filter((card) => getPrimaryAnswer(card).toLowerCase().startsWith(normalizedPrefix));
}

function getCardsByAnswers(cards, answers) {
  const normalizedAnswers = answers.map(normalizeAnswer);

  return cards.filter((card) =>
    getCardAnswers(card).some((answer) => normalizedAnswers.includes(normalizeAnswer(answer)))
  );
}

function stripQuestionPunctuation(value) {
  return value.replace(/[¿?…]/g, '').trim();
}

function capitalizeSentence(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getTranslateSentenceBank(sourceCards) {
  const nouns = sourceCards
    .map((card) => ({ card, phrase: NOUN_PHRASES[normalizePhraseKey(getCardQuestion(card))] }))
    .filter((entry) => entry.phrase);
  const places = nouns.filter((entry) =>
    ['casa', 'restaurante', 'calle', 'tienda', 'trabajo'].includes(normalizePhraseKey(getCardQuestion(entry.card)))
  );
  const periods = nouns.filter((entry) =>
    ['dia', 'noche', 'semana', 'ano'].includes(normalizePhraseKey(getCardQuestion(entry.card)))
  );
  const timeWords = getCardsByAnswers(sourceCards, ['today', 'tomorrow', 'now', 'after', 'always']).map((card) => ({
    card,
    spanish: getCardQuestion(card),
    english: normalizePhraseKey(getCardQuestion(card)) === 'despues' ? 'later' : getPrimaryAnswer(card)
  }));
  const infinitives = getCardsByAnswerPrefix(sourceCards, 'to ');
  const actionInfinitives = infinitives.filter(
    (verb) => !['ser', 'estar', 'tener', 'querer', 'poder', 'saber', 'gustar'].includes(normalizePhraseKey(getCardQuestion(verb)))
  );
  const sentences = [];

  const addSentence = (spanish, english) => {
    if (!spanish || !english) {
      return;
    }

    const sentence = {
      question: spanish,
      answers: [capitalizeSentence(english)],
      options: []
    };

    if (!sentences.some((existingSentence) => normalizeAnswer(existingSentence.question) === normalizeAnswer(sentence.question))) {
      sentences.push(sentence);
    }
  };

  const tengo = getCardByQuestion(sourceCards, 'tengo');
  const quiero = getCardByQuestion(sourceCards, 'quiero');
  const necesito = getCardByQuestion(sourceCards, 'necesito');
  const puedo = getCardByQuestion(sourceCards, 'puedo');
  const ir = getCardByQuestion(sourceCards, 'ir');
  const vasA = getCardByQuestion(sourceCards, '¿Vas a…?');
  const puedes = getCardByQuestion(sourceCards, '¿Puedes…?');
  const queHaces = getCardByQuestion(sourceCards, '¿Qué haces?');
  const queQuieres = getCardByQuestion(sourceCards, '¿Qué quieres?');
  const para = getCardByQuestion(sourceCards, 'para');
  const ahora = getCardByQuestion(sourceCards, 'ahora');

  nouns.forEach(({ phrase }) => {
    if (tengo) {
      addSentence(`${getCardQuestion(tengo)} ${phrase.indefinite}.`, `I have ${phrase.englishIndefinite}.`);
    }

    if (quiero) {
      addSentence(`${getCardQuestion(quiero)} ${phrase.definite}.`, `I want ${phrase.englishDefinite}.`);
    }

    if (necesito) {
      addSentence(`${getCardQuestion(necesito)} ${phrase.definite}.`, `I need ${phrase.englishDefinite}.`);
    }
  });

  places.forEach(({ phrase }) => {
    if (ir) {
      addSentence(`Voy a ${phrase.definite}.`, `I am going to ${phrase.englishDefinite}.`);
    }

    if (quiero) {
      addSentence(`${getCardQuestion(quiero)} ir a ${phrase.definite}.`, `I want to go to ${phrase.englishDefinite}.`);
    }

    if (necesito) {
      addSentence(`${getCardQuestion(necesito)} ir a ${phrase.definite}.`, `I need to go to ${phrase.englishDefinite}.`);
    }
  });

  actionInfinitives.forEach((verb) => {
    const spanishVerb = getCardQuestion(verb);
    const englishVerb = getPrimaryAnswer(verb).replace(/^to /i, '');
    const verbForm = VERB_FORMS[normalizePhraseKey(spanishVerb)];

    if (quiero) {
      addSentence(`${getCardQuestion(quiero)} ${spanishVerb}.`, `I want to ${englishVerb}.`);
    }

    if (necesito) {
      addSentence(`${getCardQuestion(necesito)} ${spanishVerb}.`, `I need to ${englishVerb}.`);
    }

    if (puedo) {
      addSentence(`${getCardQuestion(puedo)} ${spanishVerb}.`, `I can ${englishVerb}.`);
    }

    if (puedes) {
      addSentence(`${stripQuestionPunctuation(getCardQuestion(puedes))} ${spanishVerb}?`, `Can you ${englishVerb}?`);
    }

    if (vasA) {
      addSentence(`${stripQuestionPunctuation(getCardQuestion(vasA))} ${spanishVerb}?`, `Are you going to ${englishVerb}?`);
    }

    if (ir && ahora) {
      addSentence(`Voy a ${spanishVerb} ${getCardQuestion(ahora)}.`, `I will ${englishVerb} now.`);
    }

    if (verbForm) {
      addSentence(`${verbForm.yo} ${getCardQuestion(ahora) ?? ''}.`.replace(/\s+\./, '.'), `I ${verbForm.english}${ahora ? ' now' : ''}.`);
    }

    timeWords.forEach((timeWord) => {
      if (ir) {
        addSentence(`Voy a ${spanishVerb} ${timeWord.spanish}.`, `I will ${englishVerb} ${timeWord.english}.`);
      }

      if (vasA) {
        addSentence(`${stripQuestionPunctuation(getCardQuestion(vasA))} ${spanishVerb} ${timeWord.spanish}?`, `Will you ${englishVerb} ${timeWord.english}?`);
      }
    });
  });

  periods.forEach(({ phrase }) => {
    actionInfinitives.forEach((verb) => {
      if (tengo && para) {
        addSentence(
          `${getCardQuestion(tengo)} ${phrase.indefinite} ${getCardQuestion(para)} ${getCardQuestion(verb)}.`,
          `I have ${phrase.englishIndefinite} to ${getPrimaryAnswer(verb).replace(/^to /i, '')}.`
        );
      }
    });
  });

  actionInfinitives.forEach((verb) => {
    const spanishVerb = getCardQuestion(verb);
    const englishVerb = getPrimaryAnswer(verb).replace(/^to /i, '');
    const tenerForm = VERB_FORMS.tener;

    if (tenerForm) {
      addSentence(`Tengo que ${spanishVerb}.`, `I have to ${englishVerb}.`);
      addSentence(`Tienes que ${spanishVerb}.`, `You have to ${englishVerb}.`);
    }

    if (tenerForm && timeWords.length) {
      timeWords.forEach((timeWord) => {
        addSentence(`Tienes que ${spanishVerb} ${timeWord.spanish}.`, `You have to ${englishVerb} ${timeWord.english}.`);
      });
    }
  });

  timeWords.forEach((timeWord) => {
    if (queHaces) {
      addSentence(`${getCardQuestion(queHaces)} ${timeWord.spanish}?`, `What are you doing ${timeWord.english}?`);
    }

    if (queQuieres) {
      addSentence(`${getCardQuestion(queQuieres)} ${timeWord.spanish}?`, `What do you want ${timeWord.english}?`);
    }
  });

  return sentences;
}

function getRoundCards(sourceCards) {
  return shuffleCards(sourceCards).slice(0, Math.min(ROUND_CARD_COUNT, sourceCards.length));
}

function getTranslatePromptCards(sourceCards) {
  const sentenceBank = getTranslateSentenceBank(sourceCards);

  if (sentenceBank.length < 3) {
    return [];
  }

  return shuffleCards(sentenceBank).map((sentence) => {
    const correctAnswer = getCardAnswer(sentence);
    const wrongAnswers = [];

    shuffleCards(sentenceBank).forEach((candidateSentence) => {
      const candidateAnswer = getCardAnswer(candidateSentence);

      if (
        wrongAnswers.length < 2 &&
        normalizeAnswer(candidateAnswer) !== normalizeAnswer(correctAnswer) &&
        !wrongAnswers.some((wrongAnswer) => normalizeAnswer(wrongAnswer) === normalizeAnswer(candidateAnswer))
      ) {
        wrongAnswers.push(candidateAnswer);
      }
    });

    return {
      ...sentence,
      options: shuffleCards([correctAnswer, ...wrongAnswers])
    };
  });
}

function getModeCards(sourceCards, quizMode) {
  if (quizMode === QUIZ_MODE.TRANSLATE) {
    return getTranslatePromptCards(sourceCards);
  }

  return quizMode === QUIZ_MODE.STREAK ? shuffleCards(sourceCards) : getRoundCards(sourceCards);
}

function isStreakMode(quizMode) {
  return STREAK_MODES.includes(quizMode);
}

function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function getSpanishVoice() {
  if (!canSpeak()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));

  return spanishVoices
    .map((voice) => {
      const name = voice.name.toLowerCase();
      const language = voice.lang.toLowerCase();
      let score = 0;

      if (language === 'es-es') {
        score += 8;
      } else if (language === 'es-mx' || language === 'es-us') {
        score += 6;
      } else {
        score += 3;
      }

      if (voice.localService) {
        score += 4;
      }

      if (name.includes('premium') || name.includes('enhanced') || name.includes('natural')) {
        score += 5;
      }

      if (['monica', 'paulina', 'marisol', 'luciana', 'elvira', 'jorge'].some((voiceName) => name.includes(voiceName))) {
        score += 3;
      }

      if (name.includes('google')) {
        score += 2;
      }

      return { voice, score };
    })
    .sort((first, second) => second.score - first.score)[0]?.voice ?? null;
}

function speakSpanish(text) {
  if (!canSpeak()) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const spanishVoice = getSpanishVoice();

  utterance.lang = 'es-ES';
  utterance.voice = spanishVoice;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function App() {
  const [view, setView] = useState(VIEW.HOME);
  const [baseCards, setBaseCards] = useState(FALLBACK_CARDS);
  const [customCards, setCustomCards] = useState(() => loadStoredCards(CUSTOM_CARDS_STORAGE_KEY));
  const [removedBaseCardKeys, setRemovedBaseCardKeys] = useState(() =>
    loadStoredCardKeys(REMOVED_BASE_CARDS_STORAGE_KEY)
  );
  const [sourceCards, setSourceCards] = useState(FALLBACK_CARDS);
  const [cards, setCards] = useState(() => shuffleCards(FALLBACK_CARDS));
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [quizMode, setQuizMode] = useState(QUIZ_MODE.NORMAL);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [lastRoundSummary, setLastRoundSummary] = useState(null);
  const [deckMessage, setDeckMessage] = useState('Loading questions...');
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [bestStreaker, setBestStreaker] = useState(() => loadBestStreaker());
  const [bestTranslator, setBestTranslator] = useState(() => loadBestTranslator());
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const playerNameInputRef = useRef(null);
  const nextButtonRef = useRef(null);
  const answerRef = useRef('');
  const roundResultsRef = useRef([]);
  const quizModeRef = useRef(QUIZ_MODE.NORMAL);
  const bestStreakRef = useRef(0);
  const currentStreakRef = useRef(0);

  const currentCard = cards[cardIndex];
  const visibleBaseCards = useMemo(
    () => baseCards.filter((card) => !removedBaseCardKeys.includes(getCardKey(card))),
    [baseCards, removedBaseCardKeys]
  );
  const progress = useMemo(() => (cards.length ? ((cardIndex + 1) / cards.length) * 100 : 0), [cardIndex, cards.length]);
  const normalLeaderboard = useMemo(
    () => leaderboard.filter((entry) => (entry.mode ?? QUIZ_MODE.NORMAL) === QUIZ_MODE.NORMAL),
    [leaderboard]
  );
  const translateSentenceCount = useMemo(() => getTranslateSentenceBank(sourceCards).length, [sourceCards]);
  const canStartQuiz = quizMode === QUIZ_MODE.TRANSLATE ? translateSentenceCount >= 3 : sourceCards.length > 0;

  useLayoutEffect(() => {
    if (!shellRef.current) {
      return undefined;
    }

    const isPlaying = view === VIEW.QUIZ;

    gsap.to(shellRef.current, {
      '--shell-width': isPlaying ? '820px' : '520px',
      duration: isPlaying ? 0.72 : 0.34,
      ease: isPlaying ? 'elastic.out(1, 0.58)' : 'power3.out'
    });

    return undefined;
  }, [view]);

  useEffect(() => {
    if (view === VIEW.QUIZ) {
      inputRef.current?.focus();
    }
  }, [cardIndex, view]);

  useEffect(() => {
    if (view === VIEW.HOME) {
      playerNameInputRef.current?.focus();
    }
  }, [view]);

  useEffect(() => {
    if (!canSpeak()) {
      setSpeechSupported(false);
      return undefined;
    }

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setSpeechSupported(true);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (view === VIEW.QUIZ && currentCard && speechSupported) {
      speakSpanish(getCardQuestion(currentCard));
    }
  }, [cardIndex, currentCard, speechSupported, view]);

  useEffect(() => {
    if (feedback?.type === 'wrong' || feedback?.type === 'missed') {
      nextButtonRef.current?.focus();
    }
  }, [feedback]);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    quizModeRef.current = quizMode;
  }, [quizMode]);

  useEffect(() => {
    currentStreakRef.current = currentStreak;
  }, [currentStreak]);

  useEffect(() => {
    bestStreakRef.current = bestStreak;
  }, [bestStreak]);

  function resetRound(nextSourceCards = sourceCards) {
    setSourceCards(nextSourceCards);
    setCards(getModeCards(nextSourceCards, quizModeRef.current));
    setCardIndex(0);
    setAnswer('');
    setScore(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSecondsLeft(ROUND_SECONDS);
    setFeedback(null);
    setRoundResults([]);
    roundResultsRef.current = [];
    currentStreakRef.current = 0;
    bestStreakRef.current = 0;
  }

  function addRoundResult(result) {
    const nextResults = [...roundResultsRef.current, result];

    roundResultsRef.current = nextResults;
    setRoundResults(nextResults);

    return nextResults;
  }

  function getRoundScore() {
    return isStreakMode(quizModeRef.current) ? bestStreakRef.current : score;
  }

  function recordBestStreaker(nextStreak, nextCorrectCount) {
    if (!isStreakMode(quizMode)) {
      return;
    }

    const nextBestRecord = {
      name: playerName.trim(),
      score: nextStreak,
      correct: nextCorrectCount,
      total: nextCorrectCount,
      date: new Date().toLocaleDateString()
    };

    if (quizMode === QUIZ_MODE.STREAK && nextStreak > (bestStreaker?.score ?? 0)) {
      setBestStreaker(nextBestRecord);
      saveBestStreaker(nextBestRecord);
    }

    if (quizMode === QUIZ_MODE.TRANSLATE && nextStreak > (bestTranslator?.score ?? 0)) {
      setBestTranslator(nextBestRecord);
      saveBestTranslator(nextBestRecord);
    }
  }

  function finishRound(finalScore, finalCorrectCount, finalResults) {
    const nextEntry = {
      name: playerName.trim(),
      mode: quizModeRef.current,
      score: finalScore,
      correct: finalCorrectCount,
      total: isStreakMode(quizModeRef.current) ? finalResults.length : cards.length,
      date: new Date().toLocaleDateString()
    };
    const nextLeaderboard = [nextEntry, ...leaderboard]
      .sort(compareLeaderboardEntries)
      .slice(0, 10);

    setLeaderboard(nextLeaderboard);
    saveLeaderboard(nextLeaderboard);
    setLastRoundSummary({
      name: playerName.trim(),
      mode: quizModeRef.current,
      score: finalScore,
      bestStreak: bestStreakRef.current,
      correct: finalCorrectCount,
      total: isStreakMode(quizModeRef.current) ? finalResults.length : cards.length,
      results: finalResults
    });
    resetRound(sourceCards);
    setPlayerName('');
    setNameDraft('');
    setView(VIEW.REVIEW);
  }

  function replaceCustomCards(nextCustomCards, nextBaseCards = visibleBaseCards) {
    const sanitizedCustomCards = sanitizeCards(nextCustomCards);
    const nextSourceCards = [...nextBaseCards, ...sanitizedCustomCards];

    saveCustomCards(sanitizedCustomCards);
    setCustomCards(sanitizedCustomCards);
    resetRound(nextSourceCards);
    setDeckMessage(`${nextSourceCards.length} questions ready.`);
  }

  useEffect(() => {
    async function loadCards() {
      const savedCustomCards = loadStoredCards(CUSTOM_CARDS_STORAGE_KEY);

      try {
        const response = await fetch(QUESTIONS_URL);

        if (!response.ok) {
          throw new Error(`Could not load ${QUESTIONS_URL}`);
        }

        const importedCards = sanitizeCards(await response.json());

        if (!importedCards.length) {
          throw new Error('No valid cards found');
        }

        const removedCardKeys = loadStoredCardKeys(REMOVED_BASE_CARDS_STORAGE_KEY);
        const nextBaseCards = importedCards.filter((card) => !removedCardKeys.includes(getCardKey(card)));
        const nextSourceCards = [...nextBaseCards, ...savedCustomCards];

        setBaseCards(importedCards);
        setCustomCards(savedCustomCards);
        setRemovedBaseCardKeys(removedCardKeys);
        resetRound(nextSourceCards);
        setDeckMessage(`${nextSourceCards.length} questions loaded.`);
      } catch (error) {
        const removedCardKeys = loadStoredCardKeys(REMOVED_BASE_CARDS_STORAGE_KEY);
        const nextBaseCards = FALLBACK_CARDS.filter((card) => !removedCardKeys.includes(getCardKey(card)));
        const nextSourceCards = [...nextBaseCards, ...savedCustomCards];

        setBaseCards(FALLBACK_CARDS);
        setCustomCards(savedCustomCards);
        setRemovedBaseCardKeys(removedCardKeys);
        resetRound(nextSourceCards);
        setDeckMessage(`${nextSourceCards.length} questions loaded.`);
      }
    }

    loadCards();
  }, []);

  useEffect(() => {
    if (view !== VIEW.QUIZ || !currentCard || feedback) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          const acceptedAnswers = getCardAnswers(currentCard);
          const finalCorrectCount = currentStreakRef.current;
          currentStreakRef.current = 0;
          setCurrentStreak(0);
          const nextResults = addRoundResult({
            question: getCardQuestion(currentCard),
            acceptedAnswers,
            userAnswer: answerRef.current.trim(),
            status: 'missed',
            points: 0,
            streak: 0
          });

          setFeedback({
            type: 'missed',
            text: `Time's up. Answer: ${acceptedAnswers.join(' / ')}`,
            results: nextResults
          });

          if (isStreakMode(quizModeRef.current)) {
            window.setTimeout(() => finishRound(bestStreakRef.current, finalCorrectCount, nextResults), 850);
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [currentCard, feedback, view]);

  function savePlayer(event) {
    event.preventDefault();

    const nextName = nameDraft.trim();

    if (!nextName || !canStartQuiz) {
      return;
    }

    setPlayerName(nextName);
    resetRound(sourceCards);
    setView(VIEW.QUIZ);
  }

  function goToNextCard(
    finalScore = getRoundScore(),
    finalCorrectCount = correctCount,
    finalResults = roundResultsRef.current
  ) {
    const isLastCard = cardIndex === cards.length - 1;

    if (isStreakMode(quizModeRef.current) && isLastCard) {
      setCards((currentCards) => [
        ...currentCards,
        ...getModeCards(sourceCards, quizModeRef.current)
      ]);
    }

    if (!isStreakMode(quizModeRef.current) && isLastCard) {
      finishRound(finalScore, finalCorrectCount, finalResults);
      return;
    }

    setAnswer('');
    setSecondsLeft(ROUND_SECONDS);
    setFeedback(null);
    setCardIndex((current) => current + 1);
  }

  function submitAnswer(userAnswer) {
    if (!userAnswer.trim() || feedback) {
      return;
    }

    const correctAnswers = getCardAnswers(currentCard);
    const answerMatch =
      quizMode === QUIZ_MODE.TRANSLATE
        ? correctAnswers.map(normalizeAnswer).includes(normalizeAnswer(userAnswer))
          ? 'exact'
          : 'wrong'
        : checkAnswerMatch(userAnswer, correctAnswers);

    if (answerMatch !== 'wrong') {
      const questionPoints = getQuestionPoints(answerMatch, secondsLeft);
      const nextScore = score + questionPoints;
      const nextStreak = currentStreak + 1;
      const nextBestStreak = Math.max(bestStreak, nextStreak);
      const nextRoundScore = isStreakMode(quizMode) ? nextBestStreak : nextScore;
      const nextCorrectCount = correctCount + 1;
      const nextResults = addRoundResult({
        question: getCardQuestion(currentCard),
        acceptedAnswers: correctAnswers,
        userAnswer: userAnswer.trim(),
        status: answerMatch,
        points: questionPoints,
        streak: nextStreak
      });

      setScore(nextScore);
      setCurrentStreak(nextStreak);
      setBestStreak(nextBestStreak);
      currentStreakRef.current = nextStreak;
      bestStreakRef.current = nextBestStreak;
      setCorrectCount(nextCorrectCount);
      recordBestStreaker(nextStreak, nextCorrectCount);
      setFeedback({
        type: answerMatch === 'exact' ? 'correct' : 'close',
        text:
          isStreakMode(quizMode)
            ? `${answerMatch === 'exact' ? 'Correct' : 'Close enough'}. Streak: ${nextStreak}.`
            : answerMatch === 'exact'
              ? `Correct. ${questionPoints} points added.`
              : `Close enough. ${questionPoints} points added.`
      });
      window.setTimeout(() => goToNextCard(nextRoundScore, nextCorrectCount, nextResults), 850);
      return;
    }

    currentStreakRef.current = 0;
    setCurrentStreak(0);
    const nextResults = addRoundResult({
      question: getCardQuestion(currentCard),
      acceptedAnswers: correctAnswers,
      userAnswer: userAnswer.trim(),
      status: 'wrong',
      points: 0,
      streak: 0
    });

    setFeedback({
      type: 'wrong',
      text: `Not quite. Answer: ${correctAnswers.join(' / ')}`,
      results: nextResults
    });

    if (isStreakMode(quizMode)) {
      window.setTimeout(() => finishRound(bestStreakRef.current, correctCount, nextResults), 850);
    }
  }

  function checkAnswer(event) {
    event.preventDefault();
    submitAnswer(answer);
  }

  function chooseTranslateOption(option) {
    submitAnswer(option);
  }

  function restartGame() {
    resetRound(sourceCards);
    setPlayerName('');
    setNameDraft('');
    setView(VIEW.HOME);
  }

  function resetLeaderboard() {
    setLeaderboard([]);
    setBestStreaker(null);
    setBestTranslator(null);
    window.localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
    window.localStorage.removeItem(BEST_STREAKER_STORAGE_KEY);
    window.localStorage.removeItem(BEST_TRANSLATOR_STORAGE_KEY);
  }

  function addCustomCard(event) {
    event.preventDefault();

    const nextCard = {
      question: newQuestion.trim(),
      answers: splitAnswerText(newAnswer)
    };

    if (!nextCard.question || !nextCard.answers.length) {
      return;
    }

    replaceCustomCards([...customCards, nextCard]);
    setNewQuestion('');
    setNewAnswer('');
  }

  function deleteCustomCard(indexToDelete) {
    replaceCustomCards(customCards.filter((_, index) => index !== indexToDelete));
  }

  function deleteBaseCard(cardToDelete) {
    const nextRemovedBaseCardKeys = [...new Set([...removedBaseCardKeys, getCardKey(cardToDelete)])];
    const nextBaseCards = baseCards.filter((card) => !nextRemovedBaseCardKeys.includes(getCardKey(card)));
    const nextSourceCards = [...nextBaseCards, ...customCards];

    saveRemovedBaseCardKeys(nextRemovedBaseCardKeys);
    setRemovedBaseCardKeys(nextRemovedBaseCardKeys);
    resetRound(nextSourceCards);
    setDeckMessage(`${nextSourceCards.length} questions ready.`);
  }

  function restoreBaseCards() {
    window.localStorage.removeItem(REMOVED_BASE_CARDS_STORAGE_KEY);
    setRemovedBaseCardKeys([]);
    resetRound([...baseCards, ...customCards]);
    setDeckMessage(`${baseCards.length + customCards.length} questions ready.`);
  }

  function downloadQuestionData() {
    const jsonContent = JSON.stringify(sourceCards, null, 2);
    const blob = new Blob([`${jsonContent}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'questions.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <section
        ref={shellRef}
        className={`quiz-shell ${view === VIEW.QUIZ ? 'is-playing' : ''}`}
        aria-label="Spanish flash card quiz"
      >
        {view === VIEW.QUIZ && (
          <button className="close-game-button" type="button" onClick={restartGame} aria-label="Close game">
            <X size={22} />
          </button>
        )}

        {view !== VIEW.QUIZ && (
          <header className="top-bar">
            <div>
              <div className="title-row">
                <h1>Spanish Quiz</h1>
              </div>
              <p className="deck-message">{deckMessage}</p>
            </div>
          </header>
        )}

        {view !== VIEW.QUIZ && (
          <nav className="screen-nav" aria-label="Quiz screens">
            <button className={view === VIEW.HOME ? 'active' : ''} type="button" onClick={() => setView(VIEW.HOME)}>
              <User size={18} />
              Home
            </button>
            <button
              className={view === VIEW.QUESTIONS ? 'active' : ''}
              type="button"
              onClick={() => setView(VIEW.QUESTIONS)}
            >
              <ListPlus size={18} />
              Manage
            </button>
            <button
              className={view === VIEW.LEADERBOARD ? 'active' : ''}
              type="button"
              onClick={() => setView(VIEW.LEADERBOARD)}
            >
              <Trophy size={18} />
              Scores
            </button>
          </nav>
        )}

        {view === VIEW.HOME && (
          <div className="mode-selector" aria-label="Quiz mode">
            <button
              className={quizMode === QUIZ_MODE.NORMAL ? 'active' : ''}
              type="button"
              onClick={() => setQuizMode(QUIZ_MODE.NORMAL)}
              aria-label="Normal mode"
              title="Normal mode"
            >
              <Trophy size={18} />
            </button>
            <button
              className={quizMode === QUIZ_MODE.STREAK ? 'active' : ''}
              type="button"
              onClick={() => setQuizMode(QUIZ_MODE.STREAK)}
              aria-label="Streak mode"
              title="Streak mode"
            >
              <Flame size={18} />
            </button>
            <button
              className={quizMode === QUIZ_MODE.TRANSLATE ? 'active' : ''}
              type="button"
              onClick={() => setQuizMode(QUIZ_MODE.TRANSLATE)}
              aria-label="Translate mode"
              title="Translate mode"
            >
              <Speech size={18} />
            </button>
          </div>
        )}

        {view === VIEW.HOME && (
          <section className="home-screen" aria-label="Player setup">
            <form className="player-form" onSubmit={savePlayer}>
              <label htmlFor="player-name">Player name</label>
              <div className="answer-row">
                <input
                  ref={playerNameInputRef}
                  id="player-name"
                  type="text"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  autoComplete="name"
                />
                <button type="submit" disabled={!canStartQuiz}>
                  <Play size={18} />
                  Start
                </button>
              </div>
              {quizMode === QUIZ_MODE.TRANSLATE && translateSentenceCount < 3 && (
                <p className="mode-note">Add more nouns, verbs, or time words in Manage to unlock Translate mode.</p>
              )}
            </form>
          </section>
        )}

        {view === VIEW.QUIZ && (
          <>
            <div className={`stats ${isStreakMode(quizMode) ? 'is-streak' : ''}`} aria-label="Game stats">
              <div>
                <span>Player</span>
                <strong>{playerName || 'Guest'}</strong>
              </div>
              <div>
                <span>{isStreakMode(quizMode) ? 'Streak' : 'Score'}</span>
                <strong>
                  {isStreakMode(quizMode) && <Flame size={18} />}
                  {isStreakMode(quizMode) ? currentStreak : score}
                </strong>
              </div>
              {!isStreakMode(quizMode) && (
                <div>
                  <span>Card</span>
                  <strong>
                    {cardIndex + 1}/{cards.length}
                  </strong>
                </div>
              )}
              <div className={secondsLeft <= 3 ? 'urgent' : ''}>
                <span>Time</span>
                <strong>
                  <Timer size={18} />
                  {secondsLeft}s
                </strong>
              </div>
            </div>

            {!isStreakMode(quizMode) && (
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <article className="flash-card">
              {speechSupported && (
                <button
                  className="speak-button"
                  type="button"
                  onClick={() => speakSpanish(getCardQuestion(currentCard))}
                  aria-label="Speak Spanish word"
                  title="Speak Spanish word"
                >
                  <Volume2 size={20} />
                </button>
              )}
              <span>{quizMode === QUIZ_MODE.TRANSLATE ? 'Translate' : 'Question'}</span>
              <p>{getCardQuestion(currentCard)}</p>
            </article>

            <div className="answer-stack">
              {quizMode === QUIZ_MODE.TRANSLATE ? (
                <div className="answer-options" aria-label="Translation options">
                  {currentCard.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => chooseTranslateOption(option)}
                      disabled={Boolean(feedback)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <form className="answer-form" onSubmit={checkAnswer}>
                  <label htmlFor="answer">Answer</label>
                  <div className="answer-row">
                    <input
                      ref={inputRef}
                      id="answer"
                      type="text"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Type the English word"
                      autoComplete="off"
                      disabled={Boolean(feedback)}
                    />
                    <button type="submit" disabled={Boolean(feedback)}>
                      Check
                    </button>
                  </div>
                </form>
              )}

              {feedback && (
                <div className={`feedback ${feedback.type}`} role="status">
                  {feedback.type === 'correct' || feedback.type === 'close' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                  <span>{feedback.text}</span>
                  {!isStreakMode(quizMode) && feedback.type !== 'correct' && feedback.type !== 'close' && (
                    <button
                      ref={nextButtonRef}
                      type="button"
                      onClick={() => goToNextCard(undefined, correctCount, feedback.results)}
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {view === VIEW.QUESTIONS && (
          <section className="card-editor" aria-label="Manage questions">
            <div className="editor-heading">
              <h2>Manage words</h2>
              <span>{sourceCards.length} active</span>
            </div>

            <button
              className="download-questions-button"
              type="button"
              onClick={downloadQuestionData}
              disabled={!sourceCards.length}
            >
              <Download size={18} />
              Download JSON
            </button>

            <form className="editor-form" onSubmit={addCustomCard}>
              <label htmlFor="new-question">Question</label>
              <input
                id="new-question"
                type="text"
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="e.g. buenos dias"
                autoComplete="off"
              />

              <label htmlFor="new-answer">Answer</label>
              <div className="editor-row">
                <input
                  id="new-answer"
                  type="text"
                  value={newAnswer}
                  onChange={(event) => setNewAnswer(event.target.value)}
                  placeholder="e.g. good morning / good day"
                  autoComplete="off"
                />
                <button type="submit" aria-label="Add question">
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </form>

            <div className="editor-heading">
              <h2>Question data</h2>
              <span>{visibleBaseCards.length} showing</span>
            </div>

            {visibleBaseCards.length === 0 ? (
              <p className="empty-state">No question data words showing.</p>
            ) : (
              <div className="custom-card-list">
                {visibleBaseCards.map((card, index) => (
                  <div className="custom-card-item" key={`${getCardKey(card)}-${index}`}>
                    <div>
                      <strong>{getCardQuestion(card)}</strong>
                      <span>{getCardAnswers(card).join(' / ')}</span>
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteBaseCard(card)}
                      aria-label={`Remove ${getCardQuestion(card)}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {removedBaseCardKeys.length > 0 && (
              <button className="restore-questions-button" type="button" onClick={restoreBaseCards}>
                <RotateCcw size={18} />
                Restore question data
              </button>
            )}

            <div className="editor-heading">
              <h2>Added words</h2>
              <span>{customCards.length} saved</span>
            </div>

            {customCards.length === 0 ? (
              <p className="empty-state">No added words yet.</p>
            ) : (
              <div className="custom-card-list">
                {customCards.map((card, index) => (
                  <div className="custom-card-item" key={`${card.question}-${getCardAnswer(card)}-${index}`}>
                    <div>
                      <strong>{card.question}</strong>
                      <span>{getCardAnswers(card).join(' / ')}</span>
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteCustomCard(index)}
                      aria-label={`Delete ${card.question}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === VIEW.REVIEW && lastRoundSummary && (
          <section className="review-screen" aria-label="Quiz review">
            <div className="editor-heading">
              <h2>Review</h2>
              <span>
                {lastRoundSummary.correct}/{lastRoundSummary.total} correct
              </span>
            </div>

            <div className="review-summary">
              <div>
                <span>Player</span>
                <strong>{lastRoundSummary.name}</strong>
              </div>
              <div>
                <span>{isStreakMode(lastRoundSummary.mode) ? 'Streak' : 'Score'}</span>
                <strong>{lastRoundSummary.score}</strong>
              </div>
            </div>

            <div className="review-list">
              {lastRoundSummary.results.map((result, index) => (
                <div className={`review-row ${result.status}`} key={`${result.question}-${index}`}>
                  {result.status === 'exact' || result.status === 'close' ? (
                    <CheckCircle2 size={21} />
                  ) : (
                    <XCircle size={21} />
                  )}
                  <div>
                    <strong>{result.question}</strong>
                    <span>
                      You: {result.userAnswer || 'No answer'} · Answer: {result.acceptedAnswers.join(' / ')}
                    </span>
                  </div>
                  {!isStreakMode(lastRoundSummary.mode) && <b>{result.points}</b>}
                </div>
              ))}
            </div>

            <div className="home-actions">
              <button type="button" onClick={() => setView(VIEW.HOME)}>
                <Play size={18} />
                New game
              </button>
              <button type="button" onClick={() => setView(VIEW.LEADERBOARD)}>
                <Trophy size={18} />
                Leaderboard
              </button>
            </div>
          </section>
        )}

        {view === VIEW.LEADERBOARD && (
          <section className="leaderboard" aria-label="Leaderboard">
            <div className="editor-heading">
              <h2>Leaderboard</h2>
              <span>Top 10</span>
            </div>

            {bestStreaker && (
              <div className="best-streaker">
                <div>
                  <span>Best streaker</span>
                  <strong>{bestStreaker.name}</strong>
                  <small>
                    {bestStreaker.correct}/{bestStreaker.total} correct - {bestStreaker.date}
                  </small>
                </div>
                <b>
                  <Flame size={20} />
                  {bestStreaker.score}
                </b>
              </div>
            )}

            {bestTranslator && (
              <div className="best-streaker">
                <div>
                  <span>Best translator</span>
                  <strong>{bestTranslator.name}</strong>
                  <small>
                    {bestTranslator.correct}/{bestTranslator.total} correct - {bestTranslator.date}
                  </small>
                </div>
                <b>
                  <Speech size={20} />
                  {bestTranslator.score}
                </b>
              </div>
            )}

            {normalLeaderboard.length === 0 ? (
              <p className="empty-state">No scores yet.</p>
            ) : (
              <div className="leaderboard-list">
                {normalLeaderboard.map((entry, index) => (
                  <div className="leaderboard-row" key={`${entry.name}-${entry.score}-${entry.date}-${index}`}>
                    <strong>{index + 1}</strong>
                    <div>
                      <span>{entry.name}</span>
                      <small>
                        {entry.correct}/{entry.total} correct - {entry.date}
                      </small>
                    </div>
                    <b>{entry.score}</b>
                  </div>
                ))}
              </div>
            )}

            {leaderboard.length > 0 && (
              <button className="reset-leaderboard-button" type="button" onClick={resetLeaderboard}>
                <Trash2 size={18} />
                Reset leaderboard
              </button>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
