import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const origin = JSON.parse(readFileSync(join(root, 'site.config.json'))).origin;
const routes = ['', 'install/', 'help/', 'guides/mac-menu-bar-overflow/', 'guides/mac-menu-bar-managers/'];
const read = path => existsSync(path) ? readFileSync(path, 'utf8') : '';

test('each public route has complete, uniquely described HTML without JavaScript', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const html = read(join(dist, route, 'index.html'));
    assert.ok(html.length > 5000, 'Missing complete HTML for /' + route);
    assert.match(html, /<html lang="en">/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.equal((html.match(/<main[ >]/g) || []).length, 1);
    assert.ok(html.includes('rel="canonical" href="' + origin + '/' + route + '"'));
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const description = html.match(/name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && description);
    titles.add(title); descriptions.add(description);
    assert.match(html, /https:\/\/github.com\/EvanProgramming\/OverflowBar\/releases\/latest/);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      assert.doesNotThrow(() => JSON.parse(json));
      assert.ok(!json.includes('aggregateRating'));
    }
  }
  assert.equal(titles.size, routes.length);
  assert.equal(descriptions.size, routes.length);
});

test('all local links and assets resolve, including nested routes and crawl files', () => {
  for (const route of routes) {
    const html = read(join(dist, route, 'index.html'));
    assert.ok(html, 'Page missing');
    for (const [, url] of html.matchAll(/(?:href|src|poster)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      const file = join(dist, new URL(url, origin).pathname);
      assert.ok(existsSync(file), 'Broken local URL: ' + url);
      if (statSync(file).isDirectory()) assert.ok(existsSync(join(file, 'index.html')));
    }
  }
  assert.match(read(join(dist, 'robots.txt')), /Allow: \/\nSitemap: https:\/\//);
  const sitemap = read(join(dist, 'sitemap.xml'));
  for (const route of routes) assert.ok(sitemap.includes(origin + '/' + route));
  assert.ok(existsSync(join(dist, '404.html')));
});

test('installation explains material permission, signing, and compatibility limits', () => {
  const html = read(join(dist, 'install/index.html'));
  for (const text of ['Accessibility', 'Screen Recording', 'not notarized', 'macOS 27', 'Intel', 'not physically tested', 'brew tap EvanProgramming/overflowbar', 'brew install --cask EvanProgramming/overflowbar/overflowbar']) assert.ok(html.includes(text), 'Missing: ' + text);
  assert.ok(!html.includes('spctl --master-disable'));
});

test('media and page enhancements remain within lightweight transfer budgets', () => {
  const js = read(join(dist, 'assets/site.js'));
  assert.ok(js.length > 100, 'Missing website interactions');
  assert.ok(gzipSync(js).length < 35 * 1024);
  for (const file of ['reveal.mp4', 'selection.mp4', 'original-menu.mp4']) {
    const path = join(dist, 'assets', file);
    assert.ok(existsSync(path), 'Missing product media: ' + file);
    assert.ok(statSync(path).size < 2 * 1024 * 1024, 'Video exceeds budget: ' + file);
  }
});

test('every useful public page can be reached through another page', () => {
  for (const target of routes.filter(Boolean)) {
    assert.ok(routes.filter(route => route !== target).some(route => read(join(dist, route, 'index.html')).includes('href="/' + target + '"')), 'Orphaned page: /' + target);
  }
});

test('JavaScript-dependent controls are hidden until initialized', () => {
  for (const route of routes) {
    const html = read(join(dist, route, 'index.html'));
    for (const [tag] of html.matchAll(/<button[^>]*(?:data-demo-play|data-video-play|data-copy)[^>]*>/g)) assert.match(tag, /\bhidden\b/, 'Inactive control remains visible without JavaScript');
    if (route === '') assert.match(html, /class="demo-segment"[^>]*\bhidden\b/);
  }
});

test('small informational labels meet WCAG AA contrast', () => {
  const css = read(join(root, 'assets/site.css'));
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const [selector, background] of [['.document-toc>p', '#fafaf8'], ['.attribution', '#fafaf8'], ['.scene-topline', '#f0f0eb'], ['.scene-footnote', '#f0f0eb']]) {
    const rule = css.split(selector + '{')[1]?.split('}')[0];
    const foreground = rule?.match(/(?:^|;)color:(#[a-fA-F0-9]{6})/)?.[1];
    assert.ok(foreground, 'Missing label color');
    const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
    const contrast = (values[1] + .05) / (values[0] + .05);
    assert.ok(contrast >= 4.5, selector + ' contrast is ' + contrast.toFixed(2));
  }
});

test('GitHub Pages output uses the owned domain and excludes temporary review pages', () => {
  assert.equal(origin, 'https://overflowbar.top');
  assert.equal(read(join(dist, 'CNAME')).trim(), 'overflowbar.top');
  assert.ok(existsSync(join(dist, '.nojekyll')));
  assert.ok(!existsSync(join(dist, '__responsive-review.html')));
  const verificationFile = JSON.parse(readFileSync(join(root, 'site.config.json'))).googleVerificationFile;
  assert.equal(read(join(dist, verificationFile)).trim(), 'google-site-verification: ' + verificationFile);
});

test('the LLM summary documents verified product facts and only canonical public pages', () => {
  const summary = read(join(dist, 'llms.txt'));
  for (const fact of ['Accessibility permission is required', 'Screen Recording permission is optional', 'macOS 15 and macOS 26', 'macOS 27 and later', 'not notarized', 'GPL-3.0', 'Ice', 'Thaw', 'does not provide search', 'overflowbar.top']) assert.ok(summary.includes(fact), 'Missing verified LLM fact: ' + fact);
  for (const route of routes) assert.ok(summary.includes(origin + '/' + route), 'Missing canonical page: /' + route);
  assert.ok(summary.includes('https://github.com/EvanProgramming/OverflowBar/releases/latest'));
  assert.ok(!summary.includes('profiles, or a global toggle shortcut coming soon'));
});

test('the IndexNow key is a matching 32-character hexadecimal root file', () => {
  const key = JSON.parse(readFileSync(join(root, 'site.config.json'))).indexNowKey;
  assert.match(key, /^[a-f0-9]{32}$/);
  assert.equal(read(join(dist, key + '.txt')).trim(), key);
});

test('the guide states icon support limits and links to help and compatibility', () => {
  const html = read(join(dist, 'guides/mac-menu-bar-overflow/index.html'));
  const answer = html.slice(html.indexOf('<article class="document-content">'), html.indexOf('<section id="space">'));
  assert.match(answer, /selected supported icons/i);
  assert.match(answer, /cannot manage every icon hidden by a MacBook notch/i);
  assert.match(answer, /protected controls/i);
  assert.match(answer, /href="\/help\/"/);
  assert.match(answer, /href="\/install\/#compatibility"/);
});

test('the manager comparison is sourced, transparent, and accurate for OverflowBar', () => {
  const html = read(join(dist, 'guides/mac-menu-bar-managers/index.html'));
  for (const text of ['Mac menu bar managers', 'OverflowBar team', '31 October 2026', 'Bartender', 'Ice', 'Thaw', 'Hidden Bar', 'Screen Recording', 'macOS 27 and later', 'does not provide item search']) assert.ok(html.includes(text), 'Missing comparison fact: ' + text);
  for (const link of ['https://www.macbartender.com/', 'https://icemenubar.app/', 'https://github.com/thaw-app/Thaw', 'https://github.com/dwarvesf/hidden']) assert.ok(html.includes(link), 'Missing primary product source: ' + link);
  assert.match(html, /rel="canonical" href="https:\/\/overflowbar\.top\/guides\/mac-menu-bar-managers\/"/);
  assert.ok(read(join(dist, 'sitemap.xml')).includes('https://overflowbar.top/guides/mac-menu-bar-managers/'));
});

test('Pages notifies IndexNow after deployment and reports receipt without claiming indexing', () => {
  const workflow = read(join(root, '.github/workflows/pages.yml'));
  assert.match(workflow, /api\.indexnow\.org\/indexnow/);
  assert.ok(workflow.includes("key=\"$(node -e 'console.log(JSON.parse(require(\"node:fs\").readFileSync(\"site.config.json\",\"utf8\")).indexNowKey)')\""));
  assert.match(workflow, /200\|202/);
  assert.match(workflow, /accepted notification/);
  assert.match(workflow, /urlList/);
  for (const route of routes) assert.ok(workflow.includes(origin + '/' + route));
});
