import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = readFileSync(new URL('../../posthog-web.js', import.meta.url), 'utf8');
function browser(overrides = {}) {
  const windowListeners = new Map(), documentListeners = new Map(), values = new Map(), session = new Map(), requests = [], nodes = [];
  const storage = (map) => ({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) });
  const config = { key: 'phc_test', host: 'https://us.i.posthog.com', product: 'venuebill.com', surface: 'marketing', consentKey: '', ...overrides };
  const context = { window: { addEventListener: (k, fn) => windowListeners.set(k, fn) }, document: {
    cookie: '', readyState: 'complete', referrer: 'https://google.com/search?q=private', documentElement: { lang: 'en' },
    addEventListener: (k, fn) => documentListeners.set(k, fn),
    createElement: () => { const n = { setAttribute() {}, style: {}, append() {}, addEventListener(k, fn) { this[k] = fn; } }; nodes.push(n); return n; },
    body: { append() {} },
  }, navigator: { webdriver: false, globalPrivacyControl: false }, location: { hostname: 'venuebill.com', pathname: '/pricing', href: 'https://venuebill.com/pricing?code=secret' },
    history: { pushState() {}, replaceState() {} }, localStorage: storage(values), sessionStorage: storage(session), crypto: { randomUUID }, innerWidth: 390, AbortController, AbortSignal, setTimeout, clearTimeout, URL, Date,
    fetch: async (url, options) => { if (url === '/posthog-config.json') return { ok: true, json: async () => config }; requests.push({ url, options, data: JSON.parse(options.body) }); return { ok: true }; },
  };
  const cookies = new Map();
  Object.defineProperty(context.document, 'cookie', {
    get: () => [...cookies].map(([k,v]) => `${k}=${v}`).join('; '),
    set: (raw) => { const [pair] = raw.split('; '); const at = pair.indexOf('='); const k = pair.slice(0, at); if (raw.includes('Max-Age=0;')) cookies.delete(k); else cookies.set(k, pair.slice(at + 1)); },
  });
  vm.runInNewContext(source, context);
  context.history.pushState(); // A route can change before async configuration arrives.
  return { context, requests, values, session, nodes, windows: windowListeners, documents: documentListeners };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const b = browser(); await tick();
assert.equal(b.requests.length, 0, 'No external capture before consent');
assert.equal(b.values.has('website_posthog_identity_v1'), false);
b.values.set('website_posthog_consent_v1', 'accepted'); b.context.window.productAnalytics.refresh(); await tick();
assert.equal(b.requests.length, 1);
assert.equal(b.requests[0].data.event, '$pageview');
assert.equal(b.requests[0].data.properties.device, 'mobile');
assert.equal(b.requests[0].data.properties.channel, 'search');
assert.equal(b.requests[0].options.referrerPolicy, 'no-referrer');
assert.equal(JSON.stringify(b.requests).includes('secret'), false);
assert.equal(b.requests[0].data.properties.$process_person_profile, false);
b.context.history.pushState({}, '', '/pricing');
assert.equal(b.requests.length, 1, 'Repeated route does not double count');
b.context.location.pathname = '/invoices/private-customer-secret'; b.context.history.pushState(); await tick();
assert.equal(b.requests.at(-1).data.properties.page_path, '/:private');
const link = { href: 'https://apps.apple.com/app/id123?token=secret' };
b.documents.get('click')({ target: { closest: () => link } }); await tick();
assert.deepEqual(b.requests.slice(-2).map((r) => r.data.event), ['cta_clicked', 'app_store_clicked']);
const oldId = b.requests.at(-1).data.distinct_id;
b.values.set('website_posthog_consent_v1', 'declined'); b.windows.get('storage')();
const count = b.requests.length;
b.context.window.productAnalytics.capture('signup_completed');
assert.equal(b.requests.length, count, 'Withdrawal stops capture');
assert.equal(b.values.has('website_posthog_identity_v1'), false);
b.values.set('website_posthog_consent_v1', 'accepted'); b.context.window.productAnalytics.refresh(); await tick();
assert.notEqual(b.requests.at(-1).data.distinct_id, oldId, 'Reaccept creates a fresh identity');
b.context.navigator.globalPrivacyControl = true; b.context.window.productAnalytics.refresh();
b.context.window.productAnalytics.capture('signup_completed');
assert.equal(b.requests.length, count + 1, 'GPC overrides stored consent');
for (const config of [{ key: '' }, { host: 'https://untrusted.example' }, { product: 'pancakebudget.com' }]) {
  const disabled = browser(config); disabled.values.set('website_posthog_consent_v1', 'accepted'); await tick();
  assert.equal(disabled.requests.length, 0);
}
const existing = browser({ consentKey: 'venuebill_consent', consentKind: 'analytics' }); await tick();
existing.values.set('venuebill_consent', JSON.stringify({ analytics: true })); existing.windows.get('venuebill:consent-updated')(); await tick();
assert.equal(existing.requests.length, 1, 'Existing categorized consent is reused');
existing.values.set('venuebill_consent', JSON.stringify({ analytics: false })); existing.windows.get('storage')();
assert.equal(existing.values.has('website_posthog_identity_v1'), false);
const internal = browser(); internal.values.set('website_posthog_consent_v1', 'accepted'); internal.values.set('website_posthog_internal', '1'); await tick();
assert.equal(internal.requests.length, 0, 'Explicit internal browser exclusion');
const shared = browser({ sharedDomain: 'venuebill.com' }); await tick();
shared.nodes.find((n) => n.textContent === 'Allow analytics').click(); await tick();
const sharedId = shared.requests.at(-1).data.distinct_id;
shared.context.location.hostname = 'app.venuebill.com';
shared.context.location.pathname = '/register';
shared.context.history.pushState(); await tick();
assert.equal(shared.requests.at(-1).data.distinct_id, sharedId, 'Cross-subdomain visitor remains anonymous and continuous');
assert.equal(shared.requests.at(-1).data.properties.$session_id, shared.requests[0].data.properties.$session_id);
shared.nodes.find((n) => n.textContent === 'No thanks').click();
assert.equal(shared.context.document.cookie.includes('website_posthog_identity_v1'), false);
const publicOnly = browser({ publicOnly: true });
publicOnly.values.set('website_posthog_consent_v1', 'accepted'); await tick();
publicOnly.context.location.pathname = '/guides/a-public-guide'; publicOnly.context.history.pushState(); await tick();
assert.equal(publicOnly.requests.at(-1).data.properties.page_path, '/guides/a-public-guide');
const publicCount = publicOnly.requests.length;
publicOnly.context.location.pathname = '/children/private-id'; publicOnly.context.history.pushState();
publicOnly.context.window.productAnalytics.capture('activation_completed');
assert.equal(publicOnly.requests.length, publicCount, 'Adult acquisition scope excludes private child pages entirely');
console.log('PostHog browser contract passed: consent, withdrawal, reaccept, opt-outs, routes, privacy, exclusions and ordered store events.');
