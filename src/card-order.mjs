export function shuffleCards(cards, random = Math.random) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

export function orderPracticeCards(cards, difficultKeys, getQuestionKey, random = Math.random) {
  const difficult = new Set(difficultKeys);
  const flagged = [];
  const regular = [];
  for (const card of shuffleCards(cards, random)) {
    (difficult.has(getQuestionKey(card)) ? flagged : regular).push(card);
  }

  // Keep flags near the start, but randomize their positions among other cards.
  const early = [...flagged.splice(0, 9), ...regular.splice(0, 1)];
  early.push(...flagged.splice(0, 10 - early.length));
  early.push(...regular.splice(0, 10 - early.length));
  return [...shuffleCards(early, random), ...flagged, ...regular];
}
