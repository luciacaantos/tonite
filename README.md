# TONITE · prototipo

> *Menos dudas, más planes y la noche que tú eliges.*

App web instalable (PWA) de ocio nocturno para Granada centro: un mapa que te dice **cuánta gente y qué ambiente hay** en cada pub, bar y discoteca **antes de ir**. Prototipo para el taller Ideas Factory (UGR).

---

## 1. Cómo arrancarla en tu ordenador

Solo hace falta la primera vez:

1. Instala **Node.js** (versión "LTS") desde <https://nodejs.org>. Siguiente, siguiente, finalizar.
2. Abre la carpeta del proyecto en una terminal:
   - **Windows:** abre la carpeta `tonite` en el Explorador, haz clic en la barra de la ruta, escribe `cmd` y pulsa Intro.
   - **Mac:** clic derecho sobre la carpeta `tonite` → *Servicios* → *Nueva terminal en la carpeta*.
3. Escribe esto y pulsa Intro (tarda un minuto):
   ```
   npm install
   ```

Cada vez que quieras verla:

```
npm run dev
```

Te mostrará dos direcciones:
- `Local: http://localhost:5173` → ábrela en el navegador del ordenador.
- `Network: http://192.168.x.x:5173` → ábrela en el **móvil** (tiene que estar en la misma wifi).

Para pararla: `Ctrl + C` en la terminal.

> En el ordenador, pulsa F12 y activa la vista de móvil (icono de móvil/tablet) para verla como en un teléfono.

---

## 2. Dónde se editan los datos (sin programar)

Todo está en la carpeta **`datos/`**. Después de cambiar algo, guarda el archivo: si `npm run dev` está en marcha, la app se actualiza sola.

| Archivo | Qué contiene | Cómo editarlo |
|---|---|---|
| `datos/locales_granada_seed.csv` | Locales: nombre, zona, tipo, dirección, **música**, **ambiente** y el **ambiente detallado** (estilo, precio, público, edad, plan y volumen) | Con Excel, Numbers o Google Sheets. Las etiquetas van separadas por `\|` (ej.: `reggaetón\|comercial`). Guárdalo como **CSV UTF-8**. |
| `datos/demo.json` | **Precios orientativos, horarios y fiestas** (datos de demo) | Con cualquier editor de texto (Bloc de notas, TextEdit o <https://jsoneditoronline.org>). |
| `datos/ofertas.json` | **Monetización:** locales adheridos (los que pagan), sus **ofertas**, las **recompensas** por puntos y los **niveles** | Igual que el anterior. |
| `datos/coordenadas.json` | Posición de cada local en el mapa | Igual que el anterior. |

### Ambiente detallado de cada local (columnas del CSV)
Son **estimaciones nuestras** (columna `verificar`): revisadlas y corregidlas.
| Columna | Valores posibles | Ejemplo |
|---|---|---|
| `estilo` | `casual`, `arreglado` o `pijo` | Boom Boom Room = `pijo` |
| `precio` | `€`, `€€` o `€€€` | Granada 10 = `€€€` |
| `publico` | `universitario`, `Erasmus`, `alternativo`, `LGTBI-friendly`, `+25`, `mixto` (varios con `\|`) | `universitario\|Erasmus` |
| `edad` | Rango aproximado | `18-23` |
| `plan` | `previa`, `tomar algo`, `bailar`, `hasta tarde` (varios con `\|`) | `bailar\|hasta tarde` |
| `volumen` | `se puede hablar`, `alto`, `muy alto` | `alto` |

Con estas columnas, la ficha muestra la escala **Casual · Arreglado · Pijo**, el precio en €, la edad media y el público, y el mapa permite filtrar por estilo, precio y público.

### Fotos de los locales (`datos/fotos/`)
Al tocar un local, la ficha muestra arriba sus fotos (se pasan con el dedo). Si no tiene, sale una portada de diseño.
- Sube las fotos a `datos/fotos/` con el **nombre del local en minúsculas, sin tildes y con guiones**: `pata-palo.jpg` (portada), `pata-palo-2.jpg`, `pata-palo-3.jpg`… La lista exacta de nombres está en `datos/fotos/LEEME.md`.
- Desde GitHub: entra en `datos/fotos` → **Add file → Upload files** → arrastra → **Commit changes**.
- Fotos horizontales y ligeras (menos de 500 KB). **Solo fotos vuestras o cedidas por el local** (las de Google o Instagram tienen dueño).
- También se puede poner un enlace `https://…` a una foto en la columna `foto` del CSV.

### Fotos de la gente (en directo)
En la ficha de cada local, **«Fotos de la gente»**: cualquiera que esté en el local (comprobado por GPS, o «Simular que estoy aquí» en la demo) pulsa **📷 Subir foto de ahora**, hace la foto con la cámara y la publica. Gana **15 puntos** (máximo 1 foto por local cada 25 min). La galería muestra cada foto con **«hace 10 min»**, quién la subió y la marca **EN DIRECTO** si tiene menos de 1 hora. Después de un check-in también se ofrece subir foto sin volver a pedir el GPS.
Sin servidor, las fotos se guardan **en el móvil de quien las sube** (reducidas a ~100 KB): todavía no las ven los demás móviles.

### Cuestionario de gustos y «% para ti»
Al crear la cuenta se ofrece (opcional) un cuestionario de 7 preguntas: cuánta gente le gusta, música, qué busca en una noche, con qué público está a gusto, estilo de sitio, qué bebe y presupuesto. Con eso cada local tiene un **% para ti** (en el carrusel del mapa y en la ficha, con los motivos). Las preguntas y los pesos están en `src/gustos.js`. Se puede repetir desde *Perfil → Mis gustos*.

### Añadir un local nuevo
1. Añade una fila al CSV (el **nombre** debe ser único).
2. En `datos/coordenadas.json` añade su posición. Truco: en Google Maps, haz clic derecho sobre el local y pulsa los números (por ejemplo `37.1701, -3.6047`) para copiarlos:
   ```json
   "Nombre del local": { "lat": 37.1701, "lon": -3.6047, "fuente": "manual", "revisar": false },
   ```
3. En `datos/demo.json`, dentro de `"locales"`, copia el bloque de otro local y cámbiale el nombre, los precios y el horario. Si no lo haces, la app le pone un horario por defecto (jue-sáb de 22:00 a 03:00).

### Ofertas, recompensas y niveles (`datos/ofertas.json`)
- **Modelo de negocio:** los locales adheridos pagan **22,99 €/mes** (`cuotaMensual`). La pestaña Ofertas lo anuncia al final («¿Tienes un bar, pub o discoteca?»).
- **`adheridos`:** lista de locales que pagan la mensualidad. **Solo ellos** aparecen en *Ofertas* y en la *Agenda*, y llevan el icono 🎟️ en el mapa.
- **`ofertas`:** una por bloque. Ejemplo:
  ```json
  { "id": "o16", "local": "Pata Palo", "titulo": "Chupito a 1 €", "antes": "1,50 €", "categoria": "chupito", "dias": ["jue", "vie"], "condiciones": "Uno por persona." }
  ```
  `id` tiene que ser distinto en cada oferta. `categoria`: `chupito`, `copa`, `cerveza` o `entrada`.
- **`horasEntreCanjes`:** cuánto tiempo queda bloqueada una oferta después de que el camarero pulse «¡Canjeada!» (ahora, 1 hora).
- **`recompensas`:** lo que se compra con puntos. `puntos` = lo que cuesta; `local` vacío = vale en cualquier local adherido; `nivelMinimo` = nivel necesario para canjearla (0 = todos).
- **`niveles`:** a partir de cuántos puntos **ganados** se sube de nivel (`desde`), su nombre y su ventaja. Gastar puntos no baja de nivel.

### Cambiar una fiesta
En `datos/demo.json`:
- **Fiesta (agenda):** añade un bloque en `"fiestas"` (solo saldrá si el local está adherido):
  ```json
  { "dia": "jue", "local": "Pata Palo", "hora": "23:00", "nombre": "Indie Night", "tipo": "temática", "descripcion": "..." }
  ```
  `tipo` puede ser `universitaria`, `Erasmus`, `temática` o `discoteca`. `local` tiene que coincidir **exactamente** con el nombre del CSV.

Días: `lun, mar, mié, jue, vie, sáb, dom`. Ojo: es el día de la **noche** (`jue` = jueves por la noche, aunque ya sean las 02:00 del viernes).

> **Cuidado con las comas en los .json:** cada bloque va separado por una coma, pero el último de una lista no lleva. Si la app se queda en blanco después de editar, casi siempre es eso.

### Coordenadas automáticas (Nominatim / OpenStreetMap)
Ahora mismo **todas las coordenadas son aproximadas** (las puse a mano) y están marcadas con `"revisar": true`. Para calcularlas a partir de las direcciones:
```
npm run geocodificar
```
Hace 1 petición por segundo (el límite de Nominatim) y tarda menos de un minuto. Actualiza `datos/coordenadas.json` y deja en `datos/locales_para_revisar.txt` los que no encuentre o que no tienen dirección (El Larguero, La Habana, Boom Boom Room…).

---

## 3. Modo demo (para la presentación)

Viene **activado**. Se controla en **Perfil → Modo demo**.
- Fija la hora en la **noche del jueves a la 01:00** (se puede cambiar entre 22:00 y 03:00), para que el mapa se vea lleno de vida aunque presentéis por la mañana.
- En el check-in aparece **«🎬 Simular que estoy aquí»**, que se salta el GPS.
- En *Perfil → Modo demo* hay botones **«+100 puntos»** y **«+500 puntos»** para enseñar los canjes y los niveles sin hacer muchos check-ins.
- Arriba se ve la etiqueta amarilla `DEMO · Jueves 01:00` para que quede claro.

### Guion de 2 minutos
0. (Antes de empezar) **Crea la cuenta** y responde el cuestionario de gustos (30 s).
1. **Mapa:** «son las 01:00 de un jueves; los colores son la gente que hay ahora; los 🎟️ son locales con ofertas». Abajo, **💘 Para ti ahora**: los sitios que encajan contigo. Toca el primero.
2. **Ficha:** afluencia, **% para ti y por qué**, ofertas, **ambiente** (casual / arreglado / pijo, precio, edad, público), precios y *Cómo llegar*. Baja hasta **Plan B cerca**.
3. **Estoy aquí → Simular que estoy aquí →** toca *Lleno* → **+25 puntos**.
4. **Ofertas:** *Usar oferta* en «Chupito a 1 €» → pantalla para el camarero → **¡Canjeada!** → la oferta queda bloqueada 1 hora.
5. **Puntos:** saldo, nivel y recompensas. (Antes, en *Perfil → +500 puntos*.) *Canjear* «Copa gratis» → **¡Canjeada!** → se descuentan los puntos.
6. **Niveles:** «cuantos más check-ins, más nivel y mejores recompensas».

Consejo: el día anterior, ábrela en el móvil, **regístrate** y añádela a la pantalla de inicio (Safari: *Compartir → Añadir a pantalla de inicio*; Chrome: *⋮ → Instalar aplicación*). Así mañana se abre directamente en el mapa.

---

## 4. Publicarla (Vercel) y volver a publicarla

**Primera vez:** consulta el paso a paso en la conversación con Claude (GitHub + Vercel, gratis).

**Volver a publicar después de cambiar algo:** solo hay que subir los cambios a GitHub. Vercel lo detecta y en 1 minuto la nueva versión está en el mismo enlace.
- Desde GitHub en el navegador: entra en tu repositorio, abre el archivo (ej. `datos/demo.json`), pulsa el lápiz ✏️, edita y pulsa **Commit changes**. ¡Ya está!

> Si en el móvil no ves los cambios, cierra la app del todo y vuelve a abrirla (la PWA se actualiza al reabrirla).

---

## 5. Qué es real y qué es simulado (para explicarlo con honestidad)

| | Real ✅ | Simulado / de demo 🎬 |
|---|---|---|
| **Locales** | Nombres, zonas, tipos y direcciones (del CSV, recogidos por el equipo) | Las etiquetas de música y ambiente son **aproximadas** (pendientes de verificar). Las coordenadas son aproximadas hasta ejecutar Nominatim. |
| **Mapa** | Mapa real de OpenStreetMap (Leaflet) | — |
| **Afluencia** | La regla: solo sale de check-ins, caduca a los 25 min y los locales nunca la declaran. Tus check-ins reales cuentan. | Los check-ins «de otros usuarios» son una **simulación** según el día, la hora y el tipo de local. |
| **Check-in** | Pide el GPS real y comprueba de verdad que estás a menos de 50 m. Límite de 1 check-in por local cada 25 min. | El botón «Simular que estoy aquí» se salta el GPS (solo en modo demo). |
| **Fotos de la gente** | Cámara, comprobación de que estás en el local, galería con «hace X min», +15 puntos. | Sin servidor: cada foto solo se ve en el móvil que la subió. |
| **Puntos y niveles** | Se suman de verdad por cada check-in (10, +15 si es un sitio nuevo) y por cada foto (15); el nivel sube con los puntos ganados; las recompensas descuentan puntos. | Los botones «+100 / +500 puntos» son solo para la demo. |
| **Ofertas y canje** | Flujo completo: *Usar oferta* → pantalla para el camarero → «¡Canjeada!» → bloqueada 1 hora. | No hay servidor: el bloqueo se guarda **en ese móvil** (borrando los datos se podría reutilizar). Los locales adheridos y sus ofertas son **de ejemplo** (aún no hay acuerdos firmados). |
| **Gustos y «% para ti»** | El cálculo es real: compara tus respuestas con los datos de cada local. | Los datos de ambiente de los locales (estilo, precio, público, edad…) son **estimaciones** pendientes de verificar. |
| **Precios, horarios y fiestas** | — | **Todo inventado**, aunque realista. |
| **Login** | Formulario con +18, privacidad y ubicación. | No hay servidor: la cuenta se guarda **solo en ese móvil**. |
| **Plan B cerca** | Cálculo real de distancias entre locales. | Depende de la afluencia simulada. |
| **PWA** | Instalable en el móvil y funciona sin conexión una vez abierta. | — |

---

## 6. Para los curiosos: cómo está hecha

- **React + Vite** (`src/`), mapa con **Leaflet** y calles de **OpenStreetMap** (sin clave de API), oscurecidas con un filtro. Si no cargan, prueba Esri y, si tampoco, avisa en pantalla.
- `src/data.js` une el CSV, las coordenadas, los datos de demo y las ofertas (con los niveles).
- `src/afluencia.js` contiene la simulación de afluencia y los colores de cada nivel.
- `src/clock.js`: hora real o del modo demo, y horarios de apertura.
- `src/store.js` guarda la cuenta, los check-ins, los puntos y los canjes en el móvil (`localStorage`).
- `src/gustos.js`: preguntas del cuestionario y cálculo del «% para ti».
- `src/components/`: una pieza por pantalla (Mapa, Ficha, Filtros, CheckIn, Ofertas, Canje, Puntos, Agenda, Perfil, Login, Cuestionario).
- Paleta **A «Neón rosa»**: fondo `#0B0B14`, acento `#FF2E9A` y secundario `#7A5CFF` (en `src/styles.css`, arriba del todo).
