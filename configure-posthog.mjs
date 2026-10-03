import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(directory, 'posthog-site.json'), 'utf8'));
const output = resolve(directory, site.publicDir);
const key = process.env.POSTHOG_PROJECT_TOKEN || process.env.VITE_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '';
if (key && !/^phc_[A-Za-z0-9_-]+$/.test(key)) throw new Error('POSTHOG_PROJECT_TOKEN must be a public ingestion token, never a personal API key');
const region = process.env.POSTHOG_REGION || 'us';
if (!['us', 'eu'].includes(region)) throw new Error('POSTHOG_REGION must be us or eu');
writeFileSync(join(output, 'posthog-config.json'), JSON.stringify({
  key, host: `https://${region}.i.posthog.com`, product: site.product,
  surface: site.surface, hosts: site.hosts, consentKey: site.consentKey || '', consentKind: site.consentKind || '',
  sharedDomain: site.sharedDomain || '', publicOnly: site.publicOnly === true, release: process.env.RENDER_GIT_COMMIT || '',
}, null, 2) + '\n');

// Static generators and prerenderers can emit their own HTML instead of the
// app shell. Stamp the published tree after a build as well as its sources.
function stamp(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next'].includes(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) stamp(path);
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      if (!html.includes('src="/posthog-web.js"') && /<\/head>/i.test(html)) writeFileSync(path, html.replace(/<\/head>/i, '<script defer src="/posthog-web.js"></script>\n</head>'));
    }
  }
}
stamp(output);
if (process.argv.includes('--dist')) stamp(resolve(directory, site.distDir || '../dist'));
console.log(`PostHog ${key ? 'configured' : 'disabled (no public token)'} for ${site.product}`);
