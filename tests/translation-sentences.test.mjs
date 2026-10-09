import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { getLongTranslations } from '../src/long-translations.mjs';
import { getTenseTranslations } from '../src/tense-translations.mjs';
import * as rules from '../src/translation-rules.mjs';

// Exercise the actual sentence generator without mounting the React UI.
const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const generate = runInNewContext(
  source.slice(source.indexOf('const NOUN_PHRASES'), source.indexOf('function getRoundCards'))
    + '\ngetTranslateSentenceBank;',
  { ...rules, getLongTranslations, getTenseTranslations }
);
const vocabulary = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url)));
const sentences = generate(vocabulary);
const english = sentences.map((card) => card.answers[0]);

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
