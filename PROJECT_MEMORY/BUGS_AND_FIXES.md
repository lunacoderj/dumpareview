# Bugs & Fixes

## Active Bugs
- **Cloudflare Pages Deployment Placeholder**: `https://dumpareviews.jaggu.me` returns Cloudflare's default 404 page ("There is nothing here yet"). The custom domain must be verified in the Cloudflare dashboard under Workers & Pages to link to the active deployment branch.

## Resolved Bugs

### 2026-10-12 — Supabase 401 Unauthorized on QR Code Generation & Profile Upsert
- **Symptoms**: Browser console showed:
  ```text
  POST https://tvkdglzzzmzxmunbkkyk.supabase.co/rest/v1/profiles?on_conflict=user_id 401 (Unauthorized)
  POST https://tvkdglzzzmzxmunbkkyk.supabase.co/rest/v1/qr_codes?select=* 401 (Unauthorized)
  {"code":"42501","message":"new row violates row-level security policy for table profiles"}
  ```
- **Root Cause**: The application authenticates users via Firebase Auth (Google Sign-In) rather than Supabase Auth. Consequently, all browser REST calls to Supabase PostgREST operate under the `anon` role (where Supabase `auth.uid()` is `NULL`). Supabase Row Level Security (RLS) policies restricted inserts to authenticated Supabase users or checked `auth.uid() = user_id`, rejecting Firebase client requests with error 42501 (mapped to 401 Unauthorized).
- **Affected Files**: `supabase_schema.sql`, `src/pages/GenerateQR.tsx`, `src/pages/Dashboard.tsx`
- **Fix**: Formulated migration SQL to disable RLS or allow public/anon insert/update access for `profiles`, `qr_codes`, and `scan_events`, and updated `supabase_schema.sql`.
- **Status**: Documented with migration SQL for execution in Supabase Dashboard.

### 2026-10-12 — Missing Server Directory on Render Deployment
- **Symptoms**: Render deployment failed with:
  ```
  ==> Root directory "server" does not exist. Verify the Root Directory configured in your service settings.
  ```
- **Root Cause**: An upstream bot revert commit (`24b045a`) previously deleted the entire `server/` folder from git. Since Render was configured with Root Directory = `server`, it couldn't locate the directory upon checkout.
- **Affected Files**: `server/package.json`, `server/package-lock.json`, `server/index.js`, `server/check_db.js`, `server/set_admin.js`
- **Fix**: Restored `server/` directory from commit `c3eda269`, updated CORS allowed origins to include `dumpareview.online`, updated Firebase Admin default fallback project to `dumpareviews`, and committed to `main`.
- **Status**: Fixed

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
