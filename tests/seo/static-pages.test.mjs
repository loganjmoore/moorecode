import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const firstParagraphAfterH1 = (html) => html.slice(html.indexOf('</h1>') + 5).match(/<p[^>]*>(.*?)<\/p>/s)?.[1].replace(/<[^>]+>/g, '');
const firstProseParagraph = (html) => html.slice(html.indexOf('<section class="prose">')).match(/<p[^>]*>(.*?)<\/p>/s)?.[1].replace(/<[^>]+>/g, '');
const questionHeadingCount = (html) => [...html.matchAll(/<h[1-6][^>]*>[^<]*\?[^<]*<\/h[1-6]>/gi)].length;
const directAnswer = (html) => html.match(/<section class="direct-answer"[\s\S]*?<\/section>/)?.[0] || '';
const publishedArticlePaths = readdirSync(new URL('../../blog/', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
  .map((entry) => `blog/${entry.name}`)
  .sort();
const intentGuidePaths = [
  'guides/3d-printing-at-home.html',
  'guides/3d-printing-accessories.html',
  'guides/start-a-3d-printing-business.html',
  'guides/3d-printing-for-dentists.html',
  'guides/3d-printing-jewelry.html',
  'guides/3d-printing-manufacturing.html',
  'guides/painting-3d-prints.html',
  'guides/carbon-3d-printing.html',
];

for (const path of [
  'index.html', 'projects.html', 'consulting.html', 'hobbies.html', 'youtube.html', 'about.html', 'contact.html',
  'blackjack-support.html', 'blackjack-privacy.html', 'posthog-privacy.html', 'blog/index.html',
  'calculators/3d-printing-price-calculator.html',
  ...publishedArticlePaths,
  ...intentGuidePaths,
]) assert.match(read(path), /<script defer src="\/posthog-web\.js"><\/script>/, `${path} needs the shared analytics component`);

for (const path of [
  'index.html',
  'blog/index.html',
  'hobbies.html',
  'blackjack-privacy.html',
  ...publishedArticlePaths,
  ...intentGuidePaths,
]) {
  assert.match(firstParagraphAfterH1(read(path)), /\bis (?:a|an|the)\b/i, `${path} needs a title-adjacent entity definition`);
}

for (const [path, definition] of [
  ['blog/3d-printing-filament-pla-petg-tpu.html', /^PLA 3D printing is a material-extrusion process/],
  ['blog/what-is-fdm-3d-printing.html', /^FDM 3D printing is a material-extrusion process/],
  ['blog/when-resin-3d-printing-beats-fdm.html', /^Resin 3D printing is a process/],
  ['blog/best-3d-printing-websites-files-2026.html', /^A 3D printing website is a library or marketplace/],
  ['blog/desktop-3d-printing-setup-safe-workspace.html', /^Desktop 3D printing is the production of physical parts/],
  ['blog/3d-printing-prototype-four-stage-test-plan.html', /^A 3D-printed prototype is a physical test part/],
]) {
  assert.match(firstProseParagraph(read(path)), definition, `${path} needs its entity definition in the opening prose`);
}

const consulting = read('consulting.html');
const graphs = [...consulting.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const service = graphs.flatMap((item) => item['@graph'] || [item]).find((item) => item['@type'] === 'Service');
assert.equal(service.name, 'Product and software consulting');
assert.equal(service.provider['@id'], 'https://moorecode.com/consulting.html#org');
assert.match(consulting, /BrightPrompt Consulting LLC is Logan Moore's product and software consulting practice\./);
assert.match(consulting, /<h2 id="capabilities-heading">What I can help with<\/h2>/);
assert.match(consulting, /<h2 id="selected-work-heading">Selected work<\/h2>/);
assert.match(consulting, /<h2>How to start<\/h2>/);
assert.equal((consulting.match(/href="\/contact\.html#project-inquiry"/g) || []).length, 2);

// About and Contact should describe the same person as the homepage, across visible and machine-readable surfaces.
for (const [path, pageType] of [['about.html', 'AboutPage'], ['contact.html', 'ContactPage']]) {
  const html = read(path);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const page = graph.find((item) => item['@type'] === pageType);
  const person = graph.find((item) => item['@type'] === 'Person');
  const homePerson = JSON.parse(read('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find((item) => item['@type'] === 'Person');
  const decode = (value) => value.replaceAll('&amp;', '&');
  const title = decode(html.match(/<title>([^<]+)<\/title>/)[1]);
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.equal(decode(html.match(/<meta property="og:title" content="([^"]+)"/)[1]), title);
  assert.equal(html.match(/<meta property="og:description" content="([^"]+)"/)[1], description);
  assert.equal(page.name, title);
  assert.equal(page.description, description);
  assert.equal(page.url, `https://moorecode.com/${path}`);
  assert.equal(page.about['@id'], homePerson['@id']);
  assert.equal(person.jobTitle, homePerson.jobTitle);
  assert.ok(html.match(/<h1>([^<]+)<\/h1>/)[1].includes(person.name), `${path} must visibly identify its person`);
}

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

const blackjackPrivacy = read('blackjack-privacy.html');
assert.match(blackjackPrivacy, /fonts\.googleapis\.com[^>]+rel="stylesheet" media="print" onload="this\.media='all'"/, 'Blackjack privacy must not block first paint on the web font');
assert.match(blackjackPrivacy, /<noscript><link href="https:\/\/fonts\.googleapis\.com[^>]+rel="stylesheet" \/><\/noscript>/, 'Blackjack privacy needs the web font when JavaScript is disabled');

const blog = read('blog/index.html');
const sitemap = read('sitemap.xml');
const feed = read('feed.xml');
const llms = read('llms.txt');
for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  assert.ok(llms.includes(`](${url})`), `${url} must appear in llms.txt`);
}
const decodeHtml = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const blogGraph = JSON.parse(blog.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const blogSchema = blogGraph.find((item) => item['@type'] === 'Blog');
const blogPostIds = new Set(blogSchema.blogPost.map((item) => item['@id']));
assert.match(blog, /<title>3D Printing Guides and Project Notes · MooreCode<\/title>/);
assert.match(blog, /<h1>3D printing guides and project notes<\/h1>/);
assert.match(blog, /The MooreCode blog is a collection of fifteen practical guides/);
assert.equal((blog.match(/class="post-card"/g) || []).length, publishedArticlePaths.length);
for (const path of publishedArticlePaths) {
  const url = `https://moorecode.com/${path}`;
  assert.ok(blog.includes(`href="/${path}"`), `${path} must appear in the blog index`);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${path} must appear in sitemap.xml`);
  assert.ok(feed.includes(`<link>${url}</link>`), `${path} must appear in feed.xml`);
  assert.ok(llms.includes(`](${url})`), `${path} must appear in llms.txt`);
  assert.ok(blogPostIds.has(`${url}#post`), `${path} must appear in Blog JSON-LD`);
}
const newestFeedLinks = [...feed.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)]
  .slice(0, 2)
  .map((match) => match[1]);
assert.deepEqual(newestFeedLinks, [
  'https://moorecode.com/blog/3d-printing-materials-after-pla-clamp-fails.html',
  'https://moorecode.com/blog/3d-printing-rates-small-job-pricing.html',
], 'The two October 21 posts must lead the feed in target order');
for (const [path, expectedTitle] of [
  ['blog/3d-printing-materials-after-pla-clamp-fails.html', '3D Printing Materials After a PLA Clamp Fails'],
  ['blog/3d-printing-rates-small-job-pricing.html', '3D Printing Rates: Price a Small Job Step by Step'],
]) {
  const article = read(path);
  const title = decodeHtml(article.match(/<title>([^<]+)<\/title>/)?.[1] || '');
  const description = decodeHtml(article.match(/<meta name="description" content="([^"]+)"/)?.[1] || '');
  const graph = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const posting = graph.find((item) => item['@type'] === 'BlogPosting');
  const faq = graph.find((item) => item['@type'] === 'FAQPage');
  assert.equal(title, expectedTitle);
  assert.ok(title.length <= 60, `${path} title must be at most 60 characters`);
  assert.ok(description.length <= 160, `${path} description must be at most 160 characters`);
  assert.equal(posting.datePublished, '2026-10-21');
  assert.equal(posting.dateModified, '2026-10-21');
  assert.match(posting.image, /^https:\/\/moorecode\.com\/blog\/images\/.+\.svg$/);
  assert.ok(faq.mainEntity.length >= 3 && faq.mainEntity.length <= 5, `${path} needs three to five FAQ entries`);
  for (const item of faq.mainEntity) {
    assert.ok(article.includes(`<h3>${item.name}</h3>`), `${path} must show FAQ question: ${item.name}`);
    assert.ok(article.includes(`<p>${item.acceptedAnswer.text}</p>`), `${path} must keep visible and structured FAQ answers aligned`);
  }
}
for (const match of llms.matchAll(/^- \[([^\]]+)\]\(https:\/\/moorecode\.com\/([^)]*)\): (.+)$/gm)) {
  let path = match[2] || 'index.html';
  if (path === 'blog') path = 'blog/index.html';
  if (path.endsWith('/')) path += 'index.html';
  const html = read(path);
  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]+)"/)?.[1] || '');
  assert.equal(match[1], title, `${path} title must stay current in llms.txt`);
  assert.equal(match[3], description, `${path} description must stay current in llms.txt`);
}
for (const [path, expectedTitle] of [
  ['blog/desktop-3d-printing-setup-safe-workspace.html', 'Desktop 3D Printing: Types, Materials & Uses | MooreCode'],
  ['guides/3d-printing-at-home.html', '3D Printing at Home: Setup, Safety & Projects | MooreCode'],
  ['guides/3d-printing-for-dentists.html', '3D Printing for Dentists: Materials & Workflow | MooreCode'],
  ['guides/painting-3d-prints.html', 'How to Paint 3D Prints: Prep to Finish | MooreCode'],
]) {
  const html = read(path);
  const title = decodeHtml(html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
  assert.equal(title, expectedTitle);
  assert.ok(title.length <= 60, `${path} title must be at most 60 characters`);
}
const homepage = read('index.html');
const homepageGraph = JSON.parse(homepage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
assert.match(homepage, /href="blog\/">Blog<\/a>/);
assert.match(homepage, /MooreCode is a personal website by Logan Moore/);
assert.match(homepage, /<title>Logan Moore — iOS &amp; Web Developer \| MooreCode<\/title>/);
assert.match(homepage, /<h2 id="products-heading">iOS and web products I build<\/h2>/);
assert.match(homepage, /<h2 id="consulting-heading">Product and software consulting<\/h2>/);
assert.ok(homepage.indexOf('id="products-heading"') < homepage.indexOf('id="coverage-heading"'));
assert.ok(homepage.indexOf('id="consulting-heading"') < homepage.indexOf('id="coverage-heading"'));
assert.ok(homepageGraph.some((item) => item['@type'] === 'Organization' && item.name === 'MooreCode'));
assert.ok(homepageGraph.some((item) => item['@type'] === 'Person' && item.name === 'Logan Moore'));
const homepageFaq = homepageGraph.find((item) => item['@type'] === 'FAQPage');
assert.ok(homepageFaq, 'Homepage visible questions need FAQPage structured data');
for (const question of [
  'What does MooreCode build?',
  'Who runs MooreCode?',
  'Which MooreCode guide fits my 3D printing project?',
  'When does SLA make more sense than FDM?',
  'When does SLS make more sense than FDM?',
]) {
  assert.ok(homepage.includes(`<h3>${question}</h3>`), `${question} needs a visible answer`);
  assert.ok(homepageFaq.mainEntity.some((item) => item.name === question), `${question} needs a structured answer`);
}
for (const [question, answer] of [
  ['When does SLA make more sense than FDM?', "MooreCode's process guide recommends SLA when fine surface detail, small features, or a smooth finish matters more than low material cost and simple cleanup. FDM is usually the better option for larger functional parts and quick, affordable revisions."],
  ['When does SLS make more sense than FDM?', "MooreCode's process guide recommends SLS when a part needs complex geometry, durable nylon behavior, or support-free nesting that would be difficult with FDM. Because SLS requires industrial equipment and powder handling, using a service bureau is often more practical than buying a machine."],
]) {
  assert.equal(homepageFaq.mainEntity.find((item) => item.name === question).acceptedAnswer.text, answer);
  assert.ok(homepage.includes(`<p>${answer.replace("MooreCode's process guide", `MooreCode's <a href="/blog/what-is-fdm-3d-printing.html">process guide</a>`)}</p>`), `${question} needs the same visible and structured answer`);
}
const printingGuideAnswer = homepageFaq.mainEntity.find((item) => item.name === 'Which MooreCode guide fits my 3D printing project?').acceptedAnswer.text;
for (const topic of ['accessories', 'PLA', 'PETG', 'TPU', 'price calculator', 'dental', 'jewelry', 'manufacturing', 'automotive parts']) {
  assert.match(printingGuideAnswer, new RegExp(topic, 'i'), `Homepage guide answer needs to address ${topic}`);
}
assert.ok(questionHeadingCount(homepage) >= 2, 'Homepage needs at least two question-style headings');
for (const link of [
  '/blog/',
  '/blog/3d-printing-filament-pla-petg-tpu.html',
  '/blog/what-is-fdm-3d-printing.html',
  '/blog/when-resin-3d-printing-beats-fdm.html',
  '/blog/3d-printing-metal-processes-compared.html',
  '/calculators/3d-printing-price-calculator.html',
]) assert.match(homepage, new RegExp(`href="${link.replaceAll('.', '\\.')}`), `Homepage coverage needs ${link}`);

const projectCollection = JSON.parse(projects.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const projectList = projectCollection.find((item) => item['@type'] === 'ItemList');
assert.match(projects, /<h1>iOS and web apps by Logan Moore<\/h1>/);
assert.match(firstParagraphAfterH1(projects), /^The MooreCode project collection is a portfolio/);
assert.match(projects, /<h2 id="ios-apps-heading">Shipped iOS apps<\/h2>/);
assert.match(projects, /<h2 id="web-products-heading">Web products<\/h2>/);
assert.match(projects, /<h2 id="project-consulting-heading">How this work translates to client projects<\/h2>/);
assert.equal((projects.match(/class="card"/g) || []).length, 11);
assert.equal((projects.match(/class="verified-facts"/g) || []).length, 11);
assert.equal(projectList.numberOfItems, 11);
assert.equal(projectList.itemListElement.length, 11);
assert.ok(questionHeadingCount(projects) >= 2, 'Projects page needs at least two question-style headings');
assert.match(projects, /As of October 13, 2026, this page lists 11 products: eight iOS apps and three web products\./);
assert.match(read('blog/3d-printmaking-checklist-mirrored-art-inked-proof.html'), /covers six stages from SVG to finished impression/);

const hobbies = read('hobbies.html');
for (const path of [
  'what-is-fdm-3d-printing.html',
  '3d-printing-filament-pla-petg-tpu.html',
  '3d-printing-metal-processes-compared.html',
]) assert.match(hobbies, new RegExp(`href="/blog/${path.replaceAll('.', '\\.')}`));

const filamentGuide = read('blog/3d-printing-filament-pla-petg-tpu.html');
const blogIndex = read('blog/index.html');
const selector = blogIndex.match(/<nav class="guide-map" aria-labelledby="printing-guide-selector">([\s\S]*?)<\/nav>/)?.[1];
assert.ok(selector, 'Inbound guide-selector anchors must reach the question navigation');
assert.match(selector, /<h2 id="printing-guide-selector">Start with the 3D printing guide that matches your job<\/h2>/);
for (const id of ['filament-materials', 'printing-accessories', 'home-printing-paint', 'printing-processes', 'resin-projects', 'rates-business', 'manufacturing-metal']) {
  assert.equal((blogIndex.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'Preserve a unique destination for #' + id);
}
for (const destination of [
  '/blog/3d-printing-filament-pla-petg-tpu.html',
  '/guides/3d-printing-at-home.html',
  '/guides/3d-printing-accessories.html',
  '/guides/start-a-3d-printing-business.html',
  '/guides/3d-printing-for-dentists.html',
  '/guides/3d-printing-jewelry.html',
  '/guides/3d-printing-manufacturing.html',
  '/guides/painting-3d-prints.html',
  '/guides/carbon-3d-printing.html',
  '/calculators/3d-printing-price-calculator.html',
]) {
  assert.ok(selector.includes(`href="${destination}"`), `Blog guide selector needs ${destination}`);
}
assert.match(filamentGuide, /href="\/blog\/#printing-guide-selector">3D printing process and project guide selector<\/a>/);
assert.match(filamentGuide, /<h1>PLA 3D printing:/);
const filamentLedeEnd = filamentGuide.indexOf('</p>', filamentGuide.indexOf('<p class="lede">')) + 4;
const filamentFirstSection = filamentGuide.indexOf('<section', filamentLedeEnd);
assert.equal(filamentFirstSection, filamentGuide.indexOf('<section class="direct-answer"', filamentLedeEnd), 'PLA quick start must sit directly under the intro');
const filamentQuickAnswer = directAnswer(filamentGuide);
assert.match(filamentQuickAnswer, /<h2 id="filament-quick-answer">PLA 3D printing: quick start<\/h2>/);
assert.match(filamentQuickAnswer, /<h3>PLA vs PETG<\/h3>/);
for (const property of ['Strength', 'Heat resistance', 'Ease of printing', 'Typical use']) {
  assert.ok(filamentQuickAnswer.includes(`<strong>${property}</strong>`), `PLA vs PETG comparison needs ${property}`);
}
assert.match(filamentQuickAnswer, /<strong>Verdict:<\/strong> choose PLA/);
assert.match(filamentQuickAnswer, /href="#tpu-filament">Jump to the existing TPU guidance<\/a>/);
assert.match(filamentGuide, /<h2 id="tpu-filament">When does TPU 3D printing filament make sense\?<\/h2>/);
assert.match(filamentGuide, /<th>Rank<\/th><th>Accessory<\/th><th>What it is for<\/th><th>Budget weight<\/th>/);
assert.match(filamentGuide, /<h2>Which 3D printing materials fit a desktop or home printer\?<\/h2>/);
assert.match(filamentGuide, /MooreCode's materials guide recommends PLA, PETG, or TPU/);
assert.match(filamentGuide, /<h2>Why is PLA 3D printing the best place to start\?<\/h2>/);
assert.match(filamentGuide, /<h2>When is printing PETG worth the extra setup\?<\/h2>/);
assert.match(filamentGuide, /<h2 id="basic-accessories">Which 3D printing accessories belong in a basic setup\?<\/h2>/);
assert.match(filamentGuide, /<h2 id="painting-and-finishing">Painting and finishing printed parts<\/h2>/);
assert.match(filamentGuide, /The best way to paint an FDM print is to remove supports and rough edges/);
assert.match(filamentGuide, /href="\/blog\/what-is-fdm-3d-printing\.html">FDM 3D printing process comparison<\/a>/);
assert.match(filamentGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing guide<\/a>/);
assert.match(filamentGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);

const scanToPrintGuide = read('blog/3d-scanning-to-printing-repair-scale-slice.html');
const scanAnswer = directAnswer(scanToPrintGuide);
assert.match(scanAnswer, /<h2 id="scan-to-print-quick-answer">What is the best way to turn a 3D scan into a print\?<\/h2>/);
assert.match(scanAnswer, /The best option is a measured workflow rather than a single scanner or printer/);
assert.match(scanAnswer, /MooreCode's scan-to-print guide walks through that sequence/);
assert.match(scanToPrintGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);

for (const routeLabel of [
  'Set up 3D printing at home',
  'Start PLA 3D printing',
  'Choose 3D printing accessories',
  'Start a 3D printing business',
  'Calculate 3D printing rates',
  'Paint a 3D print',
  'Plan 3D printing for a dental practice or lab',
  'Make a 3D-printed jewelry master',
  'Understand 3D printing in manufacturing',
  'Understand carbon 3D printing',
  'Compare desktop 3D printer categories',
  'Find 3D-printing files',
]) assert.ok(selector.includes(routeLabel), `Blog guide map needs: ${routeLabel}`);

assert.match(blog, /<h2 id="printing-topic">3D printing guides<\/h2>/);
assert.match(blog, /<h2 id="software-topic">Software and product notes<\/h2>/);
assert.match(blog, /Use the <a href="\/calculators\/3d-printing-price-calculator\.html">3D printing price calculator<\/a>/);
assert.match(blog, /<a href="\/consulting\.html">explore product and software consulting<\/a>/);

const topicMap = blog.slice(blog.indexOf('<nav class="topic-groups"'), blog.indexOf('<ul class="blog-list">'));
for (const path of publishedArticlePaths) {
  assert.equal((topicMap.match(new RegExp(`href="/${path.replaceAll('.', '\\.')}"`, 'g')) || []).length, 1, `${path} must appear in exactly one topic group`);
}

const calculator = read('calculators/3d-printing-price-calculator.html');
const calculatorTitle = calculator.match(/<title>([^<]+)<\/title>/)[1].replaceAll('&amp;', '&');
assert.ok(calculatorTitle.length < 60, `Calculator title must be under 60 characters, got ${calculatorTitle.length}`);
assert.ok(calculatorTitle.startsWith('3D Print Cost & Price Calculator'));
assert.match(calculator, /This free browser tool totals your editable/);
assert.match(calculator, /<link rel="canonical" href="https:\/\/moorecode\.com\/calculators\/3d-printing-price-calculator\.html"/);
for (const input of ['quantity', 'materialGrams', 'printHours', 'spoolPrice', 'spoolWeight', 'printerWatts', 'energyRate', 'laborHours', 'laborRate', 'machineRate', 'otherCost', 'failureRate', 'pricingPercentage']) {
  assert.match(calculator, new RegExp(`<label for="${input}">`), `${input} needs a visible label`);
  assert.match(calculator, new RegExp(`id="${input}" name="${input}"`), `${input} label and control must match`);
}
assert.match(calculator, /Total direct cost<\/strong> =/);
assert.match(calculator, /Price with markup<\/strong> = direct cost × \(1 \+ markup ÷ 100\)/);
assert.match(calculator, /Price for target gross margin<\/strong> = direct cost ÷ \(1 - margin ÷ 100\)/);
assert.match(calculator, /Suggested selling price/);
assert.match(calculator, /Worked fictional example/);
assert.match(calculator, /<section class="calculator-faq" id="business-pricing"/);
assert.match(calculator, /<h3>How do you start pricing a 3D printing business\?<\/h3>/);
const calculatorSchemas = JSON.parse(calculator.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
assert.ok(calculatorSchemas.some((item) => item['@type'] === 'WebApplication'));
const calculatorFaq = calculatorSchemas.find((item) => item['@type'] === 'FAQPage');
for (const question of ['How much should I charge for a 3D print?', 'What is the difference between markup and margin?', 'Is filament cost the same as the price of a 3D print?']) {
  assert.ok(calculator.includes(`<h3>${question}</h3>`), `${question} needs a visible answer`);
  assert.ok(calculatorFaq.mainEntity.some((item) => item.name === question), `${question} needs a structured answer`);
}
const calculatorPriceAnswer = 'The MooreCode 3D Printing Price Calculator starts with the direct cost of material, electricity, labor, machine time, failed-print allowance, and other known costs. Use either a markup or target gross margin to calculate a suggested selling price, then confirm taxes, shipping, marketplace fees, and overhead separately before quoting a customer.';
assert.equal(calculatorFaq.mainEntity.find((item) => item.name === 'How much should I charge for a 3D print?').acceptedAnswer.text, calculatorPriceAnswer);
assert.ok(calculator.includes(`<p>${calculatorPriceAnswer}</p>`), 'Calculator price answer needs the same visible and structured copy');
assert.match(calculator, /MooreCode is Logan Moore's site for practical maker guides/);
assert.match(calculator, /Department of Energy energy-use lesson/);
assert.match(calculator, /Prusa's 3D-printing price calculator/);
assert.match(calculator, /href="\/contact\.html#project-inquiry"/);

const metalGuide = read('blog/3d-printing-metal-processes-compared.html');
const metalAnswer = directAnswer(metalGuide);
const metalEntityDefinition = metalGuide.match(/<p class="entity-definition">([\s\S]*?)<\/p>/)?.[1] || '';
for (const process of ['laser powder bed fusion', 'binder jetting', 'metal FFF', 'directed energy deposition']) {
  assert.match(metalEntityDefinition, new RegExp(process, 'i'), `Metal title-adjacent definition needs ${process}`);
}
assert.match(
  metalGuide,
  /<p class="process-decision">Which method fits which part\?[\s\S]*?<\/p>\s*<table>/,
  'Metal process decision line must sit directly above the comparison table',
);
assert.ok(metalGuide.indexOf(metalAnswer) < metalGuide.indexOf('<h2 id="manufacturing">'), 'Metal direct answer needs to stay near the top');
assert.match(metalAnswer, /<h2[^>]*>Metal 3D printing methods: quick answer<\/h2>/);
for (const process of ['laser powder bed fusion', 'binder jetting', 'metal FFF', 'directed energy deposition']) {
  assert.match(metalAnswer, new RegExp(process, 'i'), `Metal direct answer needs ${process}`);
}
for (const link of ['/blog/what-is-fdm-3d-printing.html', '/calculators/3d-printing-price-calculator.html']) {
  assert.ok(metalAnswer.includes(`href="${link}"`), `Metal direct answer needs ${link}`);
}
assert.match(metalGuide, /<h2 id="manufacturing">What is 3D printing in manufacturing\?<\/h2>/);
assert.match(metalGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);
assert.match(metalGuide, /MooreCode compares the main metal 3D printing processes/);
assert.match(metalGuide, /<tr><th>Process<\/th><th>Typical material<\/th><th>Best-fit application<\/th><\/tr>/);
for (const linkedGuide of ['what-is-fdm-3d-printing.html', 'when-resin-3d-printing-beats-fdm.html']) {
  assert.match(metalGuide, new RegExp(`href="/blog/${linkedGuide.replaceAll('.', '\\.')}`));
  assert.match(read(`blog/${linkedGuide}`), /href="\/blog\/3d-printing-metal-processes-compared\.html"/);
}

const fdmGuide = read('blog/what-is-fdm-3d-printing.html');
const fdmSchemas = JSON.parse(fdmGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const fdmFaq = fdmSchemas.find((item) => item['@type'] === 'FAQPage');
const fdmFaqAnswers = new Map(fdmFaq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]));
assert.match(fdmGuide, /<title>What Is FDM 3D Printing\? How It Works<\/title>/);
assert.match(fdmGuide, /<h1>What Is FDM 3D Printing\?<\/h1>/);
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
assert.match(fdmGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);
assert.match(fdmGuide, /SLA is the best fit when visible finish or small detail controls success/);
assert.match(fdmGuide, /SLS is the best fit when complex geometry, nylon behavior, and support-free nesting justify/);
assert.match(fdmGuide, /href="\/blog\/desktop-3d-printing-setup-safe-workspace\.html">safe desktop 3D printing setup guide<\/a>/);
assert.match(fdmGuide, /href="\/blog\/when-resin-3d-printing-beats-fdm\.html">resin 3D printing versus FDM guide<\/a>/);

const desktopGuide = read('blog/desktop-3d-printing-setup-safe-workspace.html');
const desktopAnswer = directAnswer(desktopGuide);
assert.ok(desktopGuide.indexOf(desktopAnswer) < desktopGuide.indexOf('<h2>Desktop 3D printer categories compared'), 'Desktop definition needs to stay near the top');
assert.match(desktopAnswer, /<h2[^>]*>Desktop 3D printing: quick definition<\/h2>/);
for (const requirement of ['filament', 'resin', 'ventilation']) {
  assert.match(desktopAnswer, new RegExp(requirement, 'i'), `Desktop direct answer needs ${requirement}`);
}
for (const link of ['/blog/what-is-fdm-3d-printing.html', '/blog/3d-printing-filament-pla-petg-tpu.html']) {
  assert.ok(desktopAnswer.includes(`href="${link}"`), `Desktop direct answer needs ${link}`);
}
assert.match(desktopGuide, /<h1>What is desktop 3D printing\?<\/h1>/);
assert.match(desktopGuide, /<h2>Desktop 3D printer categories compared<\/h2>/);
assert.match(desktopGuide, /<h2>What does desktop 3D printing cost\?<\/h2>/);
assert.match(desktopGuide, /<h2>What is the best desktop 3D printing setup\?<\/h2>/);
assert.match(desktopGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);
assert.match(desktopGuide, /MooreCode's workspace guide recommends a rigid, level surface/);
for (const requirement of ['rigid, level surface', 'source-control ventilation', 'an enclosure', 'maintained smoke alarm']) {
  assert.ok(desktopGuide.includes(requirement), `Desktop setup answer needs: ${requirement}`);
}

const scanGuide = read('blog/3d-printing-prototype-four-stage-test-plan.html');
const prototypeAnswer = directAnswer(scanGuide);
assert.ok(scanGuide.indexOf(prototypeAnswer) < scanGuide.indexOf('<h2 id="scan-to-print">'), 'Prototype direct answer needs to stay near the top');
assert.match(prototypeAnswer, /<h2[^>]*>Prototype test plan: quick answer<\/h2>/);
for (const stage of ['visual', 'form-and-fit', 'functional', 'pilot']) {
  assert.match(prototypeAnswer, new RegExp(stage, 'i'), `Prototype direct answer needs ${stage}`);
}
assert.match(prototypeAnswer, /test form, fit, and function before committing to production/i);
for (const link of ['/blog/what-is-fdm-3d-printing.html', '/calculators/3d-printing-price-calculator.html']) {
  assert.ok(prototypeAnswer.includes(`href="${link}"`), `Prototype direct answer needs ${link}`);
}
const prototypeCostSection = scanGuide.slice(scanGuide.indexOf('<h2 id="prototype-print-cost">'), scanGuide.indexOf('<h2 id="scan-to-print">'));
assert.match(prototypeCostSection, /<h2 id="prototype-print-cost">What drives prototype print cost\?<\/h2>/);
for (const factor of ['Material choice', 'Design complexity', 'Part size', 'Printing technology']) {
  assert.ok(prototypeCostSection.includes(`<strong>${factor}:</strong>`), `Prototype cost section needs ${factor}`);
}
assert.match(prototypeCostSection, /href="\/calculators\/3d-printing-price-calculator\.html">MooreCode 3D printing price calculator<\/a>/);
assert.match(scanGuide, /<h2 id="scan-to-print">How do you turn a 3D scan into a printable prototype\?<\/h2>/);

const scanningGuide = read('blog/3d-scanning-to-printing-repair-scale-slice.html');
const scanningSchemas = JSON.parse(scanningGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const scanningPost = scanningSchemas.find((item) => item['@type'] === 'BlogPosting');
const scanningFaq = scanningSchemas.find((item) => item['@type'] === 'FAQPage');
assert.equal(scanningPost.datePublished, '2026-10-17');
assert.equal(scanningPost.dateModified, '2026-10-17');
assert.equal(scanningPost.image, 'https://moorecode.com/blog/images/3d-scanning-to-printing-repair-scale-slice.svg');
assert.equal(scanningFaq.mainEntity.length, 4);
assert.match(firstProseParagraph(scanningGuide), /^3D scanning and printing is a workflow/);
assert.match(scanningGuide, /100\.0 ÷ 94\.6 = 1\.0571/);
assert.match(scanningGuide, /2 parts at 4 print-hours each, which is 8 printer-hours/);
for (const link of [
  '/blog/3d-printing-prototype-four-stage-test-plan.html',
  '/blog/when-resin-3d-printing-beats-fdm.html',
  '/blog/3d-printing-filament-pla-petg-tpu.html',
  '/calculators/3d-printing-price-calculator.html',
]) assert.match(scanningGuide, new RegExp(`href="${link.replaceAll('.', '\\.')}`));

const filamentAnswer = directAnswer(filamentGuide);
assert.ok(filamentGuide.indexOf(filamentAnswer) < filamentGuide.indexOf('<h2>Which 3D printing materials'), 'Filament direct answer needs to stay near the top');
assert.match(filamentAnswer, /<h2[^>]*>PLA 3D printing: quick start<\/h2>/);
for (const material of ['PLA', 'PETG', 'TPU']) {
  assert.match(filamentAnswer, new RegExp(material), `Filament direct answer needs ${material}`);
}
assert.ok(filamentAnswer.includes('href="#tpu-filament"'), 'Filament direct answer needs to hand off to the existing TPU section');

const intentGuides = new Map(intentGuidePaths.map((path) => [path, read(path)]));
for (const [path, html] of intentGuides) {
  const canonicalPath = `https://moorecode.com/${path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonicalPath}"`), `${path} needs a self-canonical`);
  assert.ok(blogIndex.includes(`href="/${path}"`), `${path} needs a prominent blog-index link`);
  assert.ok(sitemap.includes(`<loc>${canonicalPath}</loc>`), `${path} needs sitemap discovery`);
  assert.ok(llms.includes(`](${canonicalPath})`), `${path} needs llms.txt discovery`);
}
assert.match(intentGuides.get('guides/3d-printing-accessories.html'), /3D printing accessories ranked by usefulness[\s\S]*<ol>[\s\S]*Accessory type/);
assert.match(directAnswer(intentGuides.get('guides/start-a-3d-printing-business.html')), /Seven 3D printing business ideas[\s\S]*<ol>/);
assert.match(directAnswer(intentGuides.get('guides/3d-printing-for-dentists.html')), /Dental 3D printer options compared[\s\S]*Printer category/);
assert.match(directAnswer(intentGuides.get('guides/3d-printing-jewelry.html')), /3D-printed jewelry in seven steps[\s\S]*<ol>/);
assert.match(directAnswer(intentGuides.get('guides/3d-printing-manufacturing.html')), /3D printing versus traditional manufacturing[\s\S]*Production question/);
assert.match(directAnswer(intentGuides.get('guides/painting-3d-prints.html')), /Paint a 3D print in eight steps[\s\S]*<ol>/);
assert.match(directAnswer(intentGuides.get('guides/carbon-3d-printing.html')), /Carbon-fiber printing versus Carbon DLS[\s\S]*How it works/);
assert.match(directAnswer(intentGuides.get('guides/3d-printing-at-home.html')), /Eight useful first projects[\s\S]*<ol>/);

const invoicingGuide = read('blog/simple-invoicing-app-pricing-service-businesses.html');
assert.match(invoicingGuide, /Assessment method and date:/);
assert.match(invoicingGuide, /checked these plans on October 13, 2026/);
assert.match(invoicingGuide, /The 60-invoice business and its per-invoice results are illustrative calculations, not quotes/);

const resinGuide = read('blog/when-resin-3d-printing-beats-fdm.html');
const resinSchemas = JSON.parse(resinGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const resinFaq = resinSchemas.find((item) => item['@type'] === 'FAQPage');
const dentalAnswer = "No. A general-purpose hobby printer and resin are not substitutes for a validated dental workflow. Patient-contact appliances require a material, printer, processing workflow, intended use, and professional oversight that meet the manufacturer's instructions and applicable regulatory requirements.";
assert.match(resinGuide, /<h1>When Resin 3D Printing Beats FDM<\/h1>/);
assert.match(resinGuide, /<h2>What is resin 3D printing\?<\/h2>/);
assert.match(resinGuide, /<h2 id="dental-work">When is resin 3D printing appropriate for dental work\?<\/h2>/);
assert.match(resinGuide, /<h2 id="jewelry-work">How should a 3D-printed jewelry master be planned\?<\/h2>/);
assert.match(resinGuide, /<h3>Can any resin 3D printer make dental appliances\?<\/h3>/);
assert.equal(resinFaq.mainEntity.find((item) => item.name === 'Can any resin 3D printer make dental appliances?').acceptedAnswer.text, dentalAnswer);
assert.ok(resinGuide.includes(`<p>${dentalAnswer}</p>`), 'Dental FAQ needs the same visible and structured answer');
assert.match(resinGuide, /href="\/blog\/what-is-fdm-3d-printing\.html">FDM explainer<\/a>/);
assert.match(resinGuide, /MooreCode is Logan Moore's site for practical 3D printing guides/);

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
