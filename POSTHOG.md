# PostHog website analytics

Prepared October 2, 2026. Capture stays disabled until a public ingestion token is configured. No live PostHog ingestion or deployment is verified yet.

Product: `moorecode.com`. Independent products use separate PostHog projects. This website integration is anonymous; no person profiles, replay, autocapture, form contents, account identifiers or raw URLs are sent. Known public routes retain authored slugs; private paths lose identifiers. PARE and Parent Prize Portal skip private pages entirely. Browser privacy signals, declined consent and `website_posthog_internal=1` in localStorage suppress capture. Logout clears the anonymous identity. This adds no native-app tracking. PancakeBudget is excluded.

## Configure and deploy

Set `POSTHOG_PROJECT_TOKEN` to the project's public `phc_` ingestion token and `POSTHOG_REGION` to `us` or `eu` in the production build environment. Never put a personal API key in the website. Build hooks generate `/posthog-config.json` and stamp the published HTML tree. On static sites without npm builds, the Render build must invoke `node configure-posthog.mjs`; Debtless invokes `node public/configure-posthog.mjs` from `marketing/site`. TurfPlanner instead reads runtime `POSTHOG_PROJECT_TOKEN_TURFPLANNER_COM` and `POSTHOG_REGION_TURFPLANNER_COM` on brightprompt-hub and only serves config to its three approved hosts.

Keep ingestion disabled until provider region/retention and the disclosure are verified. `posthog-web.js` renders no UI of its own. Capture runs only after this site's own cookie banner records consent; a site without one never enables capture. Visit `/posthog-privacy.html` for the data contract.

## Check

Run `node tests/posthog/posthog-web.test.mjs`. After enabling production, exercise decline, accept, navigation, the actual successful outcome and withdrawal. Confirm the events inside the correct PostHog project and inspect payloads for sensitive data. Reconcile the ordered funnel in Command Center against provider results. A local contract or build passing does not prove production ingestion.

Confirmed signup/lead handlers emit success events; App Store and contact clicks measure intent. Checkout starts are not paid subscriptions. Backend first-value activation, verified paid conversions and closed post-deployment lift measurements remain separate unfinished work; do not infer them from page visits or clicks.
