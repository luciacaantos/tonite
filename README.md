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
| `datos/locales_granada_seed.csv` | Locales: nombre, zona, tipo, dirección, **música** y **ambiente** | Con Excel, Numbers o Google Sheets. Las etiquetas de música y ambiente van separadas por `\|` (ej.: `reggaetón\|comercial`). Guárdalo como **CSV UTF-8**. |
| `datos/demo.json` | **Precios, horarios, promociones y fiestas** (datos de demo) | Con cualquier editor de texto (Bloc de notas, TextEdit o <https://jsoneditoronline.org>). |
| `datos/coordenadas.json` | Posición de cada local en el mapa | Igual que el anterior. |

### Añadir un local nuevo
1. Añade una fila al CSV (el **nombre** debe ser único).
2. En `datos/coordenadas.json` añade su posición. Truco: en Google Maps, haz clic derecho sobre el local y pulsa los números (por ejemplo `37.1701, -3.6047`) para copiarlos:
   ```json
   "Nombre del local": { "lat": 37.1701, "lon": -3.6047, "fuente": "manual", "revisar": false },
   ```
3. En `datos/demo.json`, dentro de `"locales"`, copia el bloque de otro local y cámbiale el nombre, los precios y el horario. Si no lo haces, la app le pone un horario por defecto (jue-sáb de 22:00 a 03:00).

### Cambiar una promoción o una fiesta
En `datos/demo.json`:
- **Promoción:** `{ "dias": ["jue"], "texto": "2x1 hasta la 01:00" }` dentro de `"promos"` del local.
- **Fiesta (agenda):** añade un bloque en `"fiestas"`:
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
- En el plan de grupo aparece **«🎬 Simular votos de amigos»**.
- Arriba se ve la etiqueta amarilla `DEMO · Jueves 01:00` para que quede claro.

### Guion de 2 minutos
1. **Mapa:** «son las 01:00 de un jueves; los colores son la gente que hay ahora». Toca una tarjeta de *Lo más animado ahora*.
2. **Ficha:** afluencia y último check-in, promos de esta noche, música, precios y *Cómo llegar*.
3. Baja hasta **Plan B cerca**: «si está lleno, aquí al lado hay ambiente».
4. **Estoy aquí → Simular que estoy aquí →** toca *Lleno* → **+25 puntos**.
5. **Perfil:** puntos y «pronto podrás canjearlos por chupitos».
6. **Plan → Crear plan →** elige 3 sitios → *Crear plan y votar* → vota → *Simular votos de amigos* → *Cerrar votación* → 🏆 ganador → *Avisar al grupo por WhatsApp*.

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
| **Puntos** | Se suman de verdad por cada check-in (10, +15 si es un sitio nuevo). | El canje por chupitos y copas **no existe todavía**. |
| **Precios, horarios, promociones y fiestas** | — | **Todo inventado**, aunque realista. |
| **Login** | Formulario con +18, privacidad y ubicación. | No hay servidor: la cuenta se guarda **solo en ese móvil**. |
| **Plan de grupo** | Se crea el plan, se comparte por WhatsApp con un enlace que abre el plan en TONITE, se vota y sale el ganador. | Los votos **no se juntan entre móviles** (cada móvil ve sus votos). Los votos de «amigos» son simulados. |
| **Plan B cerca** | Cálculo real de distancias entre locales. | Depende de la afluencia simulada. |
| **PWA** | Instalable en el móvil y funciona sin conexión una vez abierta. | — |

---

## 6. Para los curiosos: cómo está hecha

- **React + Vite** (`src/`), mapa con **Leaflet** y calles de **OpenStreetMap** (sin clave de API), oscurecidas con un filtro. Si no cargan, prueba Esri y, si tampoco, avisa en pantalla.
- `src/data.js` une el CSV, las coordenadas y los datos de demo.
- `src/afluencia.js` contiene la simulación de afluencia y los colores de cada nivel.
- `src/clock.js`: hora real o del modo demo, y horarios de apertura.
- `src/store.js` guarda la cuenta, los check-ins, los puntos y los planes en el móvil (`localStorage`).
- `src/components/`: una pieza por pantalla (Mapa, Ficha, Filtros, CheckIn, Agenda, Plan, Perfil, Login).
- Paleta **A «Neón rosa»**: fondo `#0B0B14`, acento `#FF2E9A` y secundario `#7A5CFF` (en `src/styles.css`, arriba del todo).
