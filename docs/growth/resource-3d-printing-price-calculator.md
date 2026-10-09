# 3D Printing Price Calculator

Status: pending deployment verification

Deployment URL: https://moorecode.com/calculators/3d-printing-price-calculator.html

## Implementation

- `calculators/3d-printing-price-calculator.html`: canonical calculator page, labeled native inputs, editable assumptions, visible formulas, sources, result breakdown, guide links, and consulting handoff.
- `calculators/3d-printing-price-calculator.js`: validated cost calculation, consent-controlled `cta_clicked` requests and `resource_completed` events.
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

The rendered local-source journey passed at 1280 px and 390 px, with the browser retaining the actual HTTPS product origin and intercepting ingestion requests locally. No synthetic events were sent to PostHog. Screenshots and structured results are in `docs/growth/evidence/`; the executable journey is `tests/seo/resource-browser.cjs`.

Run a local server from the repository with `python3 -m http.server 8798`, then run `PLAYWRIGHT_MODULE_PATH=<installed Playwright module path> node tests/seo/resource-browser.cjs`. The script uses disposable contexts, exercises keyboard entry/submission and repeats, and checks zero costs, decimal/zero quantities, required inputs, finite overflow, stale-result clearing, focus indication, mobile overflow, pre-consent silence, withdrawal, GPC and private-route identity clearing.

The representative job independently totals 38.6584 (38.66 displayed), or 19.3292 per part (19.33 displayed). The allowance is explicitly a cost cushion rather than a failure probability. Very large or unsafe values cannot produce a displayed non-finite estimate or a completion event.

## Existing analytics adapter

The existing public configuration and loader were independently checked against the live site: the product is `moorecode.com`, the original project is configured, and the existing optional-consent key and PostHog region remain unchanged. The canonical emitter core was refreshed while preserving MooreCode's owned consent controls, `.html` public routes, explicit in-memory withdrawal override, and `contact_clicked` mapping. Unknown routes now deny capture and clear attribution. The calculator's exact public route is recognized. No provider key, account, identifier, form value, calculation input, or result was added to event metadata.

The generic worker synchronization helper classifies this customized adapter as uncollected; it must not overwrite the adapter or fabricate collection status. The independent rendered contract demonstrates event production against intercepted responses. It does not prove durable provider ingestion. The configured release is empty, so release-tagged production measurement is still unavailable until a real release is independently established.

The existing Inter typography and native MooreCode spacing/colors are retained under `DESIGN.md`; mechanical font-choice warnings are not grounds to redesign the incumbent site.

## Outcome coverage

With optional analytics consent, a submitted calculator request records `cta_clicked` and a successful calculation records `resource_completed` through the site's existing anonymous PostHog component. The page path, device class, channel, and existing opaque campaign token can support landing-visit and resource-use counts without collecting calculator values. The existing Contact link records the site's consented contact-click events.

No signup, lead delivery, paid outcome, or causal conversion lift has been verified. Organic landing visits and conversions remain unknown until the page is deployed and observed separately. Attribution coverage is limited to visitors who consent to analytics and is not complete population measurement.
