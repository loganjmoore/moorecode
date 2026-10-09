import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../calculators/3d-printing-price-calculator.js', import.meta.url), 'utf8');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const calculate = context.globalThis.calculate3DPrintingPrice;

const zero = calculate({
  quantity: 1, materialGrams: 0, spoolPrice: 0, spoolWeight: 1000,
  printHours: 0, printerWatts: 0, energyRate: 0,
  laborHours: 0, laborRate: 0, machineRate: 0, otherCost: 0, failureRate: 0,
});
assert.deepEqual({ ...zero }, {
  material: 0, electricity: 0, labor: 0, machine: 0, other: 0,
  failureAllowance: 0, total: 0, perPart: 0,
});

const representative = calculate({
  quantity: 2, materialGrams: 100, spoolPrice: 25, spoolWeight: 1000,
  printHours: 4, printerWatts: 120, energyRate: 0.15,
  laborHours: 0.5, laborRate: 30, machineRate: 1.5, otherCost: 3, failureRate: 10,
});
assert.ok(Math.abs(representative.material - 5) < 1e-9);
assert.ok(Math.abs(representative.electricity - 0.144) < 1e-9);
assert.ok(Math.abs(representative.total - 38.6584) < 1e-9);
assert.ok(Math.abs(representative.perPart - 19.3292) < 1e-9);

const boundary = calculate({
  quantity: 1, materialGrams: 100, spoolPrice: 20, spoolWeight: 1000,
  printHours: 0, printerWatts: 0, energyRate: 0,
  laborHours: 0, laborRate: 0, machineRate: 0, otherCost: 0, failureRate: 100,
});
assert.equal(boundary.material, 2);
assert.equal(boundary.failureAllowance, 2);
assert.equal(boundary.total, 4);

assert.throws(() => calculate({ quantity: 0, spoolWeight: 1000 }), /Quantity/);
assert.throws(() => calculate({ quantity: 1, spoolWeight: 0 }), /Spool weight/);
assert.throws(() => calculate({ quantity: 1, spoolWeight: 1000, materialGrams: -1 }), /non-negative/);
assert.throws(() => calculate({ quantity: 1, spoolWeight: 1000, failureRate: 100.1 }), /cannot exceed 100%/);

console.log('3D-printing price calculator contract passed: zero, representative, boundary, and invalid inputs.');
