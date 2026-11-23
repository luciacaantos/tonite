// Dibuja video.html fotograma a fotograma. Uso: node render.mjs <carpeta> <fps> [desde] [hasta]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [, , carpeta, fps = '30', desde, hasta] = process.argv;
fs.mkdirSync(carpeta, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
await page.goto('file://' + path.resolve('video.html'));
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
});
await page.waitForTimeout(800);
const duracion = await page.evaluate(() => DURACION);
const total = Math.round(duracion * Number(fps));
const a = desde ? Number(desde) : 0;
const b = hasta ? Number(hasta) : total;
for (let i = a; i < b; i++) {
  await page.evaluate((t) => pintar(t), i / Number(fps));
  await page.screenshot({ path: `${carpeta}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
}
console.log('fotogramas', b - a, 'de', total, '· errores:', errores.length ? errores : 'ninguno');
await browser.close();
