import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const sitemap = readFileSync(new URL('sitemap.xml', root), 'utf8');
const entries = new Map(
  [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)]
    .map(([, location, lastmod]) => [location, lastmod]),
);

assert.ok(entries.size, 'sitemap.xml must contain URL entries');

for (const location of entries.keys()) {
  const pathname = new URL(location).pathname;
  const publicPath = pathname === '/'
    ? 'index.html'
    : pathname.endsWith('/')
      ? `${pathname.slice(1)}index.html`
      : pathname.slice(1);

  assert.ok(existsSync(new URL(publicPath, root)), `${location} must map to a public file or index`);
}

for (const [location, contentDate] of [
  ['https://moorecode.com/', '2026-10-13'],
  ['https://moorecode.com/projects.html', '2026-10-13'],
  ['https://moorecode.com/hobbies.html', '2026-10-07'],
  ['https://moorecode.com/posthog-privacy.html', '2026-10-06'],
  ['https://moorecode.com/blog/', '2026-10-27'],
  ['https://moorecode.com/about.html', '2026-10-25'],
  ['https://moorecode.com/contact.html', '2026-10-25'],
  ['https://moorecode.com/calculators/3d-printing-price-calculator.html', '2026-10-25'],
  ['https://moorecode.com/blog/3d-printing-materials-after-pla-clamp-fails.html', '2026-10-21'],
  ['https://moorecode.com/blog/3d-printing-rates-small-job-pricing.html', '2026-10-21'],
  ['https://moorecode.com/blog/3d-scanning-to-printing-repair-scale-slice.html', '2026-10-17'],
  ['https://moorecode.com/blog/best-3d-printing-websites-files-2026.html', '2026-10-08'],
  ['https://moorecode.com/blog/desktop-3d-printing-setup-safe-workspace.html', '2026-10-27'],
  ['https://moorecode.com/blog/3d-printing-prototype-four-stage-test-plan.html', '2026-10-29'],
  ['https://moorecode.com/blog/3d-printing-metal-processes-compared.html', '2026-10-23'],
  ['https://moorecode.com/blog/3d-printing-filament-pla-petg-tpu.html', '2026-10-27'],
  ['https://moorecode.com/guides/3d-printing-at-home.html', '2026-10-27'],
  ['https://moorecode.com/guides/3d-printing-accessories.html', '2026-10-28'],
  ['https://moorecode.com/guides/start-a-3d-printing-business.html', '2026-10-28'],
  ['https://moorecode.com/guides/3d-printing-for-dentists.html', '2026-10-28'],
  ['https://moorecode.com/guides/3d-printing-jewelry.html', '2026-10-27'],
  ['https://moorecode.com/guides/3d-printing-manufacturing.html', '2026-10-28'],
  ['https://moorecode.com/guides/painting-3d-prints.html', '2026-10-27'],
  ['https://moorecode.com/guides/carbon-3d-printing.html', '2026-10-27'],
  ['https://moorecode.com/blog/what-is-fdm-3d-printing.html', '2026-10-20'],
  ['https://moorecode.com/blog/when-resin-3d-printing-beats-fdm.html', '2026-10-08'],
]) {
  assert.ok(entries.has(location), `${location} must be listed in sitemap.xml`);
  assert.ok(entries.get(location) >= contentDate, `${location} lastmod must not predate ${contentDate}`);
}

for (const [location, expectedLastmod] of [
  ['https://moorecode.com/about.html', '2026-10-25'],
  ['https://moorecode.com/contact.html', '2026-10-25'],
  ['https://moorecode.com/calculators/3d-printing-price-calculator.html', '2026-10-25'],
  ['https://moorecode.com/blog/3d-printing-metal-processes-compared.html', '2026-10-23'],
  ['https://moorecode.com/blog/3d-printing-filament-pla-petg-tpu.html', '2026-10-27'],
  ['https://moorecode.com/blog/what-is-fdm-3d-printing.html', '2026-10-20'],
  ['https://moorecode.com/blog/desktop-3d-printing-setup-safe-workspace.html', '2026-10-27'],
  ['https://moorecode.com/blog/3d-printing-prototype-four-stage-test-plan.html', '2026-10-29'],
]) {
  assert.equal(entries.get(location), expectedLastmod, `${location} lastmod must match its verified public-content change`);
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isValidIsoDate = (value) => {
  if (!isoDate.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

for (const file of readdirSync(new URL('blog/', root), { withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.html')) continue;
  const html = readFileSync(new URL(`blog/${file.name}`, root), 'utf8');

  for (const [, json] of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const structuredData = JSON.parse(json);
    const nodes = Array.isArray(structuredData['@graph']) ? structuredData['@graph'] : [structuredData];

    for (const node of nodes.filter(({ '@type': type }) => type === 'BlogPosting')) {
      const location = node.url ?? node.mainEntityOfPage;
      assert.ok(entries.has(location), `${location} BlogPosting must have a sitemap lastmod`);
      assert.match(node.dateModified, isoDate, `${location} BlogPosting dateModified must be an ISO date`);
      assert.ok(
        isValidIsoDate(node.dateModified),
        `${location} BlogPosting dateModified must be a valid date`,
      );
      assert.ok(
        node.dateModified <= entries.get(location),
        `${location} BlogPosting dateModified must not be later than sitemap lastmod ${entries.get(location)}`,
      );
    }
  }
}

console.log('Sitemap contract passed: every URL resolves locally and changed content dates cannot regress.');
