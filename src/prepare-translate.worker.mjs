import { buildTranslationOptions } from './translation-options.mjs';

self.onmessage = ({ data: sentences }) => {
  try {
    const answerBank = sentences.map((card) => card.answers[0]);
    const cards = sentences.map((card) => ({
      ...card,
      options: buildTranslationOptions(card.answers, answerBank)
    }));
    self.postMessage({ cards });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
