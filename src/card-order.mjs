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

// Increase sentence length after each ten correct answers. A wrong answer ends
// Translate mode, so deck position also represents the player's streak.
export function orderTranslateCards(cards, difficultKeys, getQuestionKey, random = Math.random) {
  const tensePools = ['past', 'future'].map((tense) => orderPracticeCards(
    cards.filter((card) => card.tense === tense), difficultKeys, getQuestionKey, random
  ));
  const tiers = [[], [], []];
  for (const card of cards) {
    if (card.tense === 'past' || card.tense === 'future') continue;
    const words = card.question.trim().split(/\s+/).length;
    tiers[words <= 3 ? 0 : words <= 5 ? 1 : 2].push(card);
  }
  const pools = tiers.map((tier) => orderPracticeCards(tier, difficultKeys, getQuestionKey, random));
  const ordered = [];
  for (let tier = 0; tier < pools.length; tier += 1) {
    // Edited decks may lack a tier. Use the closest available length without
    // duplicating questions, preferring a harder tier when possible.
    const candidates = [tier, ...[0, 1, 2].filter((index) => index > tier),
      ...[2, 1, 0].filter((index) => index < tier)];
    let remaining = tier === 2 ? Infinity : 10;
    for (const index of candidates) {
      const selected = pools[index].splice(0, remaining);
      ordered.push(...selected);
      remaining -= selected.length;
      if (remaining === 0 || (tier === 2 && selected.length)) break;
    }
  }
  // Introduce conjugated tenses at question 10, then every third question.
  // Alternate past and future, preserving flagged priority within each tense.
  // Short edited decks cannot reach question 10, so retain their basic cards.
  let turn = 0;
  for (let index = 9; index <= ordered.length; index += 3) {
    const pool = tensePools[turn % 2].length ? tensePools[turn % 2] : tensePools[(turn + 1) % 2];
    if (!pool.length) break;
    ordered.splice(index, 0, pool.shift());
    turn += 1;
  }
  return ordered;
}
