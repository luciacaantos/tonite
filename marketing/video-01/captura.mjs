// Recorre la app TONITE en modo demo y guarda capturas de móvil + dónde está cada botón que se toca.
import fs from 'node:fs';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';

const salida = process.argv[2];
const info = {};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-ES', timezoneId: 'Europe/Madrid', isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('ERROR JS:', e.message));
const foto = async (nombre) => { await page.waitForTimeout(700); await page.screenshot({ path: `${salida}/${nombre}.png` }); console.log('captura', nombre); };
const caja = async (loc) => { const b = await loc.boundingBox(); return b && { x: b.x, y: b.y, w: b.width, h: b.height }; };

await page.goto('http://127.0.0.1:5173/');
await page.waitForTimeout(1500);
await page.fill('input[placeholder="Carla"]', 'Carla');
await page.fill('input[type="email"]', 'carla@correo.ugr.es');
await page.fill('input[type="password"]', 'granada2026');
for (const c of await page.locator('label.check input[type="checkbox"]').all()) await c.check();
await page.click('button[type="submit"]');
await page.waitForTimeout(1000);
// Cuestionario de gustos: se contesta para que salga el «% para ti»
await page.getByRole('button', { name: 'Vamos' }).click();
for (let i = 0; i < 14 && (await page.locator('.cuestionario').count()); i++) {
  await page.waitForTimeout(450);
  const ops = page.locator('.cuest-op');
  const n = await ops.count();
  if (n) await ops.nth(Math.min(1, n - 1)).click();
  await page.waitForTimeout(450);
  const pie = page.locator('.cuest-pie button');
  if ((await pie.count()) && (await page.locator('.cuestionario').count())) await pie.click();
}
await page.waitForTimeout(1000);

// Mapa: esperar a que carguen las teselas
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3500);
info.pins = await page.$$eval('.pin', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, c: getComputedStyle(e).getPropertyValue('--c').trim() }; }));
await foto('mapa');

// Ficha de Chupitería 69
const marcador = page.locator('.leaflet-marker-icon[title="Chupitería 69"]');
info.tocarLocal = await caja(marcador);
await marcador.click();
await page.waitForTimeout(1200);
await foto('ficha');

// Check-in
const estoy = page.getByRole('button', { name: /Estoy aquí/ }).first();
info.tocarEstoy = await caja(estoy);
await estoy.click();
await page.waitForTimeout(800);
await foto('checkin-gps');
const simular = page.getByText(/Simular que estoy aquí/).first();
info.tocarSimular = await caja(simular);
await simular.click();
await page.waitForTimeout(900);
await foto('checkin-niveles');
const lleno = page.locator('.nivel-btn', { hasText: 'Lleno' }).first();
info.tocarLleno = await caja(lleno);
await lleno.click();
await page.waitForTimeout(1200);
await foto('checkin-hecho');
for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }

// Ofertas y canje
await page.evaluate(() => { location.hash = '#/ofertas'; });
await page.waitForTimeout(1200);
await foto('ofertas');
const usar = page.getByRole('button', { name: /Usar oferta/ }).first();
info.tocarUsar = await caja(usar);
await usar.click();
await page.waitForTimeout(1000);
await foto('canje');
const canjeada = page.getByRole('button', { name: /¡Canjeada!/ }).first();
info.tocarCanjeada = await caja(canjeada);
await canjeada.click();
await page.waitForTimeout(1200);
await foto('canjeada');
for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }

// Puntos
await page.evaluate(() => { location.hash = '#/perfil'; });
await page.waitForTimeout(1000);
await page.getByText('+500 puntos').first().click();
await page.waitForTimeout(500);
await page.evaluate(() => { location.hash = '#/puntos'; });
await page.waitForTimeout(1200);
await page.evaluate(() => { document.querySelectorAll('*').forEach((el) => { if (el.scrollTop) el.scrollTop = 0; }); window.scrollTo(0, 0); });
await foto('puntos');

// Landing de votación (con la votación como si ya estuviera conectada)
await page.goto('http://127.0.0.1:5173/votar/index.html?lang=es');
await page.waitForTimeout(2000);
await page.evaluate(() => { API = 'https://ejemplo.invalid/exec'; aplicarIdioma('es'); });
await foto('landing');
await page.evaluate(() => {
  localStorage.setItem('tonite-voto', JSON.stringify({ noche: noche(), id: 'video', contacto: true, plan: null }));
  mostrarHecho(false);
  document.getElementById('votar').scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollBy(0, -40));
info.tocarCandado = await caja(page.locator('[data-plan="Sí"]'));
await foto('landing-candado');

fs.writeFileSync(`${salida}/info.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify({ pins: info.pins.length, ...Object.fromEntries(Object.entries(info).filter(([k]) => k !== 'pins')) }));
await browser.close();
