// Genera los iconos PNG de la app (public/icon-192.png, icon-512.png, apple-touch-icon.png).
// Uso: npm run iconos   (necesita Playwright/Chromium)
import { chromium } from 'playwright';

const html = (size) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&display=block" rel="stylesheet">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:#0b0b14;}
.c{width:100%;height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 45%,#ff2e9a55,#0b0b14 62%);}
.t{font-family:Unbounded,'Arial Black',sans-serif;font-weight:800;font-size:${size * 0.155}px;color:#fff;letter-spacing:.01em;
text-shadow:0 0 ${size * 0.03}px #ff2e9a,0 0 ${size * 0.07}px #ff2e9a;}
.t b{color:#ff2e9a}</style></head><body><div class="c"><div class="t">TONI<b>TE</b></div></div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [file, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `public/${file}` });
  await page.close();
  console.log('✓', file);
}
await browser.close();
