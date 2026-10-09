import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const source = readFileSync(new URL('../../posthog-web.js', import.meta.url), 'utf8');
const homepage = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const siteConfig = JSON.parse(readFileSync(new URL('../../posthog-site.json', import.meta.url), 'utf8'));
const publicConfig = JSON.parse(readFileSync(new URL('../../posthog-config.json', import.meta.url), 'utf8'));
function browser(overrides = {}, landingUrl = 'https://venuebill.com/pricing?code=secret') {
  const windowListeners = new Map(), documentListeners = new Map(), values = new Map(), session = new Map(), requests = [], nodes = [], appended = [];
  const storage = (map) => ({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) });
  const config = { key: 'phc_test', host: 'https://us.i.posthog.com', product: 'venuebill.com', surface: 'marketing', consentKey: 'site_consent', consentKind: 'accepted', ...overrides };
  const status = { firstChild: { textContent: '' } };
  const choiceButton = analyticsChoice => ({ dataset: { analyticsChoice }, addEventListener() {} });
  const choices = [choiceButton('declined'), choiceButton('accepted')];
  const context = { window: { addEventListener: (k, fn) => windowListeners.set(k, fn), dispatchEvent: e => { windowListeners.get(e.type)?.(e); return true; } }, document: {
    cookie: '', readyState: 'complete', referrer: 'https://google.com/search?q=private', documentElement: { lang: 'en' },
    addEventListener: (k, fn) => documentListeners.set(k, fn),
    getElementById: () => null,
    querySelector: selector => selector === 'footer .foot-links' ? { append: node => appended.push(node) } : null,
    createElement: tag => { const n = {
      tag, setAttribute() {}, style: {}, append() {}, addEventListener(k, fn) { this[k] = fn; },
      querySelector: selector => selector === '#analytics-consent-status' ? status : null,
      querySelectorAll: selector => selector === '[data-analytics-choice]' ? choices : [],
    }; nodes.push(n); return n; },
    body: { append: node => appended.push(node) },
  }, navigator: { webdriver: false, globalPrivacyControl: false }, location: { hostname: 'venuebill.com', pathname: '/pricing', href: landingUrl },
    history: { pushState() {}, replaceState() {} }, localStorage: storage(values), sessionStorage: storage(session), crypto: { randomUUID }, innerWidth: 390, Event, AbortController, AbortSignal, setTimeout, clearTimeout, URL, Date,
    fetch: async (url, options) => { if (url === '/posthog-config.json') return { ok: true, json: async () => config }; requests.push({ url, options, data: JSON.parse(options.body) }); return { ok: true }; },
  };
  const cookies = new Map();
  Object.defineProperty(context.document, 'cookie', {
    get: () => [...cookies].map(([k,v]) => `${k}=${v}`).join('; '),
    set: (raw) => { const [pair] = raw.split('; '); const at = pair.indexOf('='); const k = pair.slice(0, at); if (raw.includes('Max-Age=0;')) cookies.delete(k); else cookies.set(k, pair.slice(at + 1)); },
  });
  vm.runInNewContext(source, context);
  context.history.pushState(); // A route can change before async configuration arrives.
  return { context, requests, values, session, nodes, appended, windows: windowListeners, documents: documentListeners };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const b = browser(); await tick();
assert.deepEqual(b.nodes.map(node => node.tag), ['button', 'aside'], 'The shared loader injects settings and the consent panel');
assert.equal(b.requests.length, 0, 'No external capture before consent');
assert.equal(b.values.has('website_posthog_identity_v1'), false);
b.values.set('site_consent', 'accepted'); b.context.window.productAnalytics.refresh(); await tick();
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
const contactLink = { href: 'https://venuebill.com/contact' };
b.documents.get('click')({ target: { closest: () => contactLink } }); await tick();
assert.deepEqual(b.requests.slice(-2).map((r) => r.data.event), ['cta_clicked', 'contact_clicked']);
const oldId = b.requests.at(-1).data.distinct_id;
b.values.set('site_consent', 'declined'); b.windows.get('storage')();
const count = b.requests.length;
b.context.window.productAnalytics.capture('signup_completed');
assert.equal(b.requests.length, count, 'Withdrawal stops capture');
assert.equal(b.values.has('website_posthog_identity_v1'), false);
b.values.set('site_consent', 'accepted'); b.context.window.productAnalytics.refresh(); await tick();
assert.notEqual(b.requests.at(-1).data.distinct_id, oldId, 'Reaccept creates a fresh identity');
b.context.navigator.globalPrivacyControl = true; b.context.window.productAnalytics.refresh();
b.context.window.productAnalytics.capture('signup_completed');
assert.equal(b.requests.length, count + 1, 'GPC overrides stored consent');
for (const config of [{ key: '' }, { host: 'https://untrusted.example' }, { product: 'pancakebudget.com' }]) {
  const disabled = browser(config); disabled.values.set('site_consent', 'accepted'); await tick();
  assert.equal(disabled.requests.length, 0);
}
const existing = browser({ consentKey: 'venuebill_consent', consentKind: 'analytics' }); await tick();
existing.values.set('venuebill_consent', JSON.stringify({ analytics: true })); existing.windows.get('venuebill:consent-updated')(); await tick();
assert.equal(existing.requests.length, 1, 'Existing categorized consent is reused');
existing.values.set('venuebill_consent', JSON.stringify({ analytics: false })); existing.windows.get('venuebill:consent-updated')();
assert.equal(existing.values.has('website_posthog_identity_v1'), false, 'Site cookie settings withdrawal stops capture');
existing.values.set('venuebill_consent', JSON.stringify({ analytics: true })); existing.windows.get('venuebill:consent-updated')(); await tick();
existing.values.set('venuebill_consent', JSON.stringify({ analytics: false })); existing.windows.get('storage')();
assert.equal(existing.values.has('website_posthog_identity_v1'), false);
const noBanner = browser({ consentKey: '' }); noBanner.values.set('website_posthog_consent_v1', 'accepted'); noBanner.context.window.productAnalytics.refresh(); await tick();
assert.equal(noBanner.requests.length, 0, 'A site without its own consent banner never captures, even with a legacy box acceptance');
assert.deepEqual(noBanner.nodes.map(node => node.tag), ['button', 'aside']);
const internal = browser(); internal.values.set('site_consent', 'accepted'); internal.values.set('website_posthog_internal', '1'); await tick();
assert.equal(internal.requests.length, 0, 'Explicit internal browser exclusion');
const shared = browser({ sharedDomain: 'venuebill.com' }); await tick();
shared.values.set('site_consent', 'accepted'); shared.context.window.productAnalytics.refresh(); await tick();
const sharedId = shared.requests.at(-1).data.distinct_id;
shared.context.location.hostname = 'app.venuebill.com';
shared.context.location.pathname = '/register';
shared.context.history.pushState(); await tick();
assert.equal(shared.requests.at(-1).data.distinct_id, sharedId, 'Cross-subdomain visitor remains anonymous and continuous');
assert.equal(shared.requests.at(-1).data.properties.$session_id, shared.requests[0].data.properties.$session_id);
shared.values.set('site_consent', 'declined'); shared.context.window.productAnalytics.refresh();
assert.equal(shared.context.document.cookie.includes('website_posthog_identity_v1'), false);
const publicOnly = browser({ publicOnly: true });
publicOnly.values.set('site_consent', 'accepted'); await tick();
publicOnly.context.location.pathname = '/guides/a-public-guide'; publicOnly.context.history.pushState(); await tick();
assert.equal(publicOnly.requests.at(-1).data.properties.page_path, '/guides/a-public-guide');
const publicCount = publicOnly.requests.length;
publicOnly.context.location.pathname = '/children/private-id'; publicOnly.context.history.pushState();
publicOnly.context.window.productAnalytics.capture('activation_completed');
assert.equal(publicOnly.requests.length, publicCount, 'Adult acquisition scope excludes private child pages entirely');
assert.equal(siteConfig.consentKey, 'website_posthog_consent_v1');
assert.equal(publicConfig.consentKey, siteConfig.consentKey);
assert.equal(siteConfig.consentKind, 'accepted');
assert.match(homepage, /src="\/posthog-web\.js"/);
assert.match(source, /id = 'analytics-consent'/);
assert.match(source, /data-analytics-choice="accepted"/);
assert.match(homepage, /href="contact\.html">Contact<\/a>/, 'The primary Contact link is present for delegated event capture');
console.log('PostHog browser contract passed: consent, withdrawal, reaccept, opt-outs, routes, privacy, exclusions and ordered store events.');

const moore = browser({product:'moorecode.com',hosts:['venuebill.com','moorecode.com']}); await tick();
moore.values.set('site_consent','accepted');
for (const pathname of ['/projects.html','/consulting.html','/blog/mileage-tracker-delivery-drivers-tax-deduction.html','/blog/3d-printmaking-checklist-mirrored-art-inked-proof.html','/calculators/3d-printing-price-calculator.html']) {
  moore.context.location.pathname=pathname;
  moore.context.window.productAnalytics.refresh(); await tick();
  assert.equal(moore.requests.at(-1).data.properties.page_path,pathname);
}
moore.context.location.pathname='/children/private-id';
moore.context.window.productAnalytics.refresh(); await tick();
assert.equal(moore.requests.at(-1).data.properties.page_path,'/:private');
const prior=moore.requests.length;
moore.context.window.websiteAnalyticsConsentDenied=true;
moore.context.window.productAnalytics.refresh();
moore.context.window.productAnalytics.capture('contact_clicked'); await tick();
assert.equal(moore.requests.length,prior,'In-memory withdrawal stops events even while accepted consent remains in storage');
assert.equal(moore.values.has('website_posthog_identity_v1'),false);

const campaign = browser({}, 'https://venuebill.com/pricing?utm_campaign=cc_0123456789abcdef&utm_source=private-email@example.com'); await tick();
assert.equal(campaign.requests.length, 0, 'Campaign landing does not capture before consent');
assert.equal(campaign.session.size, 0, 'Campaign landing does not persist session data before consent');
campaign.values.set('site_consent', 'accepted'); campaign.context.window.productAnalytics.refresh(); await tick();
assert.equal(campaign.requests[0].data.properties.campaign, 'cc_0123456789abcdef');
assert.equal(JSON.stringify(campaign.requests).includes('private-email'), false);
campaign.context.location.href = 'https://venuebill.com/signup?utm_campaign=cc_aaaaaaaaaaaaaaaa';
campaign.context.location.pathname = '/signup'; campaign.context.history.pushState(); await tick();
campaign.context.window.productAnalytics.capture('signup_completed'); await tick();
assert.equal(campaign.requests.at(-1).data.properties.campaign, 'cc_0123456789abcdef', 'Session preserves first landing campaign through later events');
campaign.values.set('site_consent', 'declined'); campaign.context.window.productAnalytics.refresh();
assert.equal(campaign.session.size, 0, 'Withdrawal removes persisted campaign');
campaign.values.set('site_consent', 'accepted'); campaign.context.window.productAnalytics.refresh(); await tick();
assert.equal(campaign.requests.at(-1).data.properties.campaign, undefined, 'Reaccept does not resurrect withdrawn campaign');
for (const value of ['email@example.com', 'cc_0123456789abcdeg', 'cc_0123456789abcdef-person', 'CC_0123456789abcdef', 'cc_0123456789abcdef&utm_campaign=cc_aaaaaaaaaaaaaaaa']) {
  const rejected = browser({}, `https://venuebill.com/pricing?utm_campaign=${value}`); await tick();
  rejected.values.set('site_consent', 'accepted'); rejected.context.window.productAnalytics.refresh(); await tick();
  assert.equal(rejected.requests[0].data.properties.campaign, undefined, 'Arbitrary/duplicate UTM campaign is dropped');
}
const expired = browser({}, 'https://venuebill.com/pricing?utm_campaign=cc_0123456789abcdef'); await tick();
expired.values.set('site_consent', 'accepted'); expired.context.window.productAnalytics.refresh(); await tick();
const oldSession = JSON.parse(expired.session.get('website_posthog_session_v1')); oldSession.at = Date.now() - 31 * 60000;
expired.session.set('website_posthog_session_v1', JSON.stringify(oldSession)); expired.context.window.productAnalytics.capture('signup_completed'); await tick();
assert.notEqual(expired.requests.at(-1).data.properties.$session_id, oldSession.id);
assert.equal(expired.requests.at(-1).data.properties.campaign, undefined, 'Expired session does not retain campaign attribution');
const resource = browser({}, 'https://venuebill.com/tools/event-budget?utm_campaign=cc_0123456789abcdef&customer=secret');
resource.context.location.pathname = '/tools/event-budget'; await tick();
for (const event of ['resource_completed', 'resource_downloaded']) assert.equal(resource.context.window.productAnalytics.capture(event), false, 'Resources remain consent gated');
assert.equal(resource.requests.length, 0);
resource.values.set('site_consent', 'accepted'); resource.context.window.productAnalytics.refresh(); await tick();
const resourceSession = resource.requests[0].data.properties.$session_id;
for (const event of ['resource_completed', 'resource_downloaded']) {
  assert.equal(resource.context.window.productAnalytics.capture(event), true); await tick();
  const captured = resource.requests.at(-1).data;
  assert.equal(captured.event, event);
  assert.equal(captured.properties.page_path, '/tools/event-budget');
  assert.equal(captured.properties.campaign, 'cc_0123456789abcdef');
  assert.equal(captured.properties.$session_id, resourceSession);
  assert.equal(captured.properties.$process_person_profile, false);
  assert.equal(JSON.stringify(captured).includes('secret'), false);
}
const resourceCount = resource.requests.length;
resource.documents.get('click')({ target: { closest: () => ({ href: 'https://venuebill.com/tools/event-budget' }) } }); await tick();
assert.equal(resource.requests.length, resourceCount, 'A tool link click never masquerades as a completed calculation or download');
resource.context.location.pathname = '/private/customer-id';
assert.equal(resource.context.window.productAnalytics.capture('resource_completed'), false, 'Resource completion never emits on private paths, even outside publicOnly sites');
resource.context.location.pathname = '/templates/event-checklist';
resource.windows.get('website:analytics-event')({ detail: { name: 'resource_downloaded', email: 'private@example.com' } }); await tick();
assert.equal(resource.requests.at(-1).data.event, 'resource_downloaded');
assert.equal(JSON.stringify(resource.requests.at(-1)).includes('private@example.com'), false);
resource.values.set('site_consent', 'declined'); resource.context.window.productAnalytics.refresh();
assert.equal(resource.context.window.productAnalytics.capture('resource_downloaded'), false, 'Withdrawal disables resource telemetry');
console.log('PostHog browser contract passed: consent, withdrawal, reaccept, opt-outs, routes, privacy, exclusions and ordered store events.');

// Referral attribution is consented and hostname-only, preserving first landing.
const referral = browser();
await tick();
assert.equal(referral.requests.length, 0);
referral.values.set('site_consent', 'accepted');
referral.context.window.productAnalytics.refresh(); await tick();
assert.equal(referral.requests[0].data.properties.referrer_domain, 'google.com');
assert.equal(JSON.stringify(referral.requests).includes('search?q=private'), false);
referral.context.document.referrer = 'https://venuebill.com/pricing';
referral.context.window.productAnalytics.capture('signup_completed'); await tick();
assert.equal(referral.requests.at(-1).data.properties.referrer_domain, 'google.com');
referral.values.set('site_consent', 'declined'); referral.context.window.productAnalytics.refresh();
referral.values.set('site_consent', 'accepted'); referral.context.window.productAnalytics.refresh(); await tick();
assert.equal(referral.requests.at(-1).data.properties.referrer_domain, undefined);
for (const referrer of ['https://user:secret@google.com/private', 'http://google.com/', 'https://google.com:8443/', 'https://127.0.0.1/', 'https://company.internal/', 'https://app.venuebill.com/private']) {
  // Boot the bundle again with the supplied initial referrer using its VM seam.
  const sample = browser(); await tick();
  sample.context.document.referrer = referrer;
  delete sample.context.window.productAnalytics;
  vm.runInNewContext(source, sample.context); await tick();
  sample.values.set('site_consent', 'accepted'); sample.context.window.productAnalytics.refresh(); await tick();
  assert.equal(sample.requests.at(-1).data.properties.referrer_domain, undefined, referrer);
}
