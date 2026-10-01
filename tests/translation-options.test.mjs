import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildTranslationOptions } from '../src/translation-options.mjs';
import { getLongTranslations } from '../src/long-translations.mjs';

function random(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

test('long answers get similarly sized options that change small details', () => {
  const words = JSON.parse(readFileSync(new URL('../public/questions.json', import.meta.url)))
    .map((card) => card.question.toLowerCase());
  const cards = getLongTranslations(words);
  for (const card of cards) {
    for (let seed = 1; seed <= 20; seed++) {
      const options = buildTranslationOptions(card.answers, cards.map((entry) => entry.answers[0]), random(seed));
      assert.equal(options.length, 3, card.question);
      assert.equal(new Set(options).size, 3);
      assert.ok(options.includes(card.answers[0]));
      for (const option of options) {
        assert.ok(Math.abs(option.split(' ').length - card.answers[0].split(' ').length) <= 2, option);
      }
    }
  }
});

test('accepted alternatives are never offered as wrong answers', () => {
  const answers = ['I want to swim today.', 'I need to swim today.'];
  for (let seed = 1; seed <= 30; seed++) {
    const options = buildTranslationOptions(answers, ['I NEED TO SWIM TODAY!', 'I want to swim tomorrow.'], random(seed));
    assert.equal(options.filter((option) => answers.includes(option)).length, 1);
    assert.equal(options.length, 3);
  }
});

test('question wording and verb agreement survive substitutions', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const question = buildTranslationOptions(['Do you want to drink water after running with me?'], [], random(seed));
    assert.ok(question.every((option) => !/Do you (are|have to|need to)/.test(option)));
    const door = buildTranslationOptions(['Can you open the door before leaving?'], [], random(seed));
    assert.ok(door.every((option) => !option.includes('closed the door')));
  }
});

test('fallback favours similar translations and randomises the correct position', () => {
  const bank = ['She swims.', 'He runs.', 'We need to buy a new table tomorrow.'];
  const positions = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const options = buildTranslationOptions(['He swims.'], bank, random(seed));
    assert.deepEqual(new Set(options), new Set(['He swims.', 'She swims.', 'He runs.']));
    positions.add(options.indexOf('He swims.'));
  }
  assert.equal(positions.size, 3);
});

test('new user vocabulary is preserved in the closely matched choices', () => {
  const options = buildTranslationOptions(['I want to photograph wildlife today.'], [], random(7));
  assert.equal(options.length, 3);
  assert.ok(options.every((option) => option.includes('photograph wildlife')));
});
