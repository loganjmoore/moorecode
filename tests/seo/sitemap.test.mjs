import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

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
  ['https://moorecode.com/', '2026-10-08'],
  ['https://moorecode.com/hobbies.html', '2026-10-07'],
  ['https://moorecode.com/posthog-privacy.html', '2026-10-06'],
  ['https://moorecode.com/blog/', '2026-10-08'],
  ['https://moorecode.com/blog/best-3d-printing-websites-files-2026.html', '2026-10-08'],
  ['https://moorecode.com/blog/desktop-3d-printing-setup-safe-workspace.html', '2026-10-08'],
  ['https://moorecode.com/blog/3d-printing-prototype-four-stage-test-plan.html', '2026-10-08'],
  ['https://moorecode.com/blog/3d-printing-metal-processes-compared.html', '2026-10-08'],
  ['https://moorecode.com/blog/3d-printing-filament-pla-petg-tpu.html', '2026-10-08'],
  ['https://moorecode.com/blog/what-is-fdm-3d-printing.html', '2026-10-08'],
  ['https://moorecode.com/blog/when-resin-3d-printing-beats-fdm.html', '2026-10-08'],
]) {
  assert.ok(entries.has(location), `${location} must be listed in sitemap.xml`);
  assert.ok(entries.get(location) >= contentDate, `${location} lastmod must not predate ${contentDate}`);
}

console.log('Sitemap contract passed: every URL resolves locally and changed content dates cannot regress.');
