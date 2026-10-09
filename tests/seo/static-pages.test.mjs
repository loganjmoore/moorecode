import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const firstParagraphAfterH1 = (html) => html.slice(html.indexOf('</h1>') + 5).match(/<p[^>]*>(.*?)<\/p>/s)?.[1].replace(/<[^>]+>/g, '');
const publishedArticlePaths = readdirSync(new URL('../../blog/', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
  .map((entry) => `blog/${entry.name}`)
  .sort();

for (const path of [
  'index.html', 'projects.html', 'consulting.html', 'hobbies.html', 'youtube.html', 'about.html', 'contact.html',
  'blackjack-support.html', 'blackjack-privacy.html', 'posthog-privacy.html', 'blog/index.html',
  'calculators/3d-printing-price-calculator.html',
  ...publishedArticlePaths,
]) assert.match(read(path), /<script defer src="\/posthog-web\.js"><\/script>/, `${path} needs the shared analytics component`);

for (const path of [
  'index.html',
  'blog/index.html',
  'hobbies.html',
  'blackjack-privacy.html',
  ...publishedArticlePaths,
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

const blog = read('blog/index.html');
const sitemap = read('sitemap.xml');
const feed = read('feed.xml');
const llms = read('llms.txt');
const blogGraph = JSON.parse(blog.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const blogSchema = blogGraph.find((item) => item['@type'] === 'Blog');
const blogPostIds = new Set(blogSchema.blogPost.map((item) => item['@id']));
assert.match(blog, /<title>3D Printing Guides and Project Notes · MooreCode<\/title>/);
assert.match(blog, /<h1>3D printing guides and project notes<\/h1>/);
assert.match(blog, /The MooreCode blog is a collection of twelve practical guides/);
assert.equal((blog.match(/class="post-card"/g) || []).length, publishedArticlePaths.length);
for (const path of publishedArticlePaths) {
  const url = `https://moorecode.com/${path}`;
  assert.ok(blog.includes(`href="/${path}"`), `${path} must appear in the blog index`);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${path} must appear in sitemap.xml`);
  assert.ok(feed.includes(`<link>${url}</link>`), `${path} must appear in feed.xml`);
  assert.ok(llms.includes(`](${url})`), `${path} must appear in llms.txt`);
  assert.ok(blogPostIds.has(`${url}#post`), `${path} must appear in Blog JSON-LD`);
}
assert.match(read('index.html'), /href="blog\/">Blog<\/a>/);
assert.match(read('index.html'), /MooreCode is a personal website by Logan Moore/);
assert.match(read('index.html'), /includes twelve posts, with nine focused on 3D-printing processes/);
assert.match(read('index.html'), /href="\/blog\/3d-printing-filament-pla-petg-tpu\.html#basic-accessories"/);
assert.match(read('index.html'), /href="\/blog\/when-resin-3d-printing-beats-fdm\.html#dental-work"/);
assert.match(read('index.html'), /href="\/blog\/3d-printing-metal-processes-compared\.html"/);
assert.match(read('index.html'), /<h2 id="printing-questions-heading">What MooreCode does and who it is for<\/h2>/);
assert.match(read('index.html'), /For 3D printing rates, compare total delivered quotes/);
assert.match(read('index.html'), /A 3D printing price calculator is best used for an initial estimate/);
for (const link of [
  '/blog/',
  '/blog/3d-printing-filament-pla-petg-tpu.html',
  '/blog/what-is-fdm-3d-printing.html',
  '/blog/when-resin-3d-printing-beats-fdm.html',
  '/blog/3d-printing-metal-processes-compared.html',
  '/calculators/3d-printing-price-calculator.html',
]) assert.match(read('index.html'), new RegExp(`href="${link.replaceAll('.', '\\.')}`), `Homepage coverage needs ${link}`);
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
assert.match(filamentGuide, /<h2 id="basic-accessories">Which 3D printing accessories belong in a basic setup\?<\/h2>/);
assert.match(filamentGuide, /<h2 id="painting-and-finishing">Painting and finishing printed parts<\/h2>/);
assert.match(filamentGuide, /The best way to paint an FDM print is to remove supports and rough edges/);
assert.match(filamentGuide, /href="\/blog\/what-is-fdm-3d-printing\.html">FDM 3D printing process comparison<\/a>/);
assert.match(filamentGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing guide<\/a>/);

for (const question of [
  'Where should I look for 3D-printing files?',
  'How should I set up a safe desktop printing workspace?',
  'How should I test a 3D-printed prototype?',
  'Which 3D printing material should I use?',
  'Which metal printing process fits the job?',
  'How do I paint and finish a filament print?',
  'How do I diagnose an FDM setup problem?',
  'How should a service business compare invoicing app pricing?',
]) assert.ok(blog.includes(question), `Blog guide map needs: ${question}`);

for (const topic of ['Materials', 'Processes', 'Setup', 'Projects']) {
  assert.match(blog, new RegExp(`<h2 id="${topic.toLowerCase()}-topic">${topic}<\\/h2>`), `Blog index needs ${topic} grouping`);
}

const topicMap = blog.slice(blog.indexOf('<nav class="topic-groups"'), blog.indexOf('<ul class="blog-list">'));
for (const path of publishedArticlePaths) {
  assert.equal((topicMap.match(new RegExp(`href="/${path.replaceAll('.', '\\.')}"`, 'g')) || []).length, 1, `${path} must appear in exactly one topic group`);
}

const calculator = read('calculators/3d-printing-price-calculator.html');
assert.match(calculator, /<link rel="canonical" href="https:\/\/moorecode\.com\/calculators\/3d-printing-price-calculator\.html"/);
for (const input of ['quantity', 'materialGrams', 'printHours', 'spoolPrice', 'spoolWeight', 'printerWatts', 'energyRate', 'laborHours', 'laborRate', 'machineRate', 'otherCost', 'failureRate']) {
  assert.match(calculator, new RegExp(`<label for="${input}">`), `${input} needs a visible label`);
  assert.match(calculator, new RegExp(`id="${input}" name="${input}"`), `${input} label and control must match`);
}
assert.match(calculator, /Total direct cost<\/strong> =/);
assert.match(calculator, /Department of Energy energy-use lesson/);
assert.match(calculator, /Prusa's 3D-printing price calculator/);
assert.match(calculator, /href="\/contact\.html#project-inquiry"/);

const metalGuide = read('blog/3d-printing-metal-processes-compared.html');
assert.match(metalGuide, /<tr><th>Process<\/th><th>Typical material<\/th><th>Best-fit application<\/th><\/tr>/);
for (const linkedGuide of ['what-is-fdm-3d-printing.html', 'when-resin-3d-printing-beats-fdm.html']) {
  assert.match(metalGuide, new RegExp(`href="/blog/${linkedGuide.replaceAll('.', '\\.')}`));
  assert.match(read(`blog/${linkedGuide}`), /href="\/blog\/3d-printing-metal-processes-compared\.html"/);
}

const fdmGuide = read('blog/what-is-fdm-3d-printing.html');
const fdmSchemas = JSON.parse(fdmGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const fdmFaq = fdmSchemas.find((item) => item['@type'] === 'FAQPage');
const fdmFaqAnswers = new Map(fdmFaq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]));
assert.match(fdmGuide, /<title>FDM vs\. SLA vs\. SLS 3D Printing: How They Work<\/title>/);
assert.match(fdmGuide, /<h1>FDM vs\. SLA vs\. SLS 3D Printing: How They Work<\/h1>/);
assert.match(fdmGuide, /<h2>How do FDM, SLA 3D printing, and SLS 3D printing compare\?<\/h2>/);
assert.match(fdmGuide, /<h2>What is SLA 3D printing\?<\/h2>/);
assert.match(fdmGuide, /<h2>What is SLS 3D printing\?<\/h2>/);
assert.match(fdmGuide, /<h3>What is the difference between SLA and resin 3D printing\?<\/h3>/);
assert.match(fdmGuide, /<h3>Does SLS need support structures\?<\/h3>/);
for (const [question, answer] of [
  ['What is the difference between SLA and resin 3D printing?', 'Resin 3D printing is the broader category of processes that cure liquid photopolymer with light. SLA is one resin-printing method, traditionally using a laser to trace each layer.'],
  ['Does SLS need support structures?', 'SLS usually does not need attached support structures because the surrounding loose powder supports each layer during printing. The finished parts still need cooling and depowdering.'],
]) {
  assert.equal(fdmFaqAnswers.get(question), answer);
  assert.ok(fdmGuide.includes(`<p>${answer}</p>`), `${question} needs the same visible and structured answer`);
}
assert.match(fdmGuide, /budget FDM printers starting at about \$200/);
assert.match(fdmGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing versus FDM guide<\/a>/);

const resinGuide = read('blog/when-resin-3d-printing-beats-fdm.html');
const resinSchemas = JSON.parse(resinGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const resinFaq = resinSchemas.find((item) => item['@type'] === 'FAQPage');
const dentalAnswer = "No. A general-purpose hobby printer and resin are not substitutes for a validated dental workflow. Patient-contact appliances require a material, printer, processing workflow, intended use, and professional oversight that meet the manufacturer's instructions and applicable regulatory requirements.";
assert.match(resinGuide, /<h1>When Resin 3D Printing Beats FDM<\/h1>/);
assert.match(resinGuide, /<h2>What is resin 3D printing\?<\/h2>/);
assert.match(resinGuide, /<h2 id="dental-work">When is resin 3D printing appropriate for dental work\?<\/h2>/);
assert.match(resinGuide, /<h3>Can any resin 3D printer make dental appliances\?<\/h3>/);
assert.equal(resinFaq.mainEntity.find((item) => item.name === 'Can any resin 3D printer make dental appliances?').acceptedAnswer.text, dentalAnswer);
assert.ok(resinGuide.includes(`<p>${dentalAnswer}</p>`), 'Dental FAQ needs the same visible and structured answer');
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
  assert.ok(post.dateModified >= post.datePublished);
  assert.match(post.image, /^https:\/\/moorecode\.com\/blog\/images\/.+\.svg$/);
  assert.ok(faq.mainEntity.length >= 3 && faq.mainEntity.length <= 5);
  assert.match(html, /<link rel="alternate" type="application\/rss\+xml" title="moorecode" href="\/feed\.xml" \/>/);
}

console.log('SEO static-page contract passed: definitions, 3D-printing topic coverage and citations, Service entity, analytics privacy metadata, support path and blog discovery.');
