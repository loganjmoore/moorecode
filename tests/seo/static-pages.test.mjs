import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const firstParagraphAfterH1 = (html) => html.slice(html.indexOf('</h1>') + 5).match(/<p[^>]*>(.*?)<\/p>/s)?.[1].replace(/<[^>]+>/g, '');

for (const path of [
  'index.html', 'projects.html', 'consulting.html', 'hobbies.html', 'youtube.html', 'about.html', 'contact.html',
  'blackjack-support.html', 'blackjack-privacy.html', 'posthog-privacy.html', 'blog/index.html',
  'blog/3d-printmaking-checklist-mirrored-art-inked-proof.html',
  'blog/fused-deposition-modelling-mistakes-to-fix.html',
  'blog/3d-printing-metal-processes-compared.html',
  'blog/3d-printing-filament-pla-petg-tpu.html',
  'blog/what-is-fdm-3d-printing.html',
  'blog/when-resin-3d-printing-beats-fdm.html',
  'blog/free-blackjack-basic-strategy-trainer-iphone.html',
  'blog/simple-invoicing-app-pricing-service-businesses.html',
  'blog/mileage-tracker-delivery-drivers-tax-deduction.html',
]) assert.match(read(path), /<script defer src="\/posthog-web\.js"><\/script>/, `${path} needs the shared analytics component`);

for (const path of [
  'index.html',
  'blog/index.html',
  'hobbies.html',
  'blackjack-privacy.html',
  'blog/3d-printmaking-checklist-mirrored-art-inked-proof.html',
  'blog/fused-deposition-modelling-mistakes-to-fix.html',
  'blog/3d-printing-metal-processes-compared.html',
  'blog/3d-printing-filament-pla-petg-tpu.html',
  'blog/what-is-fdm-3d-printing.html',
  'blog/when-resin-3d-printing-beats-fdm.html',
  'blog/free-blackjack-basic-strategy-trainer-iphone.html',
  'blog/simple-invoicing-app-pricing-service-businesses.html',
  'blog/mileage-tracker-delivery-drivers-tax-deduction.html',
]) {
  assert.match(firstParagraphAfterH1(read(path)), /\bis (?:a|an|the)\b/i, `${path} needs a title-adjacent entity definition`);
}

const consulting = read('consulting.html');
const graphs = [...consulting.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const service = graphs.flatMap((item) => item['@graph'] || [item]).find((item) => item['@type'] === 'Service');
assert.equal(service.name, 'Product and software consulting');
assert.equal(service.provider['@id'], 'https://moorecode.com/consulting.html#org');
assert.match(consulting, /Product and software consulting is a service provided by BrightPrompt Consulting LLC for clients\./);

const projects = read('projects.html');
const blackjackCard = projects.slice(projects.indexOf('<h3>Blackjack Now</h3>'), projects.indexOf('<h3>TILT</h3>'));
assert.match(blackjackCard, /href="blackjack-support\.html">Support<\/a>/);

const analyticsPrivacy = read('posthog-privacy.html');
assert.match(analyticsPrivacy, /<link rel="canonical" href="https:\/\/moorecode\.com\/posthog-privacy\.html">/);
const analyticsDescription = analyticsPrivacy.match(/<meta name="description" content="([^"]+)">/)?.[1];
assert.ok(analyticsDescription?.length >= 50 && analyticsDescription.length <= 160, 'Analytics privacy description must be 50–160 characters');
const analyticsSchema = JSON.parse(analyticsPrivacy.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(analyticsSchema['@type'], 'WebPage');
assert.equal(analyticsSchema.url, 'https://moorecode.com/posthog-privacy.html');

const posts = [
  ['3d-printmaking-checklist-mirrored-art-inked-proof.html', '3D Printmaking Checklist: Mirrored Art to Inked Proof'],
  ['fused-deposition-modelling-mistakes-to-fix.html', '7 Fused Deposition Modelling Mistakes to Fix'],
  ['3d-printing-metal-processes-compared.html', '3D Printing Metal: Four Processes Compared'],
  ['free-blackjack-basic-strategy-trainer-iphone.html', 'Free blackjack basic strategy trainer for iPhone compared'],
  ['simple-invoicing-app-pricing-service-businesses.html', 'Invoicing app pricing for service businesses, compared'],
  ['mileage-tracker-delivery-drivers-tax-deduction.html', 'Mileage tracker for delivery drivers: what the IRS lets you deduct'],
];
const blog = read('blog/index.html');
assert.match(blog, /<title>3D Printing Guides and Project Notes · MooreCode<\/title>/);
assert.match(blog, /<h1>3D printing guides and project notes<\/h1>/);
assert.match(blog, /The MooreCode blog is a collection of nine practical guides/);
assert.equal((blog.match(/class="post-card"/g) || []).length, 9);
for (const [path, title] of posts) {
  assert.match(blog, new RegExp(`href="/blog/${path.replaceAll('.', '\\.')}">${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/a>`));
}
assert.match(read('index.html'), /href="blog\/">Blog<\/a>/);
assert.match(read('index.html'), /MooreCode is a personal website by Logan Moore/);
assert.match(read('index.html'), /includes nine posts, with six focused on 3D-printing processes/);
assert.match(read('blog/3d-printmaking-checklist-mirrored-art-inked-proof.html'), /covers six stages from SVG to finished impression/);

const hobbies = read('hobbies.html');
for (const path of [
  'what-is-fdm-3d-printing.html',
  '3d-printing-filament-pla-petg-tpu.html',
  '3d-printing-metal-processes-compared.html',
]) assert.match(hobbies, new RegExp(`href="/blog/${path.replaceAll('.', '\\.')}`));

const filamentGuide = read('blog/3d-printing-filament-pla-petg-tpu.html');
assert.match(filamentGuide, /<h1>3D Printing Filament:/);
assert.match(filamentGuide, /<h2>Which 3D printing materials fit a desktop or home printer\?<\/h2>/);
assert.match(filamentGuide, /<h2>Why is PLA 3D printing the best place to start\?<\/h2>/);
assert.match(filamentGuide, /<h2>When is printing PETG worth the extra setup\?<\/h2>/);
assert.match(filamentGuide, /<h2>Which 3D printing accessories belong in a basic setup\?<\/h2>/);
assert.match(filamentGuide, /href="\/blog\/what-is-fdm-3d-printing\.html">FDM 3D printing process comparison<\/a>/);
assert.match(filamentGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing guide<\/a>/);

const fdmGuide = read('blog/what-is-fdm-3d-printing.html');
assert.match(fdmGuide, /<h1>What Is FDM 3D Printing\?/);
assert.match(fdmGuide, /<h2>How do FDM, SLA 3D printing, and SLS 3D printing compare\?<\/h2>/);
assert.match(fdmGuide, /budget FDM printers starting at about \$200/);
assert.match(fdmGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing versus FDM guide<\/a>/);

const resinGuide = read('blog/when-resin-3d-printing-beats-fdm.html');
assert.match(resinGuide, /<h1>When Resin 3D Printing Beats FDM<\/h1>/);
assert.match(resinGuide, /<h2>What is resin 3D printing\?<\/h2>/);
assert.match(resinGuide, /href="\/blog\/what-is-fdm-3d-printing\.html">FDM explainer<\/a>/);

for (const path of [
  'blog/3d-printmaking-checklist-mirrored-art-inked-proof.html',
  'blog/fused-deposition-modelling-mistakes-to-fix.html',
  'blog/3d-printing-metal-processes-compared.html',
]) {
  const html = read(path);
  const schemas = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const post = schemas.find((item) => item['@type'] === 'BlogPosting');
  const faq = schemas.find((item) => item['@type'] === 'FAQPage');
  assert.equal(post.datePublished, '2026-10-07');
  assert.equal(post.dateModified, '2026-10-07');
  assert.match(post.image, /^https:\/\/moorecode\.com\/blog\/images\/.+\.svg$/);
  assert.ok(faq.mainEntity.length >= 3 && faq.mainEntity.length <= 5);
  assert.match(html, /<link rel="alternate" type="application\/rss\+xml" title="moorecode" href="\/feed\.xml" \/>/);
}

console.log('SEO static-page contract passed: definitions, 3D-printing topic coverage and citations, Service entity, analytics privacy metadata, support path and blog discovery.');
