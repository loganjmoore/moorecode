(() => {
  function number(value) {
    if (value === null || (typeof value === 'string' && value.trim() === '')) throw new RangeError('Every calculator value is required. Enter zero for a cost you do not include.');
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError('Calculator values must be finite and non-negative.');
    return parsed;
  }

  function calculate3DPrintingPrice(values) {
    const quantity = number(values.quantity);
    const spoolWeight = number(values.spoolWeight);
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new RangeError('Quantity must be a safe whole number of at least one.');
    if (spoolWeight <= 0) throw new RangeError('Spool weight must be greater than zero.');
    const failureRate = number(values.failureRate);
    if (failureRate > 100) throw new RangeError('Failed-print allowance cannot exceed 100%.');

    const material = quantity * number(values.materialGrams) / spoolWeight * number(values.spoolPrice);
    const electricity = quantity * number(values.printHours) * number(values.printerWatts) / 1000 * number(values.energyRate);
    const labor = number(values.laborHours) * number(values.laborRate);
    const machine = quantity * number(values.printHours) * number(values.machineRate);
    const other = number(values.otherCost);
    const subtotal = material + electricity + labor + machine + other;
    const failureAllowance = subtotal * failureRate / 100;
    const total = subtotal + failureAllowance;

    const result = { material, electricity, labor, machine, other, failureAllowance, total, perPart: total / quantity };
    if (!Object.values(result).every(Number.isFinite)) throw new RangeError('These values are too large to calculate. Reduce the amounts and try again.');
    return result;
  }

  globalThis.calculate3DPrintingPrice = calculate3DPrintingPrice;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('price-calculator');
  if (!form) return;
  const money = (value, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  const outputIds = ['material', 'electricity', 'labor', 'machine', 'other', 'failureAllowance'];

  function clearEstimate(message) {
    document.getElementById('job-total').textContent = '—';
    document.getElementById('per-part').textContent = 'Calculate to see a per-part estimate.';
    for (const key of outputIds) document.getElementById(`result-${key}`).textContent = '—';
    document.getElementById('calculator-status').textContent = message;
  }
  form.addEventListener('input', () => clearEstimate('Assumptions changed. Calculate again for a new estimate.'));
  form.addEventListener('change', () => clearEstimate('Assumptions changed. Calculate again for a new estimate.'));
  form.addEventListener('invalid', () => clearEstimate('Check the highlighted input, then calculate again.'), true);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try { window.productAnalytics?.capture('cta_clicked'); } catch { /* Optional measurement cannot prevent calculation. */ }
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = calculate3DPrintingPrice(values);
      const currency = values.currency;
      document.getElementById('job-total').textContent = money(result.total, currency);
      document.getElementById('per-part').textContent = `${money(result.perPart, currency)} per part for ${values.quantity} ${Number(values.quantity) === 1 ? 'part' : 'parts'}`;
      for (const key of outputIds) document.getElementById(`result-${key}`).textContent = money(result[key], currency);
      document.getElementById('calculator-status').textContent = 'Estimate updated from your assumptions.';
      try { window.productAnalytics?.capture('resource_completed'); } catch { /* Optional measurement cannot invalidate a useful estimate. */ }
    } catch (error) {
      clearEstimate(error.message);
    }
  });
})();
