import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../resources/prototype-brief.html', import.meta.url), 'utf8');
const description = html.match(/<meta name="description" content="([^"]+)" \/>/)?.[1];
const canonical = html.match(/<link rel="canonical" href="([^"]+)" \/>/)?.[1];
const jsonLd = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];

assert.ok(description, 'Prototype brief must have a meta description');
assert.ok(description.length >= 50 && description.length <= 160, 'Meta description must be 50–160 characters');
assert.match(description, /\b(?:use|download|print|create|start)\b/i, 'Meta description must include a call to action');
assert.equal(canonical, 'https://moorecode.com/resources/prototype-brief.html');
assert.ok(jsonLd, 'Prototype brief must have JSON-LD structured data');

const schema = JSON.parse(jsonLd);
assert.equal(schema['@context'], 'https://schema.org');
assert.equal(schema['@type'], 'WebPage');
assert.equal(schema.url, canonical);
assert.equal(schema.description, description);

console.log('Prototype brief metadata contract passed: description, canonical URL, and WebPage JSON-LD.');
