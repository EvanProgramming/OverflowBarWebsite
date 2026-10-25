# OverflowBar website

Official product website for the open-source macOS app. Static English HTML is generated at build time. There are no runtime dependencies, tracking scripts, account flows, or client-side API requirements.

## Build and check

Requires Node.js 24 or newer.

    npm run build
    npm test
    npm run dev

The preview is served on port 4173. Its local server returns the actual 404 page with HTTP status 404.

The site.config.json file holds the real published origin and official project links. Change the origin, rebuild, and deploy when migrating domains. Canonical links, social metadata, schema, robots, and the sitemap share this source.

## Media

The app icon comes from the official OverflowBar repository. Product media is derived from recordings provided by the project owner in this chat. Original footage is not modified or bundled with the website. The prepare-media.py script documents source paths, cut points, and crop regions for this session; the web-ready derivatives in assets/ are versioned and sufficient to rebuild the site.

- Second-row reveal: export-1792814595309.mp4.
- Settings and selection: export-1792813725484.mp4.
- Original menu: authentic screen region of overflowbar-review-v4.1.mp4.

Recording metadata did not establish exact app/macOS versions. No claim that the footage independently verifies a particular release is made. Interface and capability claims were checked against the published v1.5.1 source.

## Product accuracy

Review installation, permissions, troubleshooting, and release-check reports in the application repository when updating copy. Do not infer runtime compatibility from a universal build or a deployment target. Primary download links intentionally point to the latest stable release; the site does not query GitHub at runtime.

Application licensing and upstream notices are linked from every page. Product source: https://github.com/EvanProgramming/OverflowBar.

## Publication

The tracked .openai/hosting.json binds this checkout to its Sites project. Never register this checkout again. Deploy the dist/ static output from the exact pushed commit.

The Sites helper package was unavailable in the current executor. The publish-source.py script implements the equivalent ordinary Git synchronization with the native Sites credential passed only through hidden stdin. It stores no token in Git configuration or source files.
