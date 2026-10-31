import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
const scriptURL = new URL('../assets/language.js', import.meta.url);
function visit({ path = '/', languages = ['en-US'], zone = 'UTC', saved, blocked = false, query = '', hash = '' } = {}) {
  const storage = new Map(saved ? [['overflowbar.language', saved]] : []);
  let redirected;
  const location = new URL('https://overflowbar.top' + path + query + hash);
  location.replace = value => { redirected = value; };
  const context = vm.createContext({
    location, URL, navigator: { languages },
    localStorage: { getItem: key => { if (blocked) throw Error('blocked'); return storage.get(key) || null; }, setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); } },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }) }
  });
  assert.ok(existsSync(scriptURL), 'Language selection script is missing');
  vm.runInContext(readFileSync(scriptURL, 'utf8'), context);
  return { redirected, storage };
}
test('browser language takes precedence over time zone and respects preference order', () => {
  assert.equal(visit({ languages: ['en-US', 'zh-CN'], zone: 'Asia/Shanghai' }).redirected, undefined);
  assert.equal(visit({ languages: ['zh-TW', 'en'] }).redirected, 'https://overflowbar.top/zh/');
  assert.equal(visit({ languages: ['fr', 'en'], zone: 'Asia/Shanghai' }).redirected, undefined);
});
test('time zone is only a fallback for unsupported browser languages', () => {
  assert.equal(visit({ languages: ['fr'], zone: 'Asia/Shanghai' }).redirected, 'https://overflowbar.top/zh/');
  assert.equal(visit({ languages: [], zone: 'America/New_York' }).redirected, undefined);
});
test('manual choice persists and storage denial does not break selection', () => {
  assert.equal(visit({ languages: ['zh'], saved: 'en' }).redirected, undefined);
  const result = visit({ query: '?lang=en', languages: ['zh'] });
  assert.equal(result.redirected, undefined);
  assert.equal(result.storage.get('overflowbar.language'), 'en');
  assert.equal(visit({ languages: ['zh'], blocked: true }).redirected, 'https://overflowbar.top/zh/');
});
test('Chinese links stay Chinese and redirects preserve page, query, and fragment', () => {
  assert.equal(visit({ path: '/zh/help/', saved: 'en' }).redirected, undefined);
  assert.equal(visit({ path: '/install/', languages: ['zh-CN'], query: '?ref=home', hash: '#permissions' }).redirected, 'https://overflowbar.top/zh/install/?ref=home#permissions');
  assert.equal(visit({ path: '/unknown/', languages: ['zh'] }).redirected, undefined);
  assert.equal(visit({ path: '/zh/help/', query: '?lang=garbage', saved: 'en' }).redirected, undefined);
  assert.equal(visit({ path: '/zh/help/', query: '?lang=en', hash: '#privacy' }).redirected, 'https://overflowbar.top/help/?lang=en#privacy');
});
test('all Chinese pages are statically translated and advertise language alternates', () => {
  for (const route of ['', 'install/', 'help/', 'guides/mac-menu-bar-overflow/', 'guides/mac-menu-bar-managers/']) {
    const url = new URL('../dist/zh/' + route + 'index.html', import.meta.url);
    assert.ok(existsSync(url), 'Missing Chinese route: ' + route);
    const html = readFileSync(url, 'utf8');
    assert.match(html, /<html lang="zh-CN">/);
    assert.match(html, /下载 Mac 版/);
    assert.ok(html.includes('href="https://overflowbar.top/zh/' + route + '"'));
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="zh-Hans"/);
    assert.match(html, /data-language="en"/);
    if (route === 'guides/mac-menu-bar-managers/') assert.ok(html.includes('href="/zh/guides/mac-menu-bar-managers/"'));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) assert.doesNotThrow(() => JSON.parse(json));
    for (const [, href] of html.matchAll(/(?:href|src|poster)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      const path = new URL(href, 'https://overflowbar.top').pathname;
      assert.ok(existsSync(new URL('../dist' + path, import.meta.url)), 'Broken Chinese page asset/link: ' + href);
    }
  }
  const sitemap = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  assert.equal((sitemap.match(/<url>/g) || []).length, 10);
});
