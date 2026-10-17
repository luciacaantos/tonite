// Genera los iconos PNG de la app (public/icon-192.png, icon-512.png, apple-touch-icon.png).
// Uso: npm run iconos   (necesita Playwright/Chromium)
import { chromium } from 'playwright';

const ESTRELLA = `<svg viewBox="0 0 24 24"><g fill="#FF2E9A"><rect x="5" y="5" width="14" height="14"/><rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)"/></g></svg>`;
const html = (size) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,600&display=block" rel="stylesheet">
<style>html,body{margin:0;width:${size}px;height:${size}px;background:#0a0f1f;}
.c{width:100%;height:100%;display:grid;place-items:center;
background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size / 4}' height='${size / 4}' viewBox='0 0 56 56'><g fill='none' stroke='%23E2B15B' stroke-opacity='.12' stroke-width='1.2'><rect x='17' y='17' width='22' height='22'/><rect x='17' y='17' width='22' height='22' transform='rotate(45 28 28)'/></g></svg>");}
.t{font-family:Fraunces,serif;font-style:italic;font-weight:600;font-size:${size * 0.24}px;color:#F4E9DA;letter-spacing:-.01em;position:relative;}
.i{position:relative;display:inline-block}
.i svg{position:absolute;left:62%;top:.14em;width:.3em;height:.3em;transform:translateX(-50%)}</style></head>
<body><div class="c"><div class="t">ton<span class="i">ı${ESTRELLA}</span>te</div></div></body></html>`;

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
