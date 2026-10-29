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
    const pricingPercentage = number(values.pricingPercentage);
    const pricingMode = values.pricingMode;
    if (!['markup', 'margin'].includes(pricingMode)) throw new RangeError('Choose markup or target gross margin.');
    if (pricingMode === 'margin' && pricingPercentage >= 100) throw new RangeError('Target gross margin must be less than 100%.');

    const material = quantity * number(values.materialGrams) / spoolWeight * number(values.spoolPrice);
    const electricity = quantity * number(values.printHours) * number(values.printerWatts) / 1000 * number(values.energyRate);
    const labor = number(values.laborHours) * number(values.laborRate);
    const machine = quantity * number(values.printHours) * number(values.machineRate);
    const other = number(values.otherCost);
    const subtotal = material + electricity + labor + machine + other;
    const failureAllowance = subtotal * failureRate / 100;
    const total = subtotal + failureAllowance;
    const suggestedPrice = pricingMode === 'markup'
      ? total * (1 + pricingPercentage / 100)
      : total / (1 - pricingPercentage / 100);
    const grossProfit = suggestedPrice - total;

    const result = {
      material, electricity, labor, machine, other, failureAllowance, total,
      perPart: total / quantity, suggestedPrice, grossProfit, sellingPricePerPart: suggestedPrice / quantity,
    };
    if (!Object.values(result).every(Number.isFinite)) throw new RangeError('These values are too large to calculate. Reduce the amounts and try again.');
    return result;
  }

  const estimateCaveat = 'Estimate only. Excludes taxes, shipping, marketplace fees, and any overhead you did not enter.';
  const enteredNumber = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 }).format(number(value));
  const money = (value, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

  function createEstimateSummary(values, result) {
    const currency = values.currency;
    const pricingMethod = values.pricingMode === 'margin' ? 'Target gross margin' : 'Markup';
    return {
      assumptions: {
        quantity: enteredNumber(values.quantity),
        materialGrams: enteredNumber(values.materialGrams),
        printHours: enteredNumber(values.printHours),
        currency,
        spoolPrice: `${currency} ${enteredNumber(values.spoolPrice)}`,
        spoolWeight: enteredNumber(values.spoolWeight),
        printerWatts: enteredNumber(values.printerWatts),
        energyRate: `${currency} ${enteredNumber(values.energyRate)}`,
        laborHours: enteredNumber(values.laborHours),
        laborRate: `${currency} ${enteredNumber(values.laborRate)}`,
        machineRate: `${currency} ${enteredNumber(values.machineRate)}`,
        otherCost: `${currency} ${enteredNumber(values.otherCost)}`,
        failureRate: `${enteredNumber(values.failureRate)}%`,
      },
      breakdown: {
        material: money(result.material, currency),
        electricity: money(result.electricity, currency),
        labor: money(result.labor, currency),
        machine: money(result.machine, currency),
        other: money(result.other, currency),
        failureAllowance: money(result.failureAllowance, currency),
        total: money(result.total, currency),
        perPart: money(result.perPart, currency),
      },
      pricing: {
        method: pricingMethod,
        percentage: `${enteredNumber(values.pricingPercentage)}%`,
        suggestedPrice: money(result.suggestedPrice, currency),
        grossProfit: money(result.grossProfit, currency),
        sellingPricePerPart: money(result.sellingPricePerPart, currency),
      },
    };
  }

  function build3DPrintingEstimateText(values, result) {
    const summary = createEstimateSummary(values, result);
    return [
      'MooreCode 3D print cost and price calculator',
      'Estimate summary',
      '',
      'Assumptions',
      `Number of parts: ${summary.assumptions.quantity}`,
      `Material per part (g): ${summary.assumptions.materialGrams}`,
      `Print time per part (hours): ${summary.assumptions.printHours}`,
      `Currency: ${summary.assumptions.currency}`,
      `Spool or material price: ${summary.assumptions.spoolPrice}`,
      `Spool or package weight (g): ${summary.assumptions.spoolWeight}`,
      `Average printer power (W): ${summary.assumptions.printerWatts}`,
      `Electricity price per kWh: ${summary.assumptions.energyRate}`,
      `Hands-on labor (hours): ${summary.assumptions.laborHours}`,
      `Labor rate per hour: ${summary.assumptions.laborRate}`,
      `Machine and upkeep per print hour: ${summary.assumptions.machineRate}`,
      `Other direct job costs: ${summary.assumptions.otherCost}`,
      `Failed-print allowance: ${summary.assumptions.failureRate}`,
      '',
      'Direct-cost breakdown',
      `Material: ${summary.breakdown.material}`,
      `Electricity: ${summary.breakdown.electricity}`,
      `Labor: ${summary.breakdown.labor}`,
      `Machine and upkeep: ${summary.breakdown.machine}`,
      `Other direct costs: ${summary.breakdown.other}`,
      `Failed-print allowance: ${summary.breakdown.failureAllowance}`,
      `Total direct cost: ${summary.breakdown.total}`,
      `Direct cost per part: ${summary.breakdown.perPart}`,
      '',
      'Pricing',
      `Pricing method: ${summary.pricing.method}`,
      `Pricing percentage: ${summary.pricing.percentage}`,
      `Suggested selling price: ${summary.pricing.suggestedPrice}`,
      `Gross profit: ${summary.pricing.grossProfit}`,
      `Selling price per part: ${summary.pricing.sellingPricePerPart}`,
      '',
      'Formulas',
      'Total direct cost = ((quantity × grams per part ÷ package grams × material price) + (quantity × print hours × average watts ÷ 1,000 × price per kWh) + (labor hours × labor rate) + (quantity × print hours × machine rate) + other direct costs) × (1 + failed-print allowance ÷ 100).',
      'Price with markup = direct cost × (1 + markup ÷ 100).',
      'Price for target gross margin = direct cost ÷ (1 - margin ÷ 100).',
      '',
      estimateCaveat,
      '',
    ].join('\n');
  }

  globalThis.calculate3DPrintingPrice = calculate3DPrintingPrice;
  globalThis.build3DPrintingEstimateText = build3DPrintingEstimateText;
  if (typeof document === 'undefined') return;

  const form = document.getElementById('price-calculator');
  if (!form) return;
  const outputIds = ['material', 'electricity', 'labor', 'machine', 'other', 'failureAllowance'];
  const printButton = document.getElementById('print-estimate');
  const downloadButton = document.getElementById('download-estimate');
  let currentEstimateText = '';
  const example = {
    quantity: 2, materialGrams: 100, printHours: 4, currency: 'USD', spoolPrice: 25,
    spoolWeight: 1000, printerWatts: 120, energyRate: 0.15, laborHours: 0.5,
    laborRate: 30, machineRate: 1.5, otherCost: 3, failureRate: 10,
    pricingMode: 'markup', pricingPercentage: 25,
  };

  function clearEstimate(message) {
    for (const item of document.querySelectorAll('[data-estimate-assumption]')) item.textContent = 'Not calculated';
    document.getElementById('job-total').textContent = 'Not calculated';
    document.getElementById('per-part').textContent = 'Calculate to see direct cost per part.';
    for (const key of outputIds) document.getElementById(`result-${key}`).textContent = 'Not calculated';
    for (const id of ['pricing-method-summary', 'pricing-percentage-summary']) document.getElementById(id).textContent = 'Not calculated';
    for (const id of ['suggested-price', 'gross-profit', 'selling-price-per-part']) document.getElementById(id).textContent = 'Not calculated';
    currentEstimateText = '';
    printButton.disabled = true;
    downloadButton.disabled = true;
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
      const summary = createEstimateSummary(values, result);
      const currency = values.currency;
      for (const item of document.querySelectorAll('[data-estimate-assumption]')) {
        item.textContent = summary.assumptions[item.dataset.estimateAssumption];
      }
      document.getElementById('job-total').textContent = money(result.total, currency);
      document.getElementById('per-part').textContent = `${money(result.perPart, currency)} direct cost per part for ${values.quantity} ${Number(values.quantity) === 1 ? 'part' : 'parts'}`;
      for (const key of outputIds) document.getElementById(`result-${key}`).textContent = money(result[key], currency);
      document.getElementById('pricing-method-summary').textContent = summary.pricing.method;
      document.getElementById('pricing-percentage-summary').textContent = summary.pricing.percentage;
      document.getElementById('suggested-price').textContent = money(result.suggestedPrice, currency);
      document.getElementById('gross-profit').textContent = money(result.grossProfit, currency);
      document.getElementById('selling-price-per-part').textContent = money(result.sellingPricePerPart, currency);
      currentEstimateText = build3DPrintingEstimateText(values, result);
      printButton.disabled = false;
      downloadButton.disabled = false;
      document.getElementById('calculator-status').textContent = 'Estimate updated from your assumptions.';
      try { window.productAnalytics?.capture('resource_completed'); } catch { /* Optional measurement cannot invalidate a useful estimate. */ }
    } catch (error) {
      clearEstimate(error.message);
    }
  });

  document.getElementById('load-example')?.addEventListener('click', () => {
    for (const [name, value] of Object.entries(example)) {
      const control = form.elements.namedItem(name);
      if (control instanceof RadioNodeList) control.value = String(value);
      else control.value = String(value);
    }
    clearEstimate('Fictional example loaded. Edit any assumption or calculate the example.');
    form.elements.namedItem('quantity').focus();
    form.scrollIntoView({ block: 'start' });
  });

  printButton.addEventListener('click', () => {
    if (!currentEstimateText) return;
    window.print();
  });

  downloadButton.addEventListener('click', () => {
    if (!currentEstimateText) return;
    const url = URL.createObjectURL(new Blob([currentEstimateText], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moorecode-3d-print-estimate.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
})();
