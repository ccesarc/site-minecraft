import { chromium } from 'playwright-core';

const OUT = process.argv[2] ?? 'shots';
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const erros = [];
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/cap-0.png` });

// A cena so' esta' pronta quando o loader sai do DOM; tempo fixo capturava
// o loader em maquina lenta.
await page.waitForSelector('#loader', { state: 'detached', timeout: 60000 });
await page.waitForTimeout(1000);

const alturaTotal = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
const marcos = [0, 0.28, 0.52, 0.74, 0.95];

for (let i = 0; i < marcos.length; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(alturaTotal * marcos[i]));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/cap-${i + 1}.png` });
}

console.log('altura rolavel:', alturaTotal);
console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'sem erros de console');
await browser.close();
