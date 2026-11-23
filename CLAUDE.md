# Normas para Claude en este proyecto

## ElevenLabs: preguntar siempre antes de gastar caracteres

ElevenLabs cobra por cada carácter de texto que se convierte en voz, y el plan tiene un límite al mes. Antes de cualquier llamada que genere audio (muestras incluidas):

1. Di qué se va a generar: qué frases y con qué voz.
2. Di cuántos caracteres se van a gastar exactamente: la suma de la longitud de los textos que se convierten en voz.
3. Di cuántos quedarán en el plan después. Consultar el saldo es gratis: `GET https://api.elevenlabs.io/v1/user/subscription`, campos `character_count` y `character_limit`.
4. Espera a que la usuaria diga que sí. Sin un sí explícito, no se genera nada.

Ejemplo: «Esto gastará 523 caracteres (te quedarán unos 34.800 de 40.000). ¿Lo genero?»
