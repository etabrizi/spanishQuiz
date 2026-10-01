import assert from 'node:assert/strict';
import test from 'node:test';
import { orderPracticeCards, orderTranslateCards } from '../src/card-order.mjs';

const key = (card) => card.question;
const cards = Array.from({ length: 30 }, (_, index) => ({ question: `card-${index}` }));
function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('a single flag can appear anywhere in the first ten cards', () => {
  const positions = new Set();
  for (let seed = 1; seed <= 200; seed += 1) {
    const ordered = orderPracticeCards(cards, ['card-0'], key, seededRandom(seed));
    const position = ordered.findIndex((card) => key(card) === 'card-0');
    assert.ok(position >= 0 && position < 10);
    positions.add(position);
  }
  assert.equal(positions.size, 10);
});

test('flags stay early without losing, repeating, or mutating cards', () => {
  for (const count of [0, 1, 5, 15, 30]) {
    const flags = cards.slice(0, count).map(key);
    const original = [...cards];
    const ordered = orderPracticeCards(cards, flags, key, seededRandom(42));
    assert.equal(ordered.length, cards.length);
    assert.equal(new Set(ordered).size, cards.length);
    assert.deepEqual(cards, original);
    assert.equal(ordered.slice(0, 10).filter((card) => flags.includes(key(card))).length,
      count === 30 ? 10 : Math.min(count, 9));
  }
});

test('empty and small decks work with absent or stale flags', () => {
  for (const deck of [[], cards.slice(0, 1), cards.slice(0, 3)]) {
    const ordered = orderPracticeCards(deck, ['card-0', 'deleted'], key, seededRandom(7));
    assert.deepEqual(new Set(ordered), new Set(deck));
    assert.equal(ordered.length, deck.length);
  }
});

const short = Array.from({ length: 30 }, (_, i) => ({ question: `Quiero aprender${i}.` }));
const medium = Array.from({ length: 30 }, (_, i) => ({ question: `Voy a aprender${i} ahora.` }));
const long = Array.from({ length: 30 }, (_, i) => ({ question: `Quiero aprender${i}, pero no tengo tiempo.` }));

test('Translate increases length on questions 11 and 21 and stays long thereafter', () => {
  const deck = [...short, ...medium, ...long];
  const original = [...deck];
  const ordered = orderTranslateCards(deck, [key(long[0]), key(medium[0]), key(short[0])], key, seededRandom(42));
  assert.equal(ordered.length, 50);
  assert.ok(ordered.slice(0, 10).every((card) => short.includes(card)));
  assert.ok(ordered.slice(10, 20).every((card) => medium.includes(card)));
  assert.ok(ordered.slice(20).every((card) => long.includes(card)));
  assert.ok(ordered.slice(0, 10).includes(short[0]));
  assert.ok(ordered.slice(10, 20).includes(medium[0]));
  assert.ok(ordered.slice(20, 30).includes(long[0]));
  assert.equal(new Set(ordered).size, ordered.length);
  assert.deepEqual(deck, original);
});

test('Translate supports small or edited decks with missing length tiers', () => {
  for (const deck of [[], short.slice(0, 2), medium, long, [...short.slice(0, 2), ...long.slice(0, 3)]]) {
    const ordered = orderTranslateCards(deck, ['deleted'], key, seededRandom(7));
    assert.equal(new Set(ordered).size, ordered.length);
    assert.deepEqual(new Set(ordered), new Set(deck));
  }
});
