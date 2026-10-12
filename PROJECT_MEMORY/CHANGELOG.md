# Changelog

All changes to this project are recorded here in reverse-chronological order.
This file is append-only — do not rewrite or remove previous entries.

## 2026-10-12 (Render Deployment Fix & Backend Server Restoration)

### Task
Fix Render deployment failure: `Root directory "server" does not exist`.

### Result
- Restored `server/` codebase (`index.js`, `package.json`, `package-lock.json`, `check_db.js`, `set_admin.js`) which had been removed by an earlier automated revert commit.
- Updated `server/index.js` to whitelist `https://dumpareview.online` and `https://www.dumpareview.online` in CORS.
- Updated `server/index.js` default Firebase project ID fallback to `dumpareviews`.
- Verified syntax with `node -c server/index.js`.

### Files Restored / Created
- `server/package.json`
- `server/package-lock.json`
- `server/index.js`
- `server/check_db.js`
- `server/set_admin.js`

### Files Modified
- `server/index.js`
- `PROJECT_MEMORY/BUGS_AND_FIXES.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

## 2026-10-12 (Firebase Project Migration & Account Data Sync)

### Task
Update environment variables with new Firebase project credentials (`dumpareviews`), ensure automatic transfer of user QR codes and analytics from old Firebase account (`jagadeeshdashboard`) to prevent data loss, verify Render backend configuration, and configure Vercel environment variables.

### Result
- Updated `.env` with new Firebase credentials (`dumpareviews`).
- Created `src/lib/accountSync.ts` to automatically query and migrate QR codes by email when a user logs in with the new Firebase account.
- Integrated `syncUserAccount` in `src/pages/Dashboard.tsx` and `src/pages/Analytics.tsx`.
- Updated `server/.env` with `FRONTEND_URL=https://dumpareview.online` and `FIREBASE_PROJECT_ID=dumpareviews`.
- Verified production build (`npm run build`) completed successfully with 0 errors.

### Files Created
- `src/lib/accountSync.ts`

### Files Modified
- `.env`
- `src/lib/accountSync.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/Analytics.tsx`
- `server/.env`

## 2026-10-12 (Domain Migration & Legal/SEO Expansion)

### Task
Migrate project domain to `dumpareview.online`, update sitemap and robots.txt, enrich SEO keywords targeting clients across industries, build Terms & Conditions, Privacy Policy, Cookie Policy, and Cookie Consent banner, and provide fix for Firebase Authorized Domain registration error.

### Result
- Added `public/sitemap.xml` with all canonical routes for `dumpareview.online`.
- Updated `public/robots.txt` with sitemap reference and protected dashboard paths.
- Updated `index.html` with canonical tag, client-tailored keywords (restaurants, salons, clinics, retail, auto services), OG/Twitter meta tags, and JSON-LD schema.
- Created `src/pages/Terms.tsx`, `src/pages/PrivacyPolicy.tsx`, and `src/pages/CookiePolicy.tsx` with complete compliance details.
- Created `src/components/Footer.tsx` and `src/components/CookieConsent.tsx`.
- Registered routes in `src/App.tsx` and updated global layout.
- Purged all remaining references to legacy branding across UI components (`Navbar.tsx`, `ScanRedirect.tsx`, `Home.tsx`, `Auth.tsx`, `index.css`).
- Built production bundle cleanly.

### Files Created
- `public/sitemap.xml`
- `src/components/Footer.tsx`
- `src/components/CookieConsent.tsx`
- `src/pages/Terms.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/CookiePolicy.tsx`

### Files Modified
- `index.html`
- `public/robots.txt`
- `src/App.tsx`
- `src/pages/Home.tsx`
- `src/pages/Auth.tsx`
- `src/pages/ScanRedirect.tsx`
- `src/components/Navbar.tsx`
- `src/index.css`
- `PROJECT_MEMORY/PROJECT_STATE.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

---

## 2026-10-12

### Task
Diagnose and fix production errors: 404 for `/assets/index-BjyiK1Tw.css`, 404/invalid format for `/pwa-192.png`, service worker fetch errors (`sw.js:27`), and Cloudflare Pages deployment issues.

### Result
Fixed Service Worker caching strategy (switched to Network-First navigation with cache cleanup), converted PWA icons to genuine PNG format, added `public/_redirects` for Cloudflare Pages SPA client routing, corrected manifest metadata to DumpaReview, added `reg.update()` in `index.html`, and resolved 4 ESLint build-blocking errors across UI components. Built successfully.

### Files Created
- `public/_redirects`
- `PROJECT_MEMORY/PROJECT_STATE.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/NEXT_STEPS.md`
- `PROJECT_MEMORY/ARCHITECTURE.md`
- `PROJECT_MEMORY/BUGS_AND_FIXES.md`

### Files Modified
- `public/sw.js` — updated cache name to `dumpareview-v2`, added old cache purging on `activate`, implemented Network-First strategy for SPA navigation requests, and added graceful offline fallback.
- `public/manifest.json` — updated app name and short name to `DumpaReview`.
- `public/pwa-192.png` — replaced disguised 1024x1024 JPEG with a genuine 192x192 PNG.
- `public/pwa-512.png` — replaced disguised 1024x1024 JPEG with a genuine 512x512 PNG.
- `index.html` — added `reg.update()` to service worker registration callback.
- `src/components/ui/command.tsx` — changed empty interface `CommandDialogProps` to type alias.
- `src/components/ui/textarea.tsx` — changed empty interface `TextareaProps` to type alias.
- `src/pages/ScanRedirect.tsx` — eliminated `any` type assertion on `(window as any).adsbygoogle`.
- `tailwind.config.ts` — replaced `require("tailwindcss-animate")` with ES module import.

---

## PROJECT MEMORY INITIALIZATION — CODEBASE BASELINE
- Baseline established on 2026-10-12.
- Repository: `https://github.com/lunacoderj/dumpareview`
- Branch: `main`
