import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  ListPlus,
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
const LEADERBOARD_STORAGE_KEY = 'spanish-quiz-leaderboard';
const VIEW = {
  HOME: 'home',
  QUIZ: 'quiz',
  QUESTIONS: 'questions',
  REVIEW: 'review',
  LEADERBOARD: 'leaderboard'
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

function getCardAnswers(card) {
  const rawAnswers = card.answers ?? card.answer ?? card.english;
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];

  return answers.map((answer) => String(answer ?? '').trim()).filter(Boolean);
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

function loadStoredCards(key) {
  try {
    return sanitizeCards(JSON.parse(window.localStorage.getItem(key) ?? '[]'));
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
      .sort((first, second) => second.score - first.score)
      .slice(0, 10);
  } catch (error) {
    return [];
  }
}

function saveCustomCards(cards) {
  window.localStorage.setItem(CUSTOM_CARDS_STORAGE_KEY, JSON.stringify(cards));
}

function saveLeaderboard(scores) {
  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
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

function shuffleCards(cards) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function getRoundCards(sourceCards) {
  return shuffleCards(sourceCards).slice(0, Math.min(ROUND_CARD_COUNT, sourceCards.length));
}

function App() {
  const [view, setView] = useState(VIEW.HOME);
  const [baseCards, setBaseCards] = useState(FALLBACK_CARDS);
  const [customCards, setCustomCards] = useState(() => loadStoredCards(CUSTOM_CARDS_STORAGE_KEY));
  const [sourceCards, setSourceCards] = useState(FALLBACK_CARDS);
  const [cards, setCards] = useState(() => shuffleCards(FALLBACK_CARDS));
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState(null);
  const [roundResults, setRoundResults] = useState([]);
  const [lastRoundSummary, setLastRoundSummary] = useState(null);
  const [deckMessage, setDeckMessage] = useState('Loading questions...');
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const playerNameInputRef = useRef(null);
  const nextButtonRef = useRef(null);
  const answerRef = useRef('');
  const roundResultsRef = useRef([]);

  const currentCard = cards[cardIndex];
  const progress = useMemo(() => ((cardIndex + 1) / cards.length) * 100, [cardIndex, cards.length]);

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

  function resetRound(nextSourceCards = sourceCards) {
    setSourceCards(nextSourceCards);
    setCards(getRoundCards(nextSourceCards));
    setCardIndex(0);
    setAnswer('');
    setScore(0);
    setCorrectCount(0);
    setSecondsLeft(ROUND_SECONDS);
    setFeedback(null);
    setRoundResults([]);
    roundResultsRef.current = [];
  }

  function addRoundResult(result) {
    const nextResults = [...roundResultsRef.current, result];

    roundResultsRef.current = nextResults;
    setRoundResults(nextResults);

    return nextResults;
  }

  function finishRound(finalScore, finalCorrectCount, finalResults) {
    const nextEntry = {
      name: playerName.trim(),
      score: finalScore,
      correct: finalCorrectCount,
      total: cards.length,
      date: new Date().toLocaleDateString()
    };
    const nextLeaderboard = [nextEntry, ...leaderboard]
      .sort((first, second) => second.score - first.score)
      .slice(0, 10);

    setLeaderboard(nextLeaderboard);
    saveLeaderboard(nextLeaderboard);
    setLastRoundSummary({
      name: playerName.trim(),
      score: finalScore,
      correct: finalCorrectCount,
      total: cards.length,
      results: finalResults
    });
    resetRound(sourceCards);
    setPlayerName('');
    setNameDraft('');
    setView(VIEW.REVIEW);
  }

  function replaceCustomCards(nextCustomCards, nextBaseCards = baseCards) {
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

        const nextSourceCards = [...importedCards, ...savedCustomCards];

        setBaseCards(importedCards);
        setCustomCards(savedCustomCards);
        resetRound(nextSourceCards);
        setDeckMessage(`${nextSourceCards.length} questions loaded.`);
      } catch (error) {
        const nextSourceCards = [...FALLBACK_CARDS, ...savedCustomCards];

        setBaseCards(FALLBACK_CARDS);
        setCustomCards(savedCustomCards);
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
          const nextResults = addRoundResult({
            question: getCardQuestion(currentCard),
            acceptedAnswers,
            userAnswer: answerRef.current.trim(),
            status: 'missed',
            points: 0
          });

          setFeedback({
            type: 'missed',
            text: `Time's up. Answer: ${acceptedAnswers.join(' / ')}`,
            results: nextResults
          });
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

    if (!nextName) {
      return;
    }

    setPlayerName(nextName);
    setView(VIEW.QUIZ);
  }

  function goToNextCard(
    finalScore = score,
    finalCorrectCount = correctCount,
    finalResults = roundResultsRef.current
  ) {
    const isLastCard = cardIndex === cards.length - 1;

    if (isLastCard) {
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
      const nextCorrectCount = correctCount + 1;
      const nextResults = addRoundResult({
        question: getCardQuestion(currentCard),
        acceptedAnswers: correctAnswers,
        userAnswer: answer.trim(),
        status: answerMatch,
        points: questionPoints
      });

      setScore(nextScore);
      setCorrectCount(nextCorrectCount);
      setFeedback({
        type: answerMatch === 'exact' ? 'correct' : 'close',
        text:
          answerMatch === 'exact'
            ? `Correct. ${questionPoints} points added.`
            : `Close enough. ${questionPoints} points added.`
      });
      window.setTimeout(() => goToNextCard(nextScore, nextCorrectCount, nextResults), 850);
      return;
    }

    const nextResults = addRoundResult({
      question: getCardQuestion(currentCard),
      acceptedAnswers: correctAnswers,
      userAnswer: answer.trim(),
      status: 'wrong',
      points: 0
    });

    setFeedback({
      type: 'wrong',
      text: `Not quite. Answer: ${correctAnswers.join(' / ')}`,
      results: nextResults
    });
  }

  function restartGame() {
    resetRound(sourceCards);
    setPlayerName('');
    setNameDraft('');
    setView(VIEW.HOME);
  }

  function resetLeaderboard() {
    setLeaderboard([]);
    window.localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  }

  function addCustomCard(event) {
    event.preventDefault();

    const nextCard = {
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };

    if (!nextCard.question || !nextCard.answer) {
      return;
    }

    replaceCustomCards([...customCards, nextCard]);
    setNewQuestion('');
    setNewAnswer('');
  }

  function deleteCustomCard(indexToDelete) {
    replaceCustomCards(customCards.filter((_, index) => index !== indexToDelete));
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
              Add
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
                <button type="submit">
                  <Play size={18} />
                  Start
                </button>
              </div>
            </form>
          </section>
        )}

        {view === VIEW.QUIZ && (
          <>
            <div className="stats" aria-label="Game stats">
              <div>
                <span>Player</span>
                <strong>{playerName || 'Guest'}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{score}</strong>
              </div>
              <div>
                <span>Card</span>
                <strong>
                  {cardIndex + 1}/{cards.length}
                </strong>
              </div>
              <div className={secondsLeft <= 3 ? 'urgent' : ''}>
                <span>Time</span>
                <strong>
                  <Timer size={18} />
                  {secondsLeft}s
                </strong>
              </div>
            </div>

            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

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
                {feedback.type !== 'correct' && feedback.type !== 'close' && (
                  <button ref={nextButtonRef} type="button" onClick={() => goToNextCard(score, correctCount, feedback.results)}>
                    Next
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {view === VIEW.QUESTIONS && (
          <section className="card-editor" aria-label="Add custom questions">
            <div className="editor-heading">
              <h2>Add questions</h2>
              <span>{customCards.length} saved</span>
            </div>

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
                  placeholder="e.g. good morning"
                  autoComplete="off"
                />
                <button type="submit" aria-label="Add question">
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </form>

            {customCards.length > 0 && (
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
                <span>Score</span>
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
                  <b>{result.points}</b>
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
