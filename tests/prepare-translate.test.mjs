import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('built background worker preserves questions and produces usable answer choices', async () => {
  const directory = new URL('../dist/assets/', import.meta.url);
  const filename = (await readdir(directory)).find((name) => name.startsWith('prepare-translate.worker-'));
  assert.ok(filename, 'production build includes the preparation worker');
  let response;
  const self = { postMessage: (value) => { response = value; } };
  vm.runInNewContext(await readFile(new URL(filename, directory), 'utf8'), { self });
  const cards = [
    { question: 'Queremos comer.', answers: ['We want to eat.'] },
    { question: 'Ellos tienen comida.', answers: ['They have food.'] },
    { question: 'Voy a casa.', answers: ['I am going home.'] }
  ];
  self.onmessage({ data: cards });
  assert.equal(response.error, undefined);
  assert.equal(response.cards.length, cards.length);
  response.cards.forEach((card, index) => {
    assert.equal(card.question, cards[index].question);
    assert.equal(card.options.length, 3);
    assert.equal(new Set(card.options).size, 3);
    assert.ok(card.options.includes(cards[index].answers[0]));
  });
  self.onmessage({ data: null });
  assert.equal(typeof response.error, 'string');
});
