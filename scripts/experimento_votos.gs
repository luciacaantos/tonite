// TONITE · experimento de validación (Google Apps Script, aplicación web).
// Se pega en script.google.com y se publica como aplicación web: la landing (public/votar/)
// le manda los votos y le pide el ranking en directo. Todo se guarda en una hoja de cálculo.
//
//   1. preparar: una sola vez. Crea la hoja «TONITE · Experimento de validación».
//      Después: Implementar → Nueva implementación → Aplicación web, con acceso «Cualquier usuario».
//   2. rankingDeHoy: cada noche de votación a las 22:00. Escribe el mensaje del ranking
//      (en español y en inglés) y a quién mandar cada uno.
//   3. resultados: al final de las 2 semanas. Comprueba los criterios de validación y
//      lo desglosa por edad y por Erasmus.
//
// La lista de locales tiene que ser la misma que la de la landing (public/votar/index.html).

var ZONA = 'Europe/Madrid';

var LOCALES = {
  'Pedro Antonio': ['Chupitería 69', 'El Larguero', 'La Habana', "L'scandalo Pub", 'Las Marismas', 'Margot Bar',
    'PlaymobilClub', 'Pub Babel', 'Pub Imperial', 'Pub Legend', 'Pub Lokura Latina', 'Pub Namek', 'Pub Nocta',
    'Pub Rubik', 'Pub Wall Street', 'Soho', 'Sonora Desert Saloon'],
  'Elvira y Plaza Nueva': ['Eshavira', 'Garrison Drinks & Music', 'Miniclub', 'Pata Palo',
    'Pub Kocran (antes El Son)', 'Pub La Flaca'],
  'Centro y Ganivet': ['Hannigan & Sons', 'Kinsasa', 'La Tertulia', 'Pub Ganivet 13', 'Pub La Estrella'],
  'Discotecas y salas': ['BoogaClub', 'Boom Boom Room', 'El Camborio', 'Granada 10', 'Industrial Copera', 'Mae West',
    'Planta Baja', 'Sala Aliatar', 'Sala Príncipe', 'Sala Vogue', 'Twoo Club (antes Campus)']
};
var AUN_NO = 'Aún no lo sé';
var OTRO = 'Otro sitio';
var MOTIVOS = ['Ambiente', 'Música', 'Precio', 'Que vayan mis amigos', 'Cercanía'];
var EDADES = ['18-20', '21-23', '24-26', '27+'];
var SI_NO = ['Sí', 'No'];
var PLANES = ['Sí', 'Puede', 'No'];
var SEGUIMIENTO = ['Fui donde dije', 'Cambié por el ranking', 'Cambié por otra razón', 'No salí'];

// Columnas de cada pestaña: [nombre interno, título en la hoja]
var COLUMNAS_VOTOS = [
  ['fecha', 'Fecha'], ['noche', 'Noche'], ['id', 'ID'], ['sitio1', 'Sitio 1'], ['sitio2', 'Sitio 2'],
  ['otro', 'Otro sitio (cuál)'], ['motivos', 'Qué le hace elegir'], ['edad', 'Edad'], ['erasmus', 'Erasmus'],
  ['primerAno', 'Primer año en Granada'], ['nuevo', 'Recién llegado (Erasmus o primer año)'],
  ['contacto', 'Contacto'], ['idioma', 'Idioma'], ['canal', 'Canal'], ['plan', '¿Cambiará de plan según el ranking?']
];
var COLUMNAS_SEGUIMIENTO = [['fecha', 'Fecha'], ['id', 'ID del voto'], ['respuesta', 'Respuesta'], ['idioma', 'Idioma']];

function preparar() {
  var propiedades = PropertiesService.getScriptProperties();
  if (propiedades.getProperty('hoja')) {
    Logger.log('Ya estaba preparado. Hoja: ' + SpreadsheetApp.openById(propiedades.getProperty('hoja')).getUrl());
    return;
  }
  var libro = SpreadsheetApp.create('TONITE · Experimento de validación');
  var votos = libro.getSheets()[0].setName('Votos');
  votos.appendRow(COLUMNAS_VOTOS.map(function (c) { return c[1]; }));
  votos.setFrozenRows(1);
  var seguimiento = libro.insertSheet('Seguimiento');
  seguimiento.appendRow(COLUMNAS_SEGUIMIENTO.map(function (c) { return c[1]; }));
  seguimiento.setFrozenRows(1);
  propiedades.setProperty('hoja', libro.getId());
  Logger.log('Hoja creada: ' + libro.getUrl());
  Logger.log('Ahora publícalo: Implementar → Nueva implementación → Aplicación web → Ejecutar como «Yo» → ' +
    'Quién tiene acceso «Cualquier usuario». Copia la URL que acaba en /exec y mándasela a Claude.');
}

// ---------- Aplicación web ----------

// La landing manda aquí el voto, la respuesta para desbloquear el ranking y la pregunta del día siguiente.
function doPost(e) {
  var datos;
  try { datos = JSON.parse(e.postData.contents); } catch (error) { return salida({ ok: false }); }
  var cerrojo = LockService.getScriptLock();
  cerrojo.waitLock(10000);
  try {
    if (datos.tipo === 'voto') guardarVoto(datos);
    else if (datos.tipo === 'plan') guardarPlan(datos);
    else if (datos.tipo === 'seguimiento') guardarSeguimiento(datos);
    CacheService.getScriptCache().remove('ranking-' + noche(new Date()));
  } finally {
    cerrojo.releaseLock();
  }
  return salida({ ok: true });
}

// El ranking en directo: solo los sitios, la edad y si es Erasmus de cada voto de esta noche.
// Nunca devuelve contactos ni horas.
function doGet() {
  var esta = noche(new Date());
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('ranking-' + esta);
  if (guardado) return ContentService.createTextOutput(guardado).setMimeType(ContentService.MimeType.JSON);
  var votos = leer('Votos', COLUMNAS_VOTOS).filter(function (v) { return v.noche === esta; }).map(function (v) {
    return { s: sitiosContados(v), e: v.edad, x: v.erasmus === 'Sí' };
  });
  var texto = JSON.stringify({ noche: esta, actualizado: new Date().toISOString(), votos: votos });
  cache.put('ranking-' + esta, texto, 60);
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON);
}

function guardarVoto(d) {
  var validos = [AUN_NO, OTRO].concat(todosLosLocales());
  var sitios = [].concat(d.sitios || []).map(function (s) { return opcion(s, validos); }).filter(Boolean);
  if (!sitios.length) return;
  if (sitios[0] === AUN_NO || sitios[1] === sitios[0] || sitios[1] === AUN_NO) sitios = sitios.slice(0, 1);
  var erasmus = opcion(d.erasmus, SI_NO);
  var primerAno = erasmus === 'No' ? opcion(d.primerAno, SI_NO) : '';
  var fila = {
    fecha: new Date(),
    noche: noche(new Date()),
    id: texto(d.id, 40),
    sitio1: sitios[0],
    sitio2: sitios[1] || '',
    otro: sitios.indexOf(OTRO) !== -1 ? texto(d.otro, 80) : '',
    motivos: [].concat(d.motivos || []).map(function (m) { return opcion(m, MOTIVOS); }).filter(Boolean).join(', '),
    edad: opcion(d.edad, EDADES),
    erasmus: erasmus,
    primerAno: primerAno,
    nuevo: erasmus === 'Sí' || primerAno === 'Sí' ? 'Sí' : 'No',
    contacto: texto(d.contacto, 80),
    idioma: opcion(d.idioma, ['es', 'en']) || 'es',
    canal: texto(d.canal, 30),
    plan: ''
  };
  hoja('Votos').appendRow(COLUMNAS_VOTOS.map(function (c) { return comoTexto(fila[c[0]]); }));
}

function guardarPlan(d) {
  var id = texto(d.id, 40);
  var plan = opcion(d.plan, PLANES);
  if (!id || !plan) return;
  var votos = hoja('Votos');
  var ultima = votos.getLastRow();
  if (ultima < 2) return;
  var desde = Math.max(2, ultima - 999);
  var ids = votos.getRange(desde, columna(COLUMNAS_VOTOS, 'id'), ultima - desde + 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === id) {
      votos.getRange(desde + i, columna(COLUMNAS_VOTOS, 'plan')).setValue(comoTexto(plan));
      return;
    }
  }
}

function guardarSeguimiento(d) {
  var fila = { fecha: new Date(), id: texto(d.id, 40), respuesta: opcion(d.respuesta, SEGUIMIENTO), idioma: opcion(d.idioma, ['es', 'en']) || 'es' };
  if (!fila.respuesta) return;
  hoja('Seguimiento').appendRow(COLUMNAS_SEGUIMIENTO.map(function (c) { return comoTexto(fila[c[0]]); }));
}

// ---------- Ranking de las 22:00 ----------

function rankingDeHoy() {
  var esta = noche(new Date());
  var votos = leer('Votos', COLUMNAS_VOTOS).filter(function (v) { return v.noche === esta; });
  var contactos = { es: [], en: [] };
  votos.forEach(function (v) {
    var contacto = String(v.contacto).trim();
    var idioma = v.idioma === 'en' ? 'en' : 'es';
    if (contacto && contactos[idioma].indexOf(contacto) === -1) contactos[idioma].push(contacto);
  });
  Logger.log('MENSAJE EN ESPAÑOL:\n\n' + mensajeRanking(votos, 'es'));
  Logger.log('ENVIAR EN ESPAÑOL A (' + contactos.es.length + '):\n' + (contactos.es.join('\n') || 'nadie'));
  Logger.log('MESSAGE IN ENGLISH:\n\n' + mensajeRanking(votos, 'en'));
  Logger.log('ENVIAR EN INGLÉS A (' + contactos.en.length + '):\n' + (contactos.en.join('\n') || 'nadie'));
  Logger.log('MAÑANA, mandad a esa misma gente la pregunta del día siguiente:\n' +
    'https://tonite-theta.vercel.app/votar/?anoche (en español)\nhttps://tonite-theta.vercel.app/votar/?anoche&lang=en (en inglés)');
}

function mensajeRanking(votos, idioma) {
  var en = idioma === 'en';
  var personas = function (n) { return n + (en ? (n === 1 ? ' person' : ' people') : (n === 1 ? ' persona' : ' personas')); };
  var lineas = [(en ? '🌙 TONITE ranking · ' : '🌙 Ranking TONITE · ') + fechaBonita(new Date(), idioma)];
  var general = contar(votos).slice(0, 5);
  if (!general.length) {
    lineas.push(en ? 'No votes yet tonight.' : 'Todavía no hay votos esta noche.');
    return lineas.join('\n');
  }
  lineas.push((en ? 'Where the crowd is going tonight, based on ' : 'Dónde va a haber más gente esta noche, según ') +
    votos.length + (en ? (votos.length === 1 ? ' vote:' : ' votes:') : (votos.length === 1 ? ' voto:' : ' votos:')), '');
  general.forEach(function (p, i) { lineas.push((i + 1) + '. ' + p[0] + ' · ' + personas(p[1])); });
  var erasmus = contar(votos.filter(function (v) { return v.erasmus === 'Sí'; })).slice(0, 3);
  if (erasmus.length) {
    lineas.push('', en ? 'Among Erasmus students:' : 'Entre los Erasmus:');
    erasmus.forEach(function (p, i) { lineas.push((i + 1) + '. ' + p[0] + ' · ' + personas(p[1])); });
  }
  var indecisos = votos.filter(function (v) { return v.sitio1 === AUN_NO; }).length;
  if (indecisos) lineas.push('', (en ? 'Still undecided: ' : 'Aún no sabían adónde ir: ') + personas(indecisos) + '.');
  lineas.push('', en ? 'Have a great night! Tomorrow we’ll ask how it went 😉' : '¡Buena noche! Mañana te preguntamos qué tal 😉');
  return lineas.join('\n');
}

// ---------- Resultados del experimento ----------

function resultados() {
  var votos = leer('Votos', COLUMNAS_VOTOS);
  var seguimiento = leer('Seguimiento', COLUMNAS_SEGUIMIENTO);
  var total = votos.length;
  var pct = function (n, de) { return de ? Math.round(100 * n / de) : 0; };
  var cuantos = function (lista, campo, valor) { return lista.filter(function (v) { return valor === undefined ? String(v[campo]).trim() : v[campo] === valor; }).length; };

  var conContacto = cuantos(votos, 'contacto');
  var nuevos = cuantos(votos, 'nuevo', 'Sí');
  var porRanking = cuantos(seguimiento, 'respuesta', 'Cambié por el ranking');
  var criterios = [
    [total >= 100, 'Votos: ' + total + ' (objetivo: 100)'],
    [pct(conContacto, total) >= 40, 'Dejan su contacto: ' + conContacto + ' · ' + pct(conContacto, total) + ' % (objetivo: 40 %)'],
    [pct(porRanking, total) >= 15, 'Cambian de plan por el ranking: ' + porRanking + ' · ' + pct(porRanking, total) + ' % (objetivo: 15 %)'],
    [pct(nuevos, total) >= 50, 'Son recién llegados (Erasmus o primer año): ' + nuevos + ' · ' + pct(nuevos, total) + ' % (objetivo: 50 %)']
  ];
  var veredicto;
  if (total < 30 || porRanking === 0) veredicto = 'Hipótesis DESCARTADA: menos de 30 votos o nadie cambió de plan.';
  else if (criterios.every(function (k) { return k[0]; })) veredicto = 'Hipótesis VALIDADA: se cumplen los cuatro criterios.';
  else veredicto = 'Resultado intermedio: ajustad el mensaje y repetid una semana.';

  var desbloquean = cuantos(votos, 'plan');
  var lineas = ['RESULTADOS DEL EXPERIMENTO', ''];
  criterios.forEach(function (k) { lineas.push((k[0] ? '✅ ' : '❌ ') + k[1]); });
  lineas.push('', veredicto, '',
    'Desbloquean el ranking en directo: ' + desbloquean + ' · ' + pct(desbloquean, total) + ' %',
    '¿Cambiarán de plan según el ranking? ' + PLANES.map(function (p) { return p + ' ' + pct(cuantos(votos, 'plan', p), desbloquean) + ' %'; }).join(' · '),
    'Respuestas del día siguiente: ' + seguimiento.length + ' (' + SEGUIMIENTO.map(function (s) { return s + ': ' + cuantos(seguimiento, 'respuesta', s); }).join(' · ') + ')',
    '', 'POR GRUPOS (votos · dejan contacto · dirían que sí cambian de plan)');
  var grupos = EDADES.map(function (e) { return ['Edad ' + e, 'edad', e]; }).concat([['Erasmus', 'erasmus', 'Sí'], ['No Erasmus', 'erasmus', 'No']]);
  grupos.forEach(function (g) {
    var del = votos.filter(function (v) { return v[g[1]] === g[2]; });
    lineas.push(g[0] + ': ' + del.length + ' · ' + pct(cuantos(del, 'contacto'), del.length) + ' % · ' +
      pct(cuantos(del, 'plan', 'Sí'), cuantos(del, 'plan')) + ' %');
  });
  Logger.log(lineas.join('\n'));
}

// ---------- Utilidades ----------

function hoja(nombre) {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('hoja')).getSheetByName(nombre);
}

function leer(nombre, columnas) {
  var filas = hoja(nombre).getDataRange().getValues().slice(1);
  return filas.map(function (fila) {
    var objeto = {};
    columnas.forEach(function (c, i) { objeto[c[0]] = fila[i] instanceof Date ? fila[i] : String(fila[i]); });
    return objeto;
  });
}

function columna(columnas, nombre) {
  for (var i = 0; i < columnas.length; i++) if (columnas[i][0] === nombre) return i + 1;
  throw new Error('No existe la columna ' + nombre);
}

function todosLosLocales() {
  return Object.keys(LOCALES).reduce(function (lista, zona) { return lista.concat(LOCALES[zona]); }, []);
}

function sitiosContados(v) {
  return [v.sitio1, v.sitio2].filter(function (s) { return s && s !== AUN_NO && s !== OTRO; });
}

function contar(votos) {
  var cuenta = {};
  votos.forEach(function (v) { sitiosContados(v).forEach(function (s) { cuenta[s] = (cuenta[s] || 0) + 1; }); });
  return Object.keys(cuenta)
    .sort(function (a, b) { return cuenta[b] - cuenta[a] || a.localeCompare(b); })
    .map(function (s) { return [s, cuenta[s]]; });
}

// Una «noche» va de las 6:00 de un día a las 5:59 del siguiente, en hora de Granada.
function noche(fecha) {
  return Utilities.formatDate(new Date(fecha.getTime() - 6 * 3600 * 1000), ZONA, 'yyyy-MM-dd');
}

function fechaBonita(fecha, idioma) {
  if (idioma === 'en') return Utilities.formatDate(fecha, ZONA, 'EEEE d MMMM');
  var dias = { Monday: 'lunes', Tuesday: 'martes', Wednesday: 'miércoles', Thursday: 'jueves', Friday: 'viernes', Saturday: 'sábado', Sunday: 'domingo' };
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return dias[Utilities.formatDate(fecha, ZONA, 'EEEE')] + ' ' + Utilities.formatDate(fecha, ZONA, 'd') +
    ' de ' + meses[Number(Utilities.formatDate(fecha, ZONA, 'M')) - 1];
}

function opcion(valor, permitidas) {
  return permitidas.indexOf(valor) !== -1 ? valor : '';
}

function texto(valor, maximo) {
  return String(valor || '').replace(/\s+/g, ' ').trim().slice(0, maximo);
}

// El apóstrofo hace que la hoja guarde el valor tal cual: sin convertir «18-20» en fecha,
// sin quitar el «+» de un teléfono y sin ejecutar nada que empiece por «=».
function comoTexto(valor) {
  return typeof valor === 'string' && valor !== '' ? "'" + valor : valor;
}

function salida(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
