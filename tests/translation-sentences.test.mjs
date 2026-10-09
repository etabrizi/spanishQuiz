import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { getLongTranslations } from '../src/long-translations.mjs';
import { getTenseTranslations } from '../src/tense-translations.mjs';
import { getAdvancedTranslations } from '../src/advanced-translations.mjs';
import * as rules from '../src/translation-rules.mjs';
import { orderTranslateCards, getTranslationSeconds } from '../src/card-order.mjs';

// Exercise the actual sentence generator without mounting the React UI.
const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const generate = runInNewContext(
  source.slice(source.indexOf('const NOUN_PHRASES'), source.indexOf('function getRoundCards'))
    + '\ngetTranslateSentenceBank;',
  { ...rules, getLongTranslations, getTenseTranslations, getAdvancedTranslations }
);
const vocabulary = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url)));
const sentences = generate(vocabulary);
const english = sentences.map((card) => card.answers[0]);

test('full translation deck advances at 11, 21, 31 and 41 even with flagged tense cards', () => {
  for (const random of [() => 0, () => 0.5, () => 0.99]) {
    const ordered = orderTranslateCards(sentences, sentences.filter((card) => card.tense || card.translationLevel).map((card) => card.question), (card) => card.question, random);
    assert.equal(ordered.length, 65);
    assert.ok(ordered.slice(0, 9).every((card) => card.question.split(/\s+/).length <= 3));
    assert.ok(ordered.slice(10, 20).every((card) => card.tense || card.question.split(/\s+/).length <= 5));
    assert.ok(ordered.slice(20, 30).every((card) => card.tense || card.question.split(/\s+/).length >= 6));
    assert.ok(ordered.slice(0, 30).every((card) => !card.translationLevel));
    assert.ok(ordered.slice(30, 40).every((card) => card.translationLevel === 3));
    assert.ok(ordered.slice(40, 60).every((card) => card.translationLevel === 4));
    assert.ok(ordered.slice(60).every((card) => card.translationLevel === 6));
    assert.ok(ordered.slice(60).some((card) => card.question === 'Si hubiera sabido que llegarías tan tarde habría preparado la comida antes de salir.'));
    assert.equal(getTranslationSeconds(60), 40);
    assert.equal(getTranslationSeconds(64), 40);
    assert.equal(new Set(ordered.map((card) => card.question)).size, ordered.length);
  }
});

test('translation timer gains five seconds per ten questions without a cap', () => {
  for (let stage = 0; stage < 10; stage += 1) {
    assert.equal(getTranslationSeconds(stage * 10), 10 + stage * 5);
    assert.equal(getTranslationSeconds(stage * 10 + 9), 10 + stage * 5);
  }
});

test('advanced translations respect vocabulary and stay out of short edited decks', () => {
  assert.deepEqual(getAdvancedTranslations([]), []);
  const advanced = getAdvancedTranslations(vocabulary.map((card) => card.question.toLowerCase()));
  assert.equal(advanced.length, 37);
  const basic = sentences.filter((card) => !card.translationLevel && !card.tense).slice(0, 8);
  const ordered = orderTranslateCards([...basic, ...advanced], [], (card) => card.question);
  assert.equal(ordered.length, 8);
  assert.ok(ordered.every((card) => !card.translationLevel));
});

test('generic templates exclude weather, incomplete actions, and unreviewed verbs', () => {
  for (const verb of ['rain', 'put', 'find', 'use', 'need', 'get up']) {
    assert.ok(!english.includes(`They can ${verb}.`), verb);
    assert.ok(!english.includes(`I want to ${verb}.`), verb);
  }
  const custom = generate([...vocabulary, { question: 'nevar', answers: ['to snow'] }]);
  assert.ok(!custom.some((card) => card.question.includes('nevar')));
  assert.ok(english.includes('They can swim.'));
});

test('noun and time combinations avoid known unnatural phrases', () => {
  assert.ok(!english.includes('I want the problem.'));
  assert.ok(!english.includes('They need the head.'));
  assert.ok(!english.some((answer) => / always[.?]$/.test(answer)));
  assert.ok(english.includes('I have a problem.'));
});

test('destinations use natural prepositions and preserve enough questions in every tier', () => {
  assert.equal(sentences.find((card) => card.question === 'Voy al restaurante.').answers[0], 'I am going to the restaurant.');
  assert.equal(sentences.find((card) => card.question === 'Voy a casa.').answers[0], 'I am going home.');
  const counts = [0, 0, 0];
  for (const card of sentences) {
    const length = card.question.split(/\s+/).length;
    counts[length <= 3 ? 0 : length <= 5 ? 1 : 2] += 1;
  }
  assert.ok(counts.every((count) => count >= 10), counts.join(', '));
  assert.ok(english.includes('We want to learn to cook at home.'));
});
