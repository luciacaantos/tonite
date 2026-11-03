// TONITE · experimento de validación (Google Apps Script).
// Se pega en script.google.com. Hay tres funciones:
//   1. crearFormularios: una sola vez. Crea el formulario de votos, el del día siguiente y una hoja con las respuestas.
//   2. rankingDeHoy: cada noche de votación a las 22:00. Escribe el mensaje del ranking y a quién mandarlo.
//   3. resultados: al final de las 2 semanas. Comprueba los criterios de validación.

var ZONA = 'Europe/Madrid';

var LOCALES = [
  'Chupitería 69', 'Pub Wall Street', 'Pub Babel', "L'scandalo Pub", 'Pub Imperial', 'Pub Lokura Latina',
  'Pub Legend', 'Sonora Desert Saloon', 'Pub Rubik', 'PlaymobilClub', 'Las Marismas', 'Pub Namek',
  'El Larguero', 'La Habana', 'Pub Ganivet 13', 'Kinsasa', 'Pub La Estrella', 'Pub La Flaca',
  'Pub Kocran (antes El Son)', 'Pata Palo', 'Miniclub', 'Granada 10', 'Boom Boom Room',
  'Twoo Club (antes Campus)', 'Sala Aliatar', 'Mae West'
];
var AUN_NO = 'Aún no lo sé';
var OTRO = 'Otro sitio';
var CAMBIO_POR_RANKING = 'Cambié por el ranking';

function crearFormularios() {
  var hoja = SpreadsheetApp.create('TONITE · Respuestas del experimento');

  var votos = FormApp.create('TONITE · ¿Dónde vas esta noche?');
  votos.setDescription('Vota dónde vas esta noche y a las 22:00 te mandamos el ranking de dónde va a haber más gente en Granada. Tarda 20 segundos.');
  votos.setConfirmationMessage('¡Hecho! A las 22:00 te mandamos el ranking 🌙');
  votos.setShowLinkToRespondAgain(false);
  var sitio = votos.addListItem()
    .setTitle('¿Dónde vas esta noche?')
    .setChoiceValues([AUN_NO].concat(LOCALES.slice().sort(), [OTRO]))
    .setRequired(true);
  votos.addCheckboxItem()
    .setTitle('¿Qué te hace elegir sitio?')
    .setHelpText('Puedes marcar varias.')
    .setChoiceValues(['Ambiente', 'Música', 'Precio', 'Que vayan mis amigos', 'Cercanía'])
    .setRequired(true);
  var curso = votos.addMultipleChoiceItem()
    .setTitle('¿En qué estás?')
    .setChoiceValues(['Primero', 'Erasmus', 'Otro curso', 'No estudio'])
    .setRequired(true);
  var contacto = votos.addTextItem()
    .setTitle('Tu WhatsApp o email para recibir el ranking a las 22:00')
    .setHelpText('Opcional. Solo lo usamos para mandarte el ranking esta noche y preguntarte mañana qué tal. No lo compartimos con nadie.');
  votos.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  var seguimiento = FormApp.create('TONITE · ¿Qué tal anoche?');
  seguimiento.setDescription('Una pregunta y listo. ¡Gracias por ayudarnos!');
  seguimiento.setConfirmationMessage('¡Gracias! 🌙');
  seguimiento.setShowLinkToRespondAgain(false);
  var cambio = seguimiento.addMultipleChoiceItem()
    .setTitle('¿Fuiste a donde votaste o cambiaste de plan al ver el ranking?')
    .setChoiceValues(['Fui donde dije', CAMBIO_POR_RANKING, 'Cambié por otra razón', 'No salí'])
    .setRequired(true);
  seguimiento.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  PropertiesService.getScriptProperties().setProperties({
    votos: votos.getId(),
    sitio: String(sitio.getId()),
    curso: String(curso.getId()),
    contacto: String(contacto.getId()),
    seguimiento: seguimiento.getId(),
    cambio: String(cambio.getId())
  });

  Logger.log('Formulario de votos (este es el enlace para la landing): ' + votos.getPublishedUrl());
  Logger.log('Formulario del día siguiente: ' + seguimiento.getPublishedUrl());
  Logger.log('Hoja con todas las respuestas: ' + hoja.getUrl());
}

function rankingDeHoy() {
  var c = PropertiesService.getScriptProperties().getProperties();
  var form = FormApp.openById(c.votos);
  var hoy = dia(new Date());
  var votos = form.getResponses().filter(function (r) { return dia(r.getTimestamp()) === hoy; });

  var cuenta = {};
  var indecisos = 0;
  var contactos = [];
  votos.forEach(function (r) {
    var sitio = respuesta(r, form, c.sitio);
    if (sitio === AUN_NO) indecisos++;
    else if (sitio && sitio !== OTRO) cuenta[sitio] = (cuenta[sitio] || 0) + 1;
    var contacto = respuesta(r, form, c.contacto).trim();
    if (contacto && contactos.indexOf(contacto) === -1) contactos.push(contacto);
  });

  var ranking = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 5);
  var lineas = ['🌙 Ranking TONITE · ' + fechaBonita(new Date())];
  if (ranking.length) {
    lineas.push('Dónde va a haber más gente esta noche, según ' + plural(votos.length, 'voto', 'votos') + ':', '');
    ranking.forEach(function (sitio, i) {
      lineas.push((i + 1) + '. ' + sitio + ' · ' + plural(cuenta[sitio], 'voto', 'votos'));
    });
  } else {
    lineas.push('Todavía no hay votos de hoy.');
  }
  if (indecisos) lineas.push('', 'Aún no sabían adónde ir: ' + plural(indecisos, 'persona', 'personas') + '.');
  lineas.push('', '¡Buena noche! Mañana te preguntamos qué tal 😉');

  Logger.log('MENSAJE PARA ENVIAR:\n\n' + lineas.join('\n'));
  Logger.log('ENVIAR A (' + contactos.length + '):\n' + (contactos.join('\n') || 'nadie ha dejado contacto hoy'));
}

function resultados() {
  var c = PropertiesService.getScriptProperties().getProperties();
  var form = FormApp.openById(c.votos);
  var votos = form.getResponses();
  var total = votos.length;
  var conContacto = 0;
  var nuevos = 0;
  votos.forEach(function (r) {
    if (respuesta(r, form, c.contacto).trim()) conContacto++;
    var curso = respuesta(r, form, c.curso);
    if (curso === 'Primero' || curso === 'Erasmus') nuevos++;
  });

  var seguimiento = FormApp.openById(c.seguimiento);
  var porRanking = seguimiento.getResponses().filter(function (r) {
    return respuesta(r, seguimiento, c.cambio) === CAMBIO_POR_RANKING;
  }).length;

  var pct = function (n) { return total ? Math.round(100 * n / total) : 0; };
  var marca = function (ok) { return ok ? '✅' : '❌'; };
  var criterios = [
    [total >= 100, 'Votos: ' + total + ' (objetivo: 100)'],
    [pct(conContacto) >= 40, 'Dejan su contacto: ' + conContacto + ' · ' + pct(conContacto) + ' % (objetivo: 40 %)'],
    [pct(porRanking) >= 15, 'Cambian de plan por el ranking: ' + porRanking + ' · ' + pct(porRanking) + ' % (objetivo: 15 %)'],
    [pct(nuevos) >= 50, 'Son de primero o Erasmus: ' + nuevos + ' · ' + pct(nuevos) + ' % (objetivo: 50 %)']
  ];

  var veredicto;
  if (total < 30 || porRanking === 0) veredicto = 'Hipótesis DESCARTADA: menos de 30 votos o nadie cambió de plan.';
  else if (criterios.every(function (k) { return k[0]; })) veredicto = 'Hipótesis VALIDADA: se cumplen los cuatro criterios.';
  else veredicto = 'Resultado intermedio: ajustad el mensaje y repetid una semana.';

  Logger.log('RESULTADOS DEL EXPERIMENTO\n\n' +
    criterios.map(function (k) { return marca(k[0]) + ' ' + k[1]; }).join('\n') +
    '\n\n' + veredicto);
}

function respuesta(r, form, id) {
  var item = r.getResponseForItem(form.getItemById(Number(id)));
  return item ? String(item.getResponse()) : '';
}

function dia(fecha) {
  return Utilities.formatDate(fecha, ZONA, 'yyyy-MM-dd');
}

function fechaBonita(fecha) {
  var dias = { Monday: 'lunes', Tuesday: 'martes', Wednesday: 'miércoles', Thursday: 'jueves', Friday: 'viernes', Saturday: 'sábado', Sunday: 'domingo' };
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return dias[Utilities.formatDate(fecha, ZONA, 'EEEE')] + ' ' + Utilities.formatDate(fecha, ZONA, 'd') +
    ' de ' + meses[Number(Utilities.formatDate(fecha, ZONA, 'M')) - 1];
}

function plural(n, uno, varios) {
  return n + ' ' + (n === 1 ? uno : varios);
}
