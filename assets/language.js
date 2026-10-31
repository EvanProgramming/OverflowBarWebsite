(() => {
  'use strict';
  const supported = ['/', '/install/', '/help/', '/guides/mac-menu-bar-overflow/'];
  const url = new URL(location.href);
  const chinesePath = url.pathname.startsWith('/zh/');
  const basePath = chinesePath ? url.pathname.slice(3) : url.pathname;
  if (!supported.includes(basePath)) return;
  let preference = url.searchParams.get('lang');
  if (preference !== 'en' && preference !== 'zh') preference = null;
  const explicitPreference = preference;
  try {
    if (preference) localStorage.setItem('overflowbar.language', preference);
    else {
      const saved = localStorage.getItem('overflowbar.language');
      if (saved === 'en' || saved === 'zh') preference = saved;
    }
  } catch { /* Language links still work when storage is unavailable. */ }
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    for (const link of document.querySelectorAll('[data-language]')) {
      const target = new URL(link.href);
      for (const [key, value] of url.searchParams) if (key !== 'lang') target.searchParams.append(key, value);
      target.hash = url.hash;
      link.href = target.href;
    }
  });
  // A shared Chinese URL is explicit; a saved preference never overrides it.
  if (chinesePath && !explicitPreference) return;
  let language = preference;
  if (!language) {
    for (const value of (navigator.languages?.length ? navigator.languages : [navigator.language])) {
      const code = String(value || '').toLowerCase().split(/[-_]/)[0];
      if (code === 'en' || code === 'zh') { language = code; break; }
    }
  }
  if (!language) {
    let zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    language = ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'Asia/Urumqi', 'Asia/Hong_Kong', 'Asia/Macau', 'Asia/Macao', 'Asia/Taipei'].includes(zone) ? 'zh' : 'en';
  }
  const destination = language === 'zh' ? '/zh' + basePath : basePath;
  if (destination !== url.pathname) { url.pathname = destination; location.replace(url.href); }
})();
