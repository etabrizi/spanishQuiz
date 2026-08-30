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
  Timer,
  Trash2,
  Trophy,
  User,
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
const VIEW = {
  HOME: 'home',
  QUIZ: 'quiz',
  QUESTIONS: 'questions',
  REVIEW: 'review',
  LEADERBOARD: 'leaderboard'
};
const QUIZ_MODE = {
  NORMAL: 'normal',
  STREAK: 'streak'
};
const QUIZ_MODE_LABEL = {
  [QUIZ_MODE.NORMAL]: 'Normal',
  [QUIZ_MODE.STREAK]: 'Streak'
};

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
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

function getRoundCards(sourceCards) {
  return shuffleCards(sourceCards).slice(0, Math.min(ROUND_CARD_COUNT, sourceCards.length));
}

function getModeCards(sourceCards, quizMode) {
  return quizMode === QUIZ_MODE.STREAK ? shuffleCards(sourceCards) : getRoundCards(sourceCards);
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
  const [roundResults, setRoundResults] = useState([]);
  const [lastRoundSummary, setLastRoundSummary] = useState(null);
  const [deckMessage, setDeckMessage] = useState('Loading questions...');
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [bestStreaker, setBestStreaker] = useState(() => loadBestStreaker());
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
    return quizModeRef.current === QUIZ_MODE.STREAK ? bestStreakRef.current : score;
  }

  function recordBestStreaker(nextStreak, nextCorrectCount) {
    if (quizMode !== QUIZ_MODE.STREAK || nextStreak <= (bestStreaker?.score ?? 0)) {
      return;
    }

    const nextBestStreaker = {
      name: playerName.trim(),
      score: nextStreak,
      correct: nextCorrectCount,
      total: nextCorrectCount,
      date: new Date().toLocaleDateString()
    };

    setBestStreaker(nextBestStreaker);
    saveBestStreaker(nextBestStreaker);
  }

  function finishRound(finalScore, finalCorrectCount, finalResults) {
    const nextEntry = {
      name: playerName.trim(),
      mode: quizModeRef.current,
      score: finalScore,
      correct: finalCorrectCount,
      total: quizModeRef.current === QUIZ_MODE.STREAK ? finalResults.length : cards.length,
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
      total: quizModeRef.current === QUIZ_MODE.STREAK ? finalResults.length : cards.length,
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

          if (quizModeRef.current === QUIZ_MODE.STREAK) {
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

    if (!nextName || !sourceCards.length) {
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

    if (quizModeRef.current === QUIZ_MODE.STREAK && isLastCard) {
      setCards((currentCards) => [...currentCards, ...shuffleCards(sourceCards)]);
    }

    if (quizModeRef.current !== QUIZ_MODE.STREAK && isLastCard) {
      finishRound(finalScore, finalCorrectCount, finalResults);
      return;
    }

    setAnswer('');
    setSecondsLeft(ROUND_SECONDS);
    setFeedback(null);
    setCardIndex((current) => current + 1);
  }

  function checkAnswer(event) {
    event.preventDefault();

    if (!answer.trim() || feedback) {
      return;
    }

    const correctAnswers = getCardAnswers(currentCard);
    const answerMatch = checkAnswerMatch(answer, correctAnswers);

    if (answerMatch !== 'wrong') {
      const questionPoints = getQuestionPoints(answerMatch, secondsLeft);
      const nextScore = score + questionPoints;
      const nextStreak = currentStreak + 1;
      const nextBestStreak = Math.max(bestStreak, nextStreak);
      const nextRoundScore = quizMode === QUIZ_MODE.STREAK ? nextBestStreak : nextScore;
      const nextCorrectCount = correctCount + 1;
      const nextResults = addRoundResult({
        question: getCardQuestion(currentCard),
        acceptedAnswers: correctAnswers,
        userAnswer: answer.trim(),
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
          quizMode === QUIZ_MODE.STREAK
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
      userAnswer: answer.trim(),
      status: 'wrong',
      points: 0,
      streak: 0
    });

    setFeedback({
      type: 'wrong',
      text: `Not quite. Answer: ${correctAnswers.join(' / ')}`,
      results: nextResults
    });

    if (quizMode === QUIZ_MODE.STREAK) {
      window.setTimeout(() => finishRound(bestStreakRef.current, correctCount, nextResults), 850);
    }
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
    window.localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
    window.localStorage.removeItem(BEST_STREAKER_STORAGE_KEY);
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
                <button type="submit" disabled={!sourceCards.length}>
                  <Play size={18} />
                  Start
                </button>
              </div>
            </form>
          </section>
        )}

        {view === VIEW.QUIZ && (
          <>
            <div className={`stats ${quizMode === QUIZ_MODE.STREAK ? 'is-streak' : ''}`} aria-label="Game stats">
              <div>
                <span>Player</span>
                <strong>{playerName || 'Guest'}</strong>
              </div>
              <div>
                <span>{quizMode === QUIZ_MODE.STREAK ? 'Streak' : 'Score'}</span>
                <strong>
                  {quizMode === QUIZ_MODE.STREAK && <Flame size={18} />}
                  {quizMode === QUIZ_MODE.STREAK ? currentStreak : score}
                </strong>
              </div>
              {quizMode !== QUIZ_MODE.STREAK && (
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

            {quizMode !== QUIZ_MODE.STREAK && (
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            <article className="flash-card">
              <span>Question</span>
              <p>{getCardQuestion(currentCard)}</p>
            </article>

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

            {feedback && (
              <div className={`feedback ${feedback.type}`} role="status">
                {feedback.type === 'correct' || feedback.type === 'close' ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                <span>{feedback.text}</span>
                {quizMode !== QUIZ_MODE.STREAK && feedback.type !== 'correct' && feedback.type !== 'close' && (
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
                <span>{lastRoundSummary.mode === QUIZ_MODE.STREAK ? 'Best streak' : 'Score'}</span>
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
                  {lastRoundSummary.mode !== QUIZ_MODE.STREAK && <b>{result.points}</b>}
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

            {leaderboard.length === 0 ? (
              <p className="empty-state">No scores yet.</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <div className="leaderboard-row" key={`${entry.name}-${entry.score}-${entry.date}-${index}`}>
                    <strong>{index + 1}</strong>
                    <div>
                      <span>{entry.name}</span>
                      <small>
                        {QUIZ_MODE_LABEL[entry.mode] ?? QUIZ_MODE_LABEL[QUIZ_MODE.NORMAL]} - {entry.correct}/
                        {entry.total} correct - {entry.date}
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
