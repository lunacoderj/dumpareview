# Bugs & Fixes

## Active Bugs
- **Cloudflare Pages Deployment Placeholder**: `https://dumpareviews.jaggu.me` returns Cloudflare's default 404 page ("There is nothing here yet"). The custom domain must be verified in the Cloudflare dashboard under Workers & Pages to link to the active deployment branch.

## Resolved Bugs

### 2026-10-12 — Service Worker Stale-Build Cache Trap
- **Symptoms**: Browser showed:
  ```
  Failed to load resource: the server responded with a status of 404 ()
  /assets/index-BjyiK1Tw.css:1  Failed to load resource: the server responded with a status of 404 ()
  sw.js:27 Fetch failed loading: GET "https://dumpareviews.jaggu.me/assets/index-BjyiK1Tw.css"
  ```
- **Root Cause**: `public/sw.js` cached `/index.html` with an unconditional Cache-First strategy. Whenever Vite produced new asset hashes or deployments, clients served an old `index.html` that requested non-existent hashed files.
- **Affected Files**: `public/sw.js`, `index.html`
- **Fix**: Replaced Cache-First navigation with Network-First in `public/sw.js`, bumped cache name to `dumpareview-v2`, added automatic deletion of old caches on `activate`, and added `reg.update()` in `index.html`.
- **Status**: Fixed

### 2026-10-12 — Invalid PWA Manifest Icons
- **Symptoms**:
  ```
  /pwa-192.png:1 Failed to load resource: the server responded with a status of 404 ()
  (index):1 Error while trying to use the following icon from the Manifest: .../pwa-192.png (Download error or resource isn't a valid image)
  ```
- **Root Cause**: `public/pwa-192.png` and `public/pwa-512.png` were 1024x1024 JPEG files (JFIF header `FF D8 FF E0`) misnamed as `.png`. The manifest declared them as `type: "image/png"`, causing image decode errors.
- **Affected Files**: `public/pwa-192.png`, `public/pwa-512.png`, `public/manifest.json`
- **Fix**: Converted both files into genuine PNG format with proper dimensions (192x192 and 512x512). Updated manifest metadata name to `DumpaReview`.
- **Status**: Fixed

### 2026-10-12 — Missing SPA Client Routing on Cloudflare Pages
- **Symptoms**: Refreshing any sub-route on Cloudflare Pages returns 404.
- **Root Cause**: `_redirects` was missing from `public/` (it previously only existed inside `dist/`, which gets wiped on every build).
- **Affected Files**: `public/_redirects`
- **Fix**: Added `public/_redirects` containing `/* /index.html 200`.
- **Status**: Fixed

### 2026-10-12 — Build & Linting Type Errors
- **Symptoms**: `eslint .` exited with 4 errors across `command.tsx`, `textarea.tsx`, `ScanRedirect.tsx`, and `tailwind.config.ts`.
- **Root Cause**: Empty TypeScript interfaces, `any` cast, and CommonJS `require()` in ES module Tailwind config.
- **Affected Files**: `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`, `src/pages/ScanRedirect.tsx`, `tailwind.config.ts`
- **Fix**: Used type aliases, safe typed casts, and ESM imports.
- **Status**: Fixed
