import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../blog/3d-printing-rates-small-job-pricing.js', import.meta.url), 'utf8');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const calculate = context.globalThis.calculate3DPrintingRate;

assert.deepEqual({ ...calculate({
  materialCost: 5,
  printHours: 4,
  machineRate: 1.5,
  laborHours: 0.5,
  laborRate: 30,
  markup: 25,
}) }, { directCost: 26, price: 32.5 });

assert.deepEqual({ ...calculate({
  materialCost: 0,
  printHours: 0,
  machineRate: 0,
  laborHours: 0,
  laborRate: 0,
  markup: 0,
}) }, { directCost: 0, price: 0 });

const complete = { materialCost: 1, printHours: 1, machineRate: 1, laborHours: 1, laborRate: 1, markup: 0 };
assert.throws(() => calculate({ ...complete, materialCost: '' }), /Complete every calculator field/);
assert.throws(() => calculate({ ...complete, laborHours: -1 }), /non-negative/);
assert.throws(() => calculate({ ...complete, printHours: Infinity }), /finite/);
assert.throws(() => calculate({ ...complete, materialCost: 1e308, printHours: 1e308, machineRate: 1e308 }), /too large/);

console.log('3D-printing rates calculator contract passed: representative, zero, and invalid inputs.');
