# 3D Printing Price Calculator

Status: pending deployment verification

Deployment URL: https://moorecode.com/calculators/3d-printing-price-calculator.html

## Implementation

- `calculators/3d-printing-price-calculator.html`: canonical calculator page, labeled native inputs, editable assumptions, visible formulas, sources, result breakdown, guide links, and consulting handoff.
- `calculators/3d-printing-price-calculator.js`: validated cost calculation and consent-controlled `resource_completed` event.
- `style.css`: responsive calculator and topic-index styling in the existing MooreCode visual system.
- `index.html` and `blog/index.html`: contextual discovery links.
- `sitemap.xml` and `llms.txt`: crawler and assistant discovery.

## Calculation scope

The calculator estimates direct material, electricity, labor, machine or upkeep, other job costs, and an optional failed-print allowance. All commercial assumptions are visitor-provided. It does not invent a labor rate, energy price, profit, savings, taxes, shipping, or market price.

Calculator assumptions intentionally reset on reload. Values are not stored locally, sent to analytics, or placed in the URL.

The electricity conversion uses `kWh = watts × hours ÷ 1,000`, as published by the U.S. Department of Energy. The cost categories follow the editable material, electricity, labor, and machine or upkeep structure used by Prusa Research's public 3D-printing calculator.

## Runnable checks

- `node tests/seo/price-calculator.test.mjs`: zero-cost, representative, 100% allowance boundary, and invalid-input cases.
- `node tests/seo/static-pages.test.mjs`: canonical, labels, formulas, sources, internal links, article topic coverage, and shared analytics inclusion.
- `node tests/seo/sitemap.test.mjs`: public-file resolution and dated sitemap entry.

## Rendered evidence

Rendered keyboard and mobile browser verification is blocked in this workspace. The sandbox rejects local HTTP listeners, and the controlled browser blocks `file://` navigation. Static checks confirm that every input has a matching visible label, native number controls expose limits and steps, the result uses `role="status"` with `aria-live="polite"`, the layout has an explicit single-column mobile fallback, and the calculator function passes zero, representative, boundary, and invalid-input checks.

The page still requires a keyboard and 390 px mobile journey at the deployment URL before status can change from pending.

## Outcome coverage

With optional analytics consent, a successful calculation records `resource_completed` through the site's existing anonymous PostHog component. The page path, device class, channel, and existing opaque campaign token can support landing-visit and resource-use counts without collecting calculator values. The existing Contact link records the site's consented contact-click events.

No signup, lead delivery, paid outcome, or causal conversion lift has been verified. Organic landing visits and conversions remain unknown until the page is deployed and observed separately. Attribution coverage is limited to visitors who consent to analytics and is not complete population measurement.
