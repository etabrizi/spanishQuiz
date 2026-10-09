// Complete reviewed sentences introduce grammar beyond simple conjugations.
const SENTENCES = [
  [3, 'Cuando llegué a casa mi familia estaba comiendo.', 'When I arrived home my family was eating.', ['llegar', 'casa', 'familia', 'comer']],
  [3, 'No compré los zapatos porque eran demasiado caros.', 'I did not buy the shoes because they were too expensive.', ['comprar', 'zapatos', 'caro']],
  [3, 'Ya he terminado el trabajo que empecé ayer.', 'I have already finished the work that I started yesterday.', ['terminar', 'trabajo', 'empezar', 'ayer']],
  [3, 'Mientras mi amigo cocinaba yo limpiaba la casa.', 'While my friend was cooking I was cleaning the house.', ['amigo', 'cocinar', 'limpiar', 'casa']],
  [3, 'Mañana iremos al restaurante donde comimos ayer.', 'Tomorrow we will go to the restaurant where we ate yesterday.', ['mañana', 'ir', 'restaurante', 'comer', 'ayer']],
  [3, 'Antes de salir de casa había cerrado la ventana.', 'Before leaving home I had closed the window.', ['salir', 'casa', 'cerrar', 'ventana']],
  [3, 'No sabía que ellos querían viajar con nosotros.', 'I did not know that they wanted to travel with us.', ['saber', 'querer', 'viajar']],
  [3, 'Te ayudaré a buscar la llave después de comer.', 'I will help you look for the key after eating.', ['ayudar', 'llave', 'comer']],
  [3, 'Cuando era niño iba a la playa con mi familia.', 'When I was a boy I used to go to the beach with my family.', ['niño', 'ir', 'playa', 'familia']],
  [3, 'Hemos comprado comida porque las tiendas estarán cerradas mañana.', 'We have bought food because the shops will be closed tomorrow.', ['comprar', 'comida', 'tienda', 'mañana']],
  [3, 'Estaba leyendo cuando mi amigo llegó a casa.', 'I was reading when my friend arrived home.', ['leer', 'amigo', 'llegar', 'casa']],
  [3, 'Perdí el teléfono que había comprado la semana pasada.', 'I lost the phone that I had bought last week.', ['teléfono', 'comprar', 'semana']],
  [4, 'Si tuviera más tiempo aprendería a cocinar para mi familia.', 'If I had more time I would learn to cook for my family.', ['tiempo', 'aprender', 'cocinar', 'familia']],
  [4, 'Quiero que me llames cuando llegues al hotel esta noche.', 'I want you to call me when you arrive at the hotel tonight.', ['querer', 'llamar', 'llegar', 'hotel', 'noche']],
  [4, 'Aunque estaba cansado terminé el trabajo antes de que llegaran ellos.', 'Although I was tired I finished the work before they arrived.', ['cansado', 'terminar', 'trabajo', 'llegar']],
  [4, 'Si hubiéramos salido antes habríamos llegado al aeropuerto a tiempo.', 'If we had left earlier we would have arrived at the airport on time.', ['salir', 'llegar', 'aeropuerto', 'tiempo']],
  [4, 'Espero que mañana podamos comer juntos antes de ir al trabajo.', 'I hope that tomorrow we can eat together before going to work.', ['mañana', 'comer', 'juntos', 'ir', 'trabajo']],
  [4, 'Me gustaría que me ayudaras a encontrar una casa cerca del mar.', 'I would like you to help me find a house near the sea.', ['ayudar', 'encontrar', 'casa', 'mar']],
  [4, 'No creo que ellos hayan terminado el trabajo que empezaron ayer.', 'I do not think they have finished the work that they started yesterday.', ['terminar', 'trabajo', 'empezar', 'ayer']],
  [4, 'Cuando hayas terminado de comer podremos salir a caminar por la ciudad.', 'When you have finished eating we will be able to go out for a walk around the city.', ['terminar', 'comer', 'salir', 'caminar', 'ciudad']],
  [4, 'Si supiera dónde está la llave podría abrir la puerta ahora.', 'If I knew where the key was I could open the door now.', ['saber', 'llave', 'abrir', 'puerta', 'ahora']],
  [4, 'Te llevaré al aeropuerto para que no tengas que conducir esta noche.', 'I will take you to the airport so that you do not have to drive tonight.', ['llevar', 'aeropuerto', 'conducir', 'noche']],
  [4, 'Si me hubieras llamado habría ido contigo a comprar la comida.', 'If you had called me I would have gone with you to buy the food.', ['llamar', 'ir', 'comprar', 'comida']],
  [4, 'Buscamos un restaurante donde podamos comer sin tener que esperar mucho.', 'We are looking for a restaurant where we can eat without having to wait long.', ['restaurante', 'comer', 'tener', 'esperar']],
  [4, 'Si hubiera encontrado mi teléfono te habría llamado antes de salir.', 'If I had found my phone I would have called you before leaving.', ['encontrar', 'teléfono', 'llamar', 'salir']],
  [4, 'Me gustaría que vinieras a comer con mi familia mañana.', 'I would like you to come and eat with my family tomorrow.', ['venir', 'comer', 'familia', 'mañana']],
  [4, 'No saldremos de casa hasta que todos hayan terminado de comer.', 'We will not leave home until everyone has finished eating.', ['salir', 'casa', 'terminar', 'comer']],
  [4, 'Si no hubiera perdido la llave habría podido abrir la puerta.', 'If I had not lost the key I would have been able to open the door.', ['llave', 'abrir', 'puerta']],
  [4, 'Es mejor que compremos la comida antes de que cierre la tienda.', 'It is better for us to buy the food before the shop closes.', ['comprar', 'comida', 'cerrar', 'tienda']],
  [4, 'Si vivieras cerca de la playa podríamos ir a nadar juntos.', 'If you lived near the beach we could go swimming together.', ['vivir', 'playa', 'ir', 'nadar', 'juntos']],
  [4, 'No sabía que habías aprendido a conducir antes de venir aquí.', 'I did not know that you had learned to drive before coming here.', ['saber', 'aprender', 'conducir', 'venir']],
  [4, 'Espero que hayas encontrado el dinero que dejaste en la habitación.', 'I hope you have found the money that you left in the room.', ['encontrar', 'dinero', 'dejar', 'habitación']],
  [6, 'Si hubiera sabido que llegarías tan tarde habría preparado la comida antes de salir.', 'If I had known you would arrive so late I would have prepared the food before leaving.', ['saber', 'llegar', 'tarde', 'comida', 'salir']],
  [6, 'Aunque hubiéramos salido más temprano no habríamos llegado a tiempo para comer con ellos.', 'Even if we had left earlier we would not have arrived in time to eat with them.', ['salir', 'temprano', 'llegar', 'tiempo', 'comer']],
  [6, 'Me habría gustado que me hubieras llamado antes de comprar la casa que vimos ayer.', 'I would have liked you to call me before buying the house that we saw yesterday.', ['llamar', 'comprar', 'casa', 'ayer']],
  [6, 'Cuando hayas terminado el trabajo que empezaste ayer podremos hablar de lo que haremos mañana.', 'When you have finished the work that you started yesterday we will be able to talk about what we will do tomorrow.', ['terminar', 'trabajo', 'empezar', 'ayer', 'hablar', 'mañana']],
  [6, 'Si no hubieras olvidado dónde estaba el hotel no habríamos tenido que caminar tanto para encontrarlo.', 'If you had not forgotten where the hotel was we would not have had to walk so far to find it.', ['hotel', 'tener', 'caminar', 'encontrar']]
];

export function getAdvancedTranslations(availableWords) {
  const words = new Set(availableWords);
  return SENTENCES.filter(([, , , required]) => required.every((word) => words.has(word)))
    .map(([translationLevel, question, answer]) => ({ translationLevel, question, answers: [answer], options: [] }));
}
