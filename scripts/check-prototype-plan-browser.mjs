import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
assert.equal(process.env.CI, 'true', 'Hosted browser validation only');
const origin = process.env.PLAN_ORIGIN;
assert.ok(['http://127.0.0.1:4173','https://moorecode.com','https://moorecode.onrender.com'].includes(origin));
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_ENTRY));
const { PDFDocument } = await import(pathToFileURL(process.env.PDF_ENTRY));
const dir = process.env.EVIDENCE_DIR;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [390,1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const errors = [], writes = [];
    await context.route('**/*', route => {
      const r = route.request();
      if (r.method() !== 'GET') writes.push(r.method());
      return r.method() === 'GET' && new URL(r.url()).origin === origin ? route.continue() : route.abort();
    });
    await context.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints++; }; });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/blog/3d-printing-prototype-four-stage-test-plan.html');
    await page.locator('#prototype-plan-form').waitFor();
    const decline = page.getByRole('button', { name: /decline/i });
    if (await decline.isVisible()) await decline.click();
    assert.equal(await page.locator('h1').count(),1);
    await page.getByRole('button', { name: 'Create test-plan summary', exact: true }).click();
    assert.equal(await page.locator('#prototype-plan-output').isVisible(),false);
    assert.equal(await page.locator('#prototype-question').evaluate(el => el === document.activeElement),true);
    const example = page.getByRole('button', { name: 'Load the fictional sensor-bracket example', exact: true });
    await example.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    assert.equal(await example.evaluate(el => el.matches(':focus-visible')),true);
    assert.ok(await example.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth)) >= 2);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#prototype-stage').inputValue(),'Functional');
    await page.getByRole('button', { name: 'Create test-plan summary', exact: true }).click();
    assert.equal(await page.locator('#prototype-plan-example-note').isVisible(),true);
    assert.match(await page.locator('#prototype-plan-output').innerText(),/50.3 mm/);
    assert.equal(await page.locator('#prototype-plan-summary-heading').count(),1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: dir + '/' + width + '-summary.png' });
    await page.getByRole('button', { name: 'Print or save as PDF', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__prints),1);
    if (width === 1280) {
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top:'12mm', bottom:'12mm', left:'12mm', right:'12mm' } });
      await writeFile(dir + '/prototype-plan.pdf',pdf);
      const count = (await PDFDocument.load(pdf)).getPageCount();
      results.push({ origin, width, pdfPages:count });
      assert.ok(count <= 2, 'Summary print should not retain pages of hidden article layout: '+count);
    }
    const malicious = '<img src=x onerror=alert(1)>';
    await page.locator('#prototype-question').fill(malicious);
    assert.equal(await page.locator('#prototype-plan-output').isVisible(),false);
    await page.getByRole('button', { name: 'Create test-plan summary', exact: true }).click();
    assert.equal(await page.locator('[data-plan-summary="question"]').innerText(),malicious);
    assert.equal(await page.locator('#prototype-plan-output img').count(),0);
    await page.getByRole('button', { name:'Clear', exact:true }).click();
    assert.equal(await page.locator('#prototype-question').inputValue(),'');
    assert.equal(await page.locator('#prototype-plan-output').isVisible(),false);
    await example.click(); await page.reload();
    assert.equal(await page.locator('#prototype-question').inputValue(),'');
    assert.equal(await page.locator('#prototype-plan-output').isVisible(),false);
    await page.getByRole('link', { name:'Estimate a print with the price calculator', exact:true }).click();
    assert.equal(new URL(page.url()).pathname,'/calculators/3d-printing-price-calculator.html');
    assert.equal(await page.locator('h1').count(),1);
    assert.deepEqual(errors,[]); assert.deepEqual(writes,[]);
    results.push({ origin,width,journey:'pass' });
    await context.close();
  }
} finally {
  await writeFile(dir + '/results.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results));
