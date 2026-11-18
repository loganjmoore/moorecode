import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const readPage = (name) => readFileSync(new URL(`../../guides/${name}`, import.meta.url), 'utf8');

const jewelry = readPage('3d-printing-jewelry.html');
const jewelryComparison = jewelry.indexOf('Resin, filament, and casting compared');
const jewelryWorksheet = jewelry.indexOf('3D-printed jewelry design review worksheet');
assert.ok(jewelryWorksheet > jewelryComparison, 'Jewelry worksheet must follow the route comparison');
for (const field of [
  'Intended route', 'Final dimensions', 'Smallest critical feature', 'Openings or stone seats',
  'Visible surfaces', 'Support-sensitive surfaces', 'Mirrored or paired parts', 'Target weight',
  'Material and printer compatibility evidence', 'Required cleanup', 'Skin-contact status',
  'Caster and material confirmation', 'Pass/fail test for the first small print',
]) assert.match(jewelry, new RegExp(field.replace('/', '\\/')));
assert.match(jewelry, /Fictional worked example: pendant fit prototype/);
assert.match(jewelry, /not a customer result/);
assert.match(jewelry, /<button type="button" onclick="window\.print\(\)">Print this worksheet<\/button>/);
assert.match(jewelry, /Need a software workflow for a configurable product or design-review tool\? Discuss the product workflow\./);

const manufacturing = readPage('3d-printing-manufacturing.html');
const manufacturingComparison = manufacturing.indexOf('3D printing versus traditional manufacturing');
const manufacturingWorksheet = manufacturing.indexOf('Part-screening brief: print, outsource, or use another process');
assert.ok(manufacturingWorksheet > manufacturingComparison, 'Manufacturing worksheet must follow the process comparison');
for (const field of [
  'Part function', 'Revision stage', 'Quantity now and later', 'Material requirement',
  'Load and environment', 'Tolerance and finish', 'Inspection method', 'Deadline',
  'Geometry reason for additive manufacturing', 'Required post-processing',
  'Does a qualified process already exist?', 'Final decision',
]) assert.ok(manufacturing.includes(field), `Manufacturing worksheet must include ${field}`);
assert.match(manufacturing, /Fictional worked example: assembly fixture fit check/);
assert.match(manufacturing, /This is not a customer result/);
assert.match(manufacturing, /What to send with a prototype request/);
assert.match(manufacturing, /href="\/resources\/prototype-brief\.html"/);
assert.match(manufacturing, /href="\/consulting\.html"/);
assert.match(manufacturing, /<button type="button" onclick="window\.print\(\)">Print this worksheet<\/button>/);

const styles = readFileSync(new URL('../../style.css', import.meta.url), 'utf8');
assert.match(styles, /@media print[\s\S]*\.worksheet-guide \.prose > :not\(\.print-worksheet\)/);
assert.match(styles, /\.worked-example \{ break-before: page;/);

console.log('Guide worksheet contract passed: fields, examples, print actions, placement, and internal next steps.');
