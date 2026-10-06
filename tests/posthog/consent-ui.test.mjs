import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const homepage = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const consentScript = [...homepage.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(script => script.includes("const key = 'website_posthog_consent_v1'"));
assert.ok(consentScript, 'Execute the actual homepage consent handlers');
const consentKey = 'website_posthog_consent_v1';

function browser(savedChoice, navigatorOverrides = {}) {
  const values = new Map(savedChoice === undefined ? [] : [[consentKey, savedChoice]]);
  const events = [];
  let failWrites = false;
  const button = choice => {
    const handlers = [];
    return { dataset: { analyticsChoice: choice }, addEventListener: (name, handler) => {
      assert.equal(name, 'click'); handlers.push(handler);
    }, click: () => handlers.forEach(handler => handler()) };
  };
  const decline = button('declined'), accept = button('accepted'), settings = button();
  const panel = { hidden: true }, status = { firstChild: { textContent: 'Optional analytics' } };
  const window = { dispatchEvent: event => events.push(event.type) };
  vm.runInNewContext(consentScript, {
    window, navigator: { globalPrivacyControl: false, ...navigatorOverrides },
    Event: class { constructor(type) { this.type = type; } },
    document: {
      getElementById: id => ({ 'analytics-consent': panel, 'analytics-consent-status': status, 'analytics-settings': settings })[id],
      querySelectorAll: selector => { assert.equal(selector, '[data-analytics-choice]'); return [decline, accept]; },
    },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => {
      if (failWrites) throw new Error('Storage write denied');
      values.set(key, value);
    } },
  });
  return { values, events, window, panel, status, decline, accept, settings,
    failWrites: value => { failWrites = value; } };
}

test('actual homepage controls persist consent, reopen settings, withdraw and reaccept', () => {
  const b = browser();
  assert.equal(b.panel.hidden, false);
  b.accept.click();
  assert.equal(b.values.get(consentKey), 'accepted');
  assert.equal(b.panel.hidden, true);
  assert.equal(Boolean(b.window.websiteAnalyticsConsentDenied), false);
  b.settings.click();
  assert.equal(b.panel.hidden, false);
  assert.match(b.status.firstChild.textContent, /analytics is allowed/i);
  b.decline.click();
  assert.equal(b.values.get(consentKey), 'declined');
  assert.equal(b.window.websiteAnalyticsConsentDenied, true);
  b.settings.click();
  assert.match(b.status.firstChild.textContent, /analytics is off/i);
  b.accept.click();
  assert.equal(b.values.get(consentKey), 'accepted');
  assert.equal(b.window.websiteAnalyticsConsentDenied, false);
  assert.ok(b.events.length >= 3, 'Each changed consent choice notifies the tracker');
  assert.ok(b.events.every(type => type === 'website:analytics-consent'));
});

test('withdrawal fails closed when a saved acceptance cannot be overwritten', () => {
  const b = browser('accepted');
  assert.equal(b.panel.hidden, true);
  b.settings.click();
  b.failWrites(true);
  b.decline.click();
  assert.equal(b.values.get(consentKey), 'accepted', 'The test preserves the stale acceptance');
  assert.equal(b.window.websiteAnalyticsConsentDenied, true, 'Withdrawal immediately overrides saved acceptance');
  assert.equal(b.events.at(-1), 'website:analytics-consent', 'The tracker receives withdrawal even if persistence fails');
  assert.match(b.status.firstChild.textContent, /off/i);
  b.settings.click();
  assert.match(b.status.firstChild.textContent, /off/i, 'Reopening must reflect the transient denial');
  b.accept.click();
  assert.equal(b.window.websiteAnalyticsConsentDenied, true, 'Failed acceptance cannot clear transient denial');
  b.failWrites(false);
  b.accept.click();
  assert.equal(b.window.websiteAnalyticsConsentDenied, false, 'Successful reacceptance clears denial');
  assert.equal(b.values.get(consentKey), 'accepted');
});

test('settings accurately disclose browser privacy opt-outs', () => {
  for (const signal of [{ globalPrivacyControl: true }, { doNotTrack: '1' }]) {
    const b = browser('accepted', signal);
    b.settings.click();
    assert.match(b.status.firstChild.textContent, /browser privacy preference.*off/i);
  }
});
