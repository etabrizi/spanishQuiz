import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getTenseTranslations } from '../src/tense-translations.mjs';
import { orderTranslateCards } from '../src/card-order.mjs';
import { buildTranslationOptions } from '../src/translation-options.mjs';

const words = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url)))
  .map((card) => card.question.toLowerCase());
const tenses = getTenseTranslations(words);
const basics = Array.from({ length: 40 }, (_, i) => ({ question: `Quiero comer en mi casa ${i}.` }));

test('shipped vocabulary provides both tenses with usable answer choices', () => {
  assert.equal(tenses.length, 12);
  for (const card of tenses) {
    const options = buildTranslationOptions(card.answers, tenses.map((entry) => entry.answers[0]));
    assert.equal(new Set(options).size, 3);
    assert.ok(options.includes(card.answers[0]));
  }
  assert.deepEqual(getTenseTranslations([]), []);
  assert.deepEqual(getTenseTranslations(['comer', 'restaurante']).map((card) => card.tense), ['past', 'future']);
});

test('new tenses start exactly at question 10 and alternate among regular questions', () => {
  for (const random of [() => 0, () => 0.5, () => 0.99]) {
    const deck = [...basics, ...tenses];
    const ordered = orderTranslateCards(deck, tenses.map((card) => card.question), (card) => card.question, random);
    assert.ok(ordered.slice(0, 9).every((card) => !card.tense));
    for (let i = 0; i < tenses.length; i += 1) {
      assert.equal(ordered[9 + i * 3].tense, i % 2 ? 'future' : 'past');
    }
    assert.equal(new Set(ordered).size, ordered.length);
    assert.equal(ordered.length, deck.length);
  }
});

test('small edited decks never introduce advanced tenses before question 10', () => {
  const ordered = orderTranslateCards([...basics.slice(0, 8), ...tenses], [], (card) => card.question);
  assert.equal(ordered.length, 8);
  assert.ok(ordered.every((card) => !card.tense));
});
