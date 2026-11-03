(() => {
  function nonNegativeNumber(value) {
    if (value === null || (typeof value === 'string' && value.trim() === '')) {
      throw new RangeError('Complete every calculator field. Enter zero for a cost you do not include.');
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new RangeError('Calculator values must be finite and non-negative.');
    }
    return parsed;
  }

  function calculate3DPrintingRate(values) {
    const materialCost = nonNegativeNumber(values.materialCost);
    const printHours = nonNegativeNumber(values.printHours);
    const machineRate = nonNegativeNumber(values.machineRate);
    const laborHours = nonNegativeNumber(values.laborHours);
    const laborRate = nonNegativeNumber(values.laborRate);
    const markup = nonNegativeNumber(values.markup);
    const directCost = materialCost + (printHours * machineRate) + (laborHours * laborRate);
    const price = directCost * (1 + markup / 100);
    if (![directCost, price].every(Number.isFinite)) {
      throw new RangeError('These values are too large to calculate. Reduce the amounts and try again.');
    }
    return { directCost, price };
  }

  globalThis.calculate3DPrintingRate = calculate3DPrintingRate;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('rate-calculator');
  if (!form) return;
  const directCost = document.getElementById('rate-direct-cost');
  const price = document.getElementById('rate-price');
  const status = document.getElementById('rate-calculator-status');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const clearResult = (message) => {
    directCost.textContent = 'Not calculated';
    price.textContent = 'Not calculated';
    status.textContent = message;
  };

  form.addEventListener('input', () => clearResult('Assumptions changed. Calculate again for a new estimate.'));
  form.addEventListener('invalid', () => clearResult('Check the highlighted input, then calculate again.'), true);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const result = calculate3DPrintingRate(Object.fromEntries(new FormData(form)));
      directCost.textContent = money.format(result.directCost);
      price.textContent = money.format(result.price);
      status.textContent = 'Estimate updated from your assumptions.';
    } catch (error) {
      clearResult(error.message);
    }
  });
})();
