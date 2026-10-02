// Complete sentence pairs keep longer questions natural instead of padding
// every short phrase with the same ending. Required words respect edited decks.
const LONG_TRANSLATIONS = [
  ['Nosotros queremos aprender a cocinar en casa.', 'We want to learn to cook at home.', ['aprender', 'cocinar', 'casa']],
  ['Ellas quieren comprar comida antes de volver a casa.', 'They want to buy food before going home.', ['comprar', 'comida', 'casa']],
  ['Nosotros podemos ayudar a limpiar la habitación.', 'We can help clean the room.', ['ayudar', 'limpiar', 'habitación']],
  ['Ellos necesitan salir temprano para llegar al aeropuerto.', 'They need to leave early to get to the airport.', ['salir', 'temprano', 'aeropuerto']],
  ['Nosotras vamos a escuchar música después del trabajo.', 'We are going to listen to music after work.', ['escuchar', 'música', 'trabajo']],
  ['Ellos tienen que terminar el trabajo antes de dormir.', 'They have to finish the work before sleeping.', ['terminar', 'trabajo', 'dormir']],
  ['Queremos hablar con ellos después del trabajo.', 'We want to talk with them after work.', ['querer', 'hablar', 'trabajo']],
  ['Ellas quieren comer con nosotros esta noche.', 'They want to eat with us tonight.', ['querer', 'comer', 'noche']],
  ['Tenemos que llevarles comida antes de salir.', 'We have to take them food before leaving.', ['tener', 'llevar', 'comida', 'salir']],
  ['Ellos nos ayudan a encontrar el hotel.', 'They help us find the hotel.', ['ayudar', 'encontrar', 'hotel']],
  ['Nosotras queremos ir con ellas a la playa.', 'We want to go with them to the beach.', ['querer', 'ir', 'playa']],
  ['Ellos van a esperar delante del restaurante.', 'They are going to wait in front of the restaurant.', ['ir', 'esperar', 'restaurante']],
  ['Quiero comer con mi familia esta noche.', 'I want to eat with my family tonight.', ['comer', 'familia', 'noche']],
  ['Necesito comprar comida antes de volver a casa.', 'I need to buy food before going home.', ['comprar', 'comida', 'casa']],
  ['¿Puedes abrir la ventana antes de salir?', 'Can you open the window before leaving?', ['abrir', 'ventana', 'salir']],
  ['Vamos a caminar por la ciudad mañana.', 'We are going to walk around the city tomorrow.', ['caminar', 'ciudad', 'mañana']],
  ['Mi amigo quiere aprender a cocinar en casa.', 'My friend wants to learn to cook at home.', ['amigo', 'aprender', 'cocinar']],
  ['No puedo encontrar la llave de mi habitación.', 'I cannot find the key to my room.', ['encontrar', 'llave', 'habitación']],
  ['La tienda está cerrada porque ya es tarde.', 'The shop is closed because it is already late.', ['tienda', 'cerrada', 'tarde']],
  ['Tengo que terminar el trabajo antes de dormir.', 'I have to finish the work before sleeping.', ['terminar', 'trabajo', 'dormir']],
  ['¿Quieres beber agua después de correr conmigo?', 'Do you want to drink water after running with me?', ['beber', 'agua', 'correr']],
  ['Estoy esperando a mi amigo delante del restaurante.', 'I am waiting for my friend in front of the restaurant.', ['esperar', 'amigo', 'restaurante']],
  ['El hotel está cerca de la estación.', 'The hotel is near the station.', ['hotel', 'cerca', 'estación']],
  ['Voy a llamar a mi familia esta tarde.', 'I am going to call my family this afternoon.', ['llamar', 'familia', 'tarde']],
  ['¿Dónde puedo comprar zapatos para mi niño?', 'Where can I buy shoes for my boy?', ['comprar', 'zapatos', 'niño']],
  ['Me gusta escuchar música mientras limpio la casa.', 'I like listening to music while I clean the house.', ['escuchar', 'música', 'limpiar']],
  ['Tenemos que salir temprano para llegar al aeropuerto.', 'We have to leave early to get to the airport.', ['salir', 'temprano', 'aeropuerto']],
  ['La comida está caliente y tengo mucha hambre.', 'The food is hot and I am very hungry.', ['comida', 'caliente', 'hambre']],
  ['¿Puedes ayudarme a llevar esta mesa al coche?', 'Can you help me carry this table to the car?', ['ayudar', 'mesa', 'coche']],
  ['Quiero vivir en un pueblo cerca del mar.', 'I want to live in a village near the sea.', ['vivir', 'pueblo', 'mar']],
  ['No entiendo por qué la puerta está abierta.', 'I do not understand why the door is open.', ['entender', 'puerta', 'abierto']],
  ['Mañana vamos a visitar otra ciudad juntos.', 'Tomorrow we are going to visit another city together.', ['mañana', 'ciudad', 'juntos']],
  ['Necesito una silla para sentarme al lado de la ventana.', 'I need a chair to sit next to the window.', ['silla', 'sentarse', 'ventana']],
  ['Mi familia quiere viajar a otro país este año.', 'My family wants to travel to another country this year.', ['familia', 'viajar', 'país']],
  ['¿Cuánto cuesta esta habitación para toda la semana?', 'How much does this room cost for the whole week?', ['cuánto', 'habitación', 'semana']],
  ['Voy a escribir a mi amigo después del trabajo.', 'I am going to write to my friend after work.', ['escribir', 'amigo', 'trabajo']],
  ['El niño está buscando sus zapatos debajo de la cama.', 'The boy is looking for his shoes under the bed.', ['niño', 'zapatos', 'cama']],
  ['Quiero leer algo antes de empezar a trabajar.', 'I want to read something before starting work.', ['leer', 'empezar', 'trabajar']],
  ['¿Sabes cómo llegar a la playa desde aquí?', 'Do you know how to get to the beach from here?', ['saber', 'llegar', 'playa']],
  ['No quiero conducir porque estoy muy cansado.', 'I do not want to drive because I am very tired.', ['conducir', 'estoy', 'cansado']],
  ['La mujer está hablando con alguien en la calle.', 'The woman is talking to someone in the street.', ['mujer', 'hablar', 'calle']],
  ['Tenemos comida para todos pero necesitamos más agua.', 'We have food for everyone but we need more water.', ['comida', 'necesitar', 'agua']],
  ['¿Puedes traer mi teléfono cuando vuelvas a casa?', 'Can you bring my phone when you come home?', ['traer', 'teléfono', 'casa']],
  ['Me gustaría aprender a nadar este año.', 'I would like to learn to swim this year.', ['aprender', 'nadar', 'año']],
  ['Hace frío fuera y quiero cerrar la puerta.', 'It is cold outside and I want to close the door.', ['frío', 'cerrar', 'puerta']],
  ['Primero vamos a comer y luego podemos jugar.', 'First we are going to eat and then we can play.', ['primero', 'comer', 'jugar']],
  ['No sé dónde dejé el dinero ayer.', 'I do not know where I left the money yesterday.', ['dejar', 'dinero', 'ayer']],
  ['¿Quieres quedarte aquí o prefieres volver a casa?', 'Do you want to stay here or would you prefer to go home?', ['quedarse', 'volver', 'casa']],
  ['La niña quiere aprender a leer y escribir.', 'The girl wants to learn to read and write.', ['niña', 'leer', 'escribir']],
  ['Tengo que levantarme temprano para ir al trabajo.', 'I have to get up early to go to work.', ['levantarse', 'temprano', 'trabajo']],
  ['Este restaurante es bueno pero es demasiado caro.', 'This restaurant is good but it is too expensive.', ['restaurante', 'bueno', 'caro']],
  ['¿Puedes decirme quién está esperando fuera del hotel?', 'Can you tell me who is waiting outside the hotel?', ['decir', 'esperar', 'hotel']]
];

export function getLongTranslations(availableWords) {
  const words = new Set(availableWords);
  return LONG_TRANSLATIONS
    .filter(([, , required]) => required.every((word) => words.has(word)))
    .map(([question, answer]) => ({ question, answers: [answer], options: [] }));
}
