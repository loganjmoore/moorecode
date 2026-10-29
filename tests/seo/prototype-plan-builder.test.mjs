import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../../blog/3d-printing-prototype-four-stage-test-plan.html', import.meta.url), 'utf8');
const script = html.slice(html.indexOf('(() => {'), html.lastIndexOf('})();') + 5);

class Element {
  constructor({ id = '', name = '', value = '', hidden = false, dataset = {} } = {}) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.hidden = hidden;
    this.dataset = dataset;
    this.textContent = '';
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.(event);
  }
}

const fieldNames = ['question', 'stage', 'specimen', 'process', 'method', 'measurement', 'threshold', 'result', 'nextAction'];
const fields = Object.fromEntries(fieldNames.map((name) => [name, new Element({ name })]));
const summaryItems = fieldNames.map((name) => new Element({ dataset: { planSummary: name } }));
const form = new Element({ id: 'prototype-plan-form' });
form.elements = fields;
form.valid = true;
form.reportValidity = () => form.valid;
const output = new Element({ id: 'prototype-plan-output', hidden: true });
output.querySelectorAll = () => summaryItems;
output.scrollIntoView = (options) => { output.scrollOptions = options; };
const status = new Element({ id: 'prototype-plan-status' });
const exampleNote = new Element({ id: 'prototype-plan-example-note', hidden: true });
const loadExample = new Element({ id: 'prototype-load-example' });
const print = new Element({ id: 'prototype-print' });
const elements = new Map([
  [form.id, form],
  [output.id, output],
  [status.id, status],
  [exampleNote.id, exampleNote],
  [loadExample.id, loadExample],
  [print.id, print],
]);

class FormData {
  constructor(target) {
    this.values = fieldNames.map((name) => [name, target.elements[name].value]);
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }
}

let printCalls = 0;
vm.runInNewContext(script, {
  document: { getElementById: (id) => elements.get(id) },
  FormData,
  window: { print: () => { printCalls += 1; } },
});

loadExample.dispatch('click');
assert.equal(fields.stage.value, 'Functional');
assert.match(fields.specimen.value, /Three PETG brackets/);
assert.match(fields.method.value, /100 N.*50 cycles/);
assert.match(fields.threshold.value, /50\.0 ± 0\.2 mm/);
assert.equal(fields.result.value, 'Pin spacing measured 50.3 mm; load and cycle results not recorded.');
assert.match(status.textContent, /^Fictional sensor-bracket example loaded/);

let prevented = false;
form.dispatch('submit', { preventDefault: () => { prevented = true; } });
assert.equal(prevented, true);
assert.equal(output.hidden, false);
assert.equal(exampleNote.hidden, false);
assert.equal(output.scrollOptions.block, 'start');
assert.equal(summaryItems.find(({ dataset }) => dataset.planSummary === 'question').textContent, fields.question.value);

fields.question.value = '<img src=x onerror=alert(1)>';
form.dispatch('input');
assert.equal(output.hidden, true);
assert.equal(exampleNote.hidden, true);
assert.match(status.textContent, /^Draft changed/);
form.dispatch('submit', { preventDefault() {} });
assert.equal(exampleNote.hidden, true);
assert.equal(summaryItems.find(({ dataset }) => dataset.planSummary === 'question').textContent, fields.question.value);

form.dispatch('reset');
assert.equal(output.hidden, true);
assert.equal(status.textContent, 'Draft cleared.');

form.valid = false;
print.dispatch('click');
assert.equal(printCalls, 0, 'Invalid plans must not open the print dialog');
form.valid = true;
print.dispatch('click');
assert.equal(printCalls, 1);
assert.equal(output.hidden, false);

console.log('Prototype test-plan builder contract passed: local example, safe summary, reset, validation, and print behavior.');
