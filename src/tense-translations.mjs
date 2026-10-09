// Reviewed conjugations and complete translations, gated by deck vocabulary.
const PAIRS = [
  ['past', 'Ayer compré comida.', 'Yesterday I bought food.', ['ayer', 'comprar', 'comida']],
  ['past', 'Ella habló con mi familia.', 'She spoke with my family.', ['hablar', 'familia']],
  ['past', 'Comimos en el restaurante.', 'We ate at the restaurant.', ['comer', 'restaurante']],
  ['past', 'Ellos fueron a la playa.', 'They went to the beach.', ['ir', 'playa']],
  ['past', 'No pude encontrar mi teléfono.', 'I could not find my phone.', ['puedo', 'encontrar', 'teléfono']],
  ['past', 'Ayer terminamos el trabajo antes de comer.', 'Yesterday we finished the work before eating.', ['ayer', 'terminar', 'trabajo', 'comer']],
  ['future', 'Mañana compraré comida.', 'Tomorrow I will buy food.', ['mañana', 'comprar', 'comida']],
  ['future', 'Ella hablará con mi familia.', 'She will speak with my family.', ['hablar', 'familia']],
  ['future', 'Comeremos en el restaurante.', 'We will eat at the restaurant.', ['comer', 'restaurante']],
  ['future', 'Ellos irán a la playa.', 'They will go to the beach.', ['ir', 'playa']],
  ['future', 'Te llamaré después del trabajo.', 'I will call you after work.', ['llamar', 'trabajo']],
  ['future', 'Mañana tendremos que salir temprano de casa.', 'Tomorrow we will have to leave home early.', ['mañana', 'tener', 'salir', 'temprano', 'casa']]
];

export function getTenseTranslations(availableWords) {
  const words = new Set(availableWords);
  return PAIRS.filter(([, , , required]) => required.every((word) => words.has(word)))
    .map(([tense, question, answer]) => ({ tense, question, answers: [answer], options: [] }));
}
