import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const firstParagraphAfterH1 = (html) => html.slice(html.indexOf('</h1>') + 5).match(/<p[^>]*>(.*?)<\/p>/s)?.[1].replace(/<[^>]+>/g, '');

for (const path of [
  'hobbies.html',
  'blackjack-privacy.html',
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

const posts = [
  ['free-blackjack-basic-strategy-trainer-iphone.html', 'Free blackjack basic strategy trainer for iPhone compared'],
  ['simple-invoicing-app-pricing-service-businesses.html', 'Invoicing app pricing for service businesses, compared'],
  ['mileage-tracker-delivery-drivers-tax-deduction.html', 'Mileage tracker for delivery drivers: what the IRS lets you deduct'],
];
const blog = read('blog/index.html');
for (const [path, title] of posts) {
  assert.match(blog, new RegExp(`href="/blog/${path.replaceAll('.', '\\.')}">${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/a>`));
}
assert.match(read('index.html'), /href="blog\/">Blog<\/a>/);

console.log('SEO static-page contract passed: definitions, Service entity, support path and blog discovery.');
