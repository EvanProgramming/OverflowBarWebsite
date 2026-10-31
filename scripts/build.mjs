import { readFileSync, writeFileSync, mkdirSync, cpSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { metadata, translateLayout, localizeLinks } from './localization.mjs';
const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
if (!/^https:\/\/[^/]+$/.test(config.origin)) throw new Error('Set the actual HTTPS Site origin in site.config.json');
if (!/^[a-f0-9]{32}$/.test(config.indexNowKey)) throw new Error('Set a 32-character lowercase hexadecimal IndexNow key in site.config.json');
const output = join(root, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(root, 'assets'), join(output, 'assets'), { recursive: true });
if (config.googleVerificationFile) copyFileSync(join(root, config.googleVerificationFile), join(output, config.googleVerificationFile));
const template = readFileSync(join(root, 'src/layout.html'), 'utf8');
const styleHash = createHash('sha256').update(readFileSync(join(root, 'assets/site.css'))).digest('hex').slice(0, 12);
const scriptHash = createHash('sha256').update(readFileSync(join(root, 'assets/site.js'))).digest('hex').slice(0, 12);
const pages = [
  { path: '', source: 'home', title: 'OverflowBar — Mac Menu Bar Manager with a Second Row', description: 'Organize a crowded Mac menu bar with a second row for selected icons. OverflowBar is a free, open-source macOS menu bar manager.', label: 'Home' },
  { path: 'install/', source: 'install', title: 'Install OverflowBar for Mac — Download & Setup', description: 'Download and install OverflowBar for macOS 15 and 26. Check compatibility, required Accessibility access, optional Screen Recording, and setup steps.', label: 'Install' },
  { path: 'help/', source: 'help', title: 'OverflowBar Help — Missing Mac Menu Bar Icons & Fixes', description: 'Troubleshoot missing Mac menu bar icons, the OverflowBar arrow, previews, and permissions. Learn how to restore icons and check compatibility.', label: 'Help' },
  { path: 'guides/mac-menu-bar-overflow/', source: 'guide', title: 'Mac Menu Bar Icons Hidden by the Notch? | OverflowBar', description: 'Find why Mac menu bar icons disappear near the notch, what macOS settings can do, and how a second-row manager can help with supported icons.', label: 'Mac menu bar overflow' },
  { path: '404.html', source: '404', title: 'Page Not Found — OverflowBar', description: 'Find your way back to OverflowBar, the free and open-source Mac menu bar manager with a second row.', label: 'Page not found', notFound: true }
];
const localizedPages = pages.map(page => ({ ...page, path: 'zh/' + page.path, originalPath: page.path, title: metadata[page.source][0], description: metadata[page.source][1], label: metadata[page.source][2], language: 'zh-CN' }));
const languageHash = createHash('sha256').update(readFileSync(join(root, 'assets/language.js'))).digest('hex').slice(0, 12);
for (const page of [...pages, ...localizedPages]) {
  const chinese = page.language === 'zh-CN';
  const language = chinese ? 'zh-CN' : 'en';
  const originalPath = chinese ? page.originalPath : page.path;
  const localeHome = config.origin + (chinese ? '/zh/' : '/');
  const url = config.origin + '/' + page.path;
  const graph = [{ '@type': 'WebSite', '@id': localeHome + '#website', name: config.product, url: localeHome, inLanguage: language }];
  if (page.source === 'home') graph.push({ '@type': 'SoftwareApplication', '@id': config.origin + '/#software', name: config.product, url: config.origin + '/', description: chinese ? page.description : 'A free, open-source menu bar manager for Mac with a second row for selected supported icons.', applicationCategory: 'UtilitiesApplication', operatingSystem: 'macOS 15 and macOS 26; native icon management unavailable on macOS 27 and later', isAccessibleForFree: true, license: config.repository + '/blob/main/LICENSE', downloadUrl: config.download, sameAs: config.repository, image: config.origin + '/assets/social-preview.png', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: config.download } });
  if (originalPath && !page.notFound) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'OverflowBar', item: localeHome }, { '@type': 'ListItem', position: 2, name: page.label, item: url }] });
  const values = { CONTENT: readFileSync(join(root, 'src', chinese ? 'zh' : '', page.source + '.html'), 'utf8'), TITLE: page.title.replaceAll('&', '&amp;'), DESCRIPTION: page.description.replaceAll('&', '&amp;'), CANONICAL: url, ORIGIN: config.origin, DOWNLOAD: config.download, REPOSITORY: config.repository, ROBOTS: page.notFound ? 'noindex, follow' : 'index, follow', BODY_CLASS: page.source === 'home' ? 'home-page' : 'document-page', PRELOAD: page.source === 'home' ? '<link rel="preload" href="/assets/row-open.webp" as="image" fetchpriority="high">' : '', SCHEMA: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c') };
  let html = chinese ? localizeLinks(translateLayout(template)) : template;
  if (chinese) values.CONTENT = localizeLinks(values.CONTENT);
  const alternateEn = config.origin + '/' + originalPath;
  const alternateZh = config.origin + '/zh/' + originalPath;
  const alternates = page.notFound ? '' : '<link rel="alternate" hreflang="en" href="' + alternateEn + '"><link rel="alternate" hreflang="zh-Hans" href="' + alternateZh + '"><link rel="alternate" hreflang="x-default" href="' + alternateEn + '">';
  const switcher = '<nav class="language-switch" aria-label="' + (chinese ? '切换语言' : 'Language') + '"><a data-language="en" lang="en" hreflang="en" href="/' + originalPath + '?lang=en"' + (!chinese ? ' aria-current="true"' : '') + '>EN</a><span aria-hidden="true">/</span><a data-language="zh" lang="zh-CN" hreflang="zh-Hans" href="/zh/' + originalPath + '?lang=zh"' + (chinese ? ' aria-current="true"' : '') + '>中文</a></nav>';
  html = html.replace('{{LANGUAGE}}', language).replace('{{ALTERNATES}}', alternates).replace('{{LANGUAGE_SWITCH}}', switcher).replace('{{LANGUAGE_HASH}}', languageHash).replace('{{OG_LOCALE}}', chinese ? 'zh_CN' : 'en_US');
  for (const key of ['CONTENT', 'TITLE', 'DESCRIPTION', 'CANONICAL', 'ORIGIN', 'DOWNLOAD', 'REPOSITORY', 'ROBOTS', 'BODY_CLASS', 'PRELOAD', 'SCHEMA']) html = html.replaceAll('{{' + key + '}}', values[key]);
  html = html.replaceAll('{{STYLE_HASH}}', styleHash).replaceAll('{{SCRIPT_HASH}}', scriptHash);
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Unresolved template value on ' + page.path);
  const destination = page.notFound ? join(output, page.path) : join(output, page.path, 'index.html');
  mkdirSync(resolve(destination, '..'), { recursive: true });
  writeFileSync(destination, html);
}
const urls = [...pages, ...localizedPages].filter(page => !page.notFound).map(page => '<url><loc>' + config.origin + '/' + page.path + '</loc></url>').join('');
writeFileSync(join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + '</urlset>\n');
writeFileSync(join(output, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + config.origin + '/sitemap.xml\n');
writeFileSync(join(output, 'llms.txt'), readFileSync(join(root, 'src/llms.txt'), 'utf8').replaceAll('{{ORIGIN}}', config.origin));
writeFileSync(join(output, config.indexNowKey + '.txt'), config.indexNowKey + '\n');
writeFileSync(join(output, 'CNAME'), new URL(config.origin).hostname + '\n');
writeFileSync(join(output, '.nojekyll'), '');
writeFileSync(join(output, '_headers'), '/assets/*\n  Cache-Control: public, max-age=86400\n  X-Content-Type-Options: nosniff\n/*\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n');
if (process.env.QA_PREVIEW === '1') writeFileSync(join(output, '__responsive-review.html'), readFileSync(join(root, 'scripts/mobile-preview.html')));
console.log('Built eight localized static pages, localized 404 pages, crawl guidance, IndexNow verification, metadata, and product assets.');
