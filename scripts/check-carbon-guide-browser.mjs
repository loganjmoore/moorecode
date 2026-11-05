import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

assert.equal(process.env.CI, 'true', 'Hosted browser validation only');
const origin = process.env.PLAN_ORIGIN;
assert.ok(['http://127.0.0.1:4173', 'https://moorecode.com', 'https://moorecode.onrender.com'].includes(origin));
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_ENTRY));
const dir = process.env.EVIDENCE_DIR + '/carbon';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, chromiumSandbox: true });
const results = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const errors = [], writes = [];
    await context.route('**/*', route => {
      const request = route.request();
      if (request.method() !== 'GET') writes.push(request.method());
      return request.method() === 'GET' && new URL(request.url()).origin === origin ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    try {
      assert.equal((await page.goto(origin + '/blog/')).status(), 200);
      await page.getByRole('button', { name: 'No thanks', exact: true }).click();
      const link = page.getByRole('link', { name: 'Understand carbon 3D printing', exact: true });
      assert.equal(await link.count(), 1);
      await link.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await link.evaluate(el => el.matches(':focus-visible')), true);
      await page.keyboard.press('Enter');
      await page.waitForURL(origin + '/guides/carbon-3d-printing.html');
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').innerText(), 'What is carbon 3D printing?');
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://moorecode.com/guides/carbon-3d-printing.html');
      assert.match(await page.locator('.lede').innerText(), /carbon fiber[\s\S]*3D printing company[\s\S]*Digital Light Synthesis \(DLS\)/i);
      assert.match(await page.locator('.prose').innerText(), /MooreCode is Logan Moore's site/);
      const answer = page.locator('.direct-answer');
      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const faq = graph.find(item => item['@type'] === 'FAQPage').mainEntity[0];
      assert.equal(faq.name, await answer.locator('h2').innerText());
      assert.equal(faq.acceptedAnswer.text, await answer.locator('p').innerText());
      assert.equal(await answer.locator('tbody tr').count(), 3);
      assert.equal(await answer.locator('th').count(), 4);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Article must fit the viewport');
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: dir + '/' + width + '-opening.png' });
      await answer.scrollIntoViewIfNeeded();
      await page.screenshot({ path: dir + '/' + width + '-comparison.png' });
      const table = answer.locator('table');
      await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      assert.ok(await table.evaluate(el => el.scrollWidth <= el.clientWidth || el.scrollLeft + el.clientWidth >= el.scrollWidth - 2), 'Final comparison column must remain reachable');
      await page.screenshot({ path: dir + '/' + width + '-comparison-end.png' });
      const foundation = page.getByRole('link', { name: 'FDM, SLA, and SLS', exact: true });
      await foundation.focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(origin + '/blog/what-is-fdm-3d-printing.html');
      assert.equal(await page.locator('h1').count(), 1);
      await page.goBack();
      await page.getByRole('link', { name: 'metal 3D printing processes', exact: true }).click();
      await page.waitForURL(origin + '/blog/3d-printing-metal-processes-compared.html');
      assert.equal(await page.locator('h1').count(), 1);
      await page.goBack();
      await page.getByRole('link', { name: '3D printing manufacturing guide', exact: true }).click();
      await page.waitForURL(origin + '/guides/3d-printing-manufacturing.html');
      assert.equal(await page.locator('h1').count(), 1);
      const llms = await context.request.get(origin + '/llms.txt');
      assert.equal(llms.status(), 200);
      assert.match(llms.headers()['content-type'], /^text\/plain/);
      assert.match(await llms.text(), /https:\/\/moorecode\.com\/guides\/carbon-3d-printing\.html/);
      assert.deepEqual(errors, []);
      assert.deepEqual(writes, []);
      results.push({ origin, width, journey: 'pass', faqMatchesVisibleAnswer: true });
    } catch (error) {
      await page.screenshot({ path: dir + '/' + width + '-failure.png' }).catch(() => {});
      throw error;
    } finally { await context.close(); }
  }
} finally {
  await writeFile(dir + '/results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results));
