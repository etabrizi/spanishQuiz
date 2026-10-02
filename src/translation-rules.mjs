// Only reviewed human actions that work without an object belong in the
// generic want/need/can/have-to templates. Unknown verbs fail closed;
// weather, reflexives, and verbs needing complements use complete sentences.
const STANDALONE_ACTIONS = new Set([
  'ir', 'venir', 'comer', 'beber', 'hablar', 'ayudar', 'pagar',
  'parar', 'escuchar', 'dormir', 'caminar', 'correr', 'trabajar',
  'preguntar', 'responder', 'leer', 'escribir', 'aprender',
  'entrar', 'salir', 'pensar', 'jugar', 'cocinar', 'limpiar',
  'viajar', 'conducir', 'nadar'
]);

export const isStandaloneAction = (verb) => STANDALONE_ACTIONS.has(verb);

const POSSESSIONS = ['casa', 'agua', 'comida', 'trabajo', 'telefono',
  'dinero', 'coche', 'mesa', 'silla', 'ropa', 'zapatos'];
const NOUNS_BY_TEMPLATE = {
  tengo: new Set([...POSSESSIONS, 'amigo', 'familia', 'problema', 'tiempo']),
  quiero: new Set(POSSESSIONS),
  necesito: new Set(POSSESSIONS)
};

export const canUseNoun = (template, noun) => NOUNS_BY_TEMPLATE[template]?.has(noun) ?? false;

export const DESTINATIONS = {
  casa: { spanish: 'a casa', english: 'home' },
  restaurante: { spanish: 'al restaurante', english: 'to the restaurant' },
  calle: { spanish: 'a la calle', english: 'to the street' },
  tienda: { spanish: 'a la tienda', english: 'to the shop' },
  trabajo: { spanish: 'al trabajo', english: 'to work' }
};
