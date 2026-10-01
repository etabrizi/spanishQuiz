import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getLongTranslations } from '../src/long-translations.mjs';
import { orderTranslateCards } from '../src/card-order.mjs';

const words = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url)))
  .map((card) => card.question.toLowerCase());

test('the shipped vocabulary provides varied complete long translations', () => {
  const cards = getLongTranslations(words);
  assert.ok(cards.length >= 40);
  assert.equal(new Set(cards.map((card) => card.question)).size, cards.length);
  const endings = new Set();
  for (const card of cards) {
    assert.ok(card.question.split(/\s+/).length >= 6, card.question);
    assert.ok(!card.question.includes('pero no tengo tiempo'));
    // Commas and slashes are answer separators in the quiz.
    assert.ok(!/[,/]/.test(card.answers[0]), card.answers[0]);
    endings.add(card.question.split(/\s+/).slice(-3).join(' '));
  }
  assert.ok(endings.size >= 30);
});

test('long translations respect removed vocabulary and return fresh cards', () => {
  assert.deepEqual(getLongTranslations([]), []);
  const selected = getLongTranslations(['comer', 'familia', 'noche']);
  assert.equal(selected.length, 1);
  selected[0].answers[0] = 'changed';
  assert.notEqual(getLongTranslations(words)[0].answers[0], 'changed');
});

test('varied long sentences remain in the stage after question 20', () => {
  const short = Array.from({ length: 10 }, (_, i) => ({ question: `Hola ${i}` }));
  const medium = Array.from({ length: 10 }, (_, i) => ({ question: `Voy a comer ${i}` }));
  const long = getLongTranslations(words);
  const ordered = orderTranslateCards([...short, ...medium, ...long], [], (card) => card.question);
  assert.deepEqual(new Set(ordered.slice(20)), new Set(long));
});
