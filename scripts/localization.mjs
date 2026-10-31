export const metadata = {
  home: ['OverflowBar — 为 Mac 菜单栏增加第二排', '免费的开源 Mac 菜单栏管理工具。选择要收起的图标，在第二排中访问它们，并打开应用原本的菜单和控件。', '首页'],
  install: ['安装 OverflowBar — Mac 下载、权限与兼容性', '从 GitHub 或 Homebrew 安装 OverflowBar，了解 macOS 兼容性、辅助功能权限、可选屏幕录制权限与首次启动步骤。', '安装'],
  help: ['OverflowBar 帮助 — 菜单栏图标、权限与故障排查', '解决 OverflowBar 箭头或图标不显示、预览缺失、权限失效等问题，了解如何恢复图标以及 macOS 兼容性限制。', '帮助'],
  guide: ['Mac 菜单栏图标被刘海遮挡？— OverflowBar 使用指南', '了解 Mac 菜单栏拥挤与图标隐藏的原因、系统设置能做什么，以及如何通过第二排访问受支持的菜单栏图标。', '菜单栏指南'],
  '404': ['找不到页面 — OverflowBar', '返回 OverflowBar 官网，了解免费的开源 Mac 菜单栏管理工具。', '找不到页面']
};
export const layoutWords = {
  'Skip to content': '跳转到正文', 'OverflowBar home': 'OverflowBar 首页', 'Main navigation': '主导航',
  'How it works': '使用方式', 'Install': '安装', 'Help': '帮助', 'Download for Mac': '下载 Mac 版',
  'A little more room for your Mac.': '为你的 Mac 多留一点空间。', 'Free. Open source. Made for macOS.': '免费、开源，专为 macOS 而作。',
  'Footer': '页脚导航', 'Download': '下载', 'Install &amp; compatibility': '安装与兼容性', 'Troubleshooting': '故障排查',
  'Mac menu bar guide': 'Mac 菜单栏指南', 'Privacy': '隐私说明', 'License': '许可证', 'Acknowledgements': '致谢',
  'OverflowBar is licensed under GPL-3.0. Its native engine includes work from': 'OverflowBar 采用 GPL-3.0 许可证，其原生引擎包含以下项目的贡献：',
  'and': '与', 'OverflowBar. Give your menu bar a second row. A real second row open beneath the Mac menu bar.': 'OverflowBar：为菜单栏增加第二排。真实 Mac 菜单栏下方展开的第二排图标。'
};
export function translateLayout(html) {
  return html.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) return part.replace(/(aria-label|alt)="([^"]*)"/g, (match, attr, value) => attr + '="' + (layoutWords[value] || value) + '"');
    const value = part.trim();
    return layoutWords[value] ? part.replace(value, layoutWords[value]) : part;
  }).join('');
}
export function localizeLinks(html) {
  return html.replace(/href="(\/(?:#[^"]*|install\/[^"]*|help\/[^"]*|guides\/mac-menu-bar-overflow\/[^"]*)?)"/g, (_, path) => 'href="/zh' + path + '"');
}
