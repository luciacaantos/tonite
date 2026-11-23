// Genera las fotos de perfil (1080×1080) y una vista previa recortada en círculo.
import path from 'node:path';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const tipo of ['logo', 'estrella']) {
  await page.goto('file://' + path.resolve('perfil.html') + '?tipo=' + tipo);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `tonite-perfil-${tipo}.png` });
}
await browser.close();
