import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for (const language of ['en', 'zh-CN']) test('a recording retains its paused frame and resumes in ' + language, async () => {
  const classes = new Set();
  const label = { textContent: 'Play recording' };
  const attributes = new Map();
  const listeners = new Map();
  const button = {
    hidden: true,
    disabled: false,
    querySelector: () => label,
    hasAttribute: name => attributes.has(name),
    setAttribute: (name, value) => attributes.set(name, value),
    addEventListener: (name, callback) => listeners.set(name, callback),
    click: () => listeners.get('click')()
  };
  const video = new EventTarget();
  Object.assign(video, {
    paused: true, ended: false, currentTime: 0,
    querySelector: () => null, querySelectorAll: () => [],
    load() {},
    async play() { this.paused = false; this.dispatchEvent(new Event('play')); },
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  });
  const media = {
    classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
    querySelector: query => query === 'video' ? video : button
  };
  const document = {
    documentElement: { lang: language },
    querySelector: () => null,
    querySelectorAll: query => query === '.scene-media' ? [media] : [],
    addEventListener() {}
  };
  const context = vm.createContext({ document, window: {}, matchMedia: () => ({ matches: false, addEventListener() {} }), setTimeout, navigator: {}, console });
  vm.runInContext(readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8'), context);
  await button.click();
  video.currentTime = 1.25;
  await button.click();
  assert.equal(video.paused, true);
  assert.ok(classes.has('is-playing'), 'Pause must keep the actual footage visible');
  assert.equal(label.textContent, language === 'en' ? 'Resume' : '继续播放');
  await button.click();
  assert.equal(video.paused, false);
  assert.equal(video.currentTime, 1.25, 'Resume must not restart the recording');
});
