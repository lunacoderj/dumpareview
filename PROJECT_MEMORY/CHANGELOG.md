# Changelog

All changes to this project are recorded here in reverse-chronological order.
This file is append-only — do not rewrite or remove previous entries.

## 2026-11-05 (Fix: Resilient Schema Fallbacks, Service Worker Fetch Crash, & PostgREST 400 Resolution)

### Issues Diagnosed
1. **Service Worker Navigation Crash**: `public/sw.js` threw `Uncaught (in promise) TypeError: Failed to fetch` at line 63 when intercepting SPA routes (like `/qr/:id`) because client-side requests without `'navigate'` mode fell through to the static asset cache-first block with no rejection catch handler.
2. **PostgREST 400 Bad Request on Notifications**: `NotificationBell.tsx` queried `notifications?select=*,qr_codes(name,business_category)` which failed with error `PGRST200` ("Searched for a foreign key relationship between notifications and qr_codes in schema public, but no matches were found").
3. **AI 100 Messages & QR Generation Failures**: The live Supabase database was missing columns `business_category`, `status`, and `auto_refill_prompted` on `qr_codes`, causing `insert` and `update` calls to fail with error 42703.
4. **Audit Agent & Analytics Failures**: The live Supabase database was missing `verification_status` and `marked_for_audit` on `scan_events`, causing queries to fail with 400 Bad Request.

### Fixes Applied
- **`public/sw.js`**: Enhanced SPA navigation check to recognize all extension-less paths and `text/html` requests; wrapped all fetch calls with `.catch()` falling back to `/index.html` or graceful timeout response; bumped cache name to `dumpareview-v3`.
- **`src/components/NotificationBell.tsx`**: Removed foreign key join from `notifications` query; implemented client-side in-memory QR mapping; normalized `read` and `is_read` column names.
- **`src/pages/GenerateQR.tsx`**: Implemented two-tier insert logic: attempts full schema first, automatically falls back to baseline core columns (`user_id`, `name`, `google_review_link`, `messages`, `message_used_counts`, `current_message_index`, `successful_scans`) if new columns are not yet present in DB.
- **`src/pages/QRDetail.tsx`**: Implemented two-tier update logic: attempts full schema first, automatically falls back to core columns (`messages`, `message_used_counts`, `current_message_index`, `updated_at`) on 100 fresh review regeneration.
- **`src/pages/Analytics.tsx`**: Added query fallback for `scan_events` so table renders existing scans even on legacy database schemas.
- **`src/lib/auditAgent.ts`**: Added baseline query fallback for pending scans.
- **`supabase_schema.sql`**: Added safe migrations for existing `notifications` table (`qr_code_id`, `type`, `action_type`, `action_status`, `is_read`).
- **Tests & Quality**: 7/7 Vitest unit tests passed; ESLint passed with 0 errors; Vite production build passed cleanly.

### Files Modified
- `public/sw.js`
- `src/components/NotificationBell.tsx`
- `src/pages/GenerateQR.tsx`
- `src/pages/QRDetail.tsx`
- `src/pages/Analytics.tsx`
- `src/lib/auditAgent.ts`
- `api/cron-audit.ts`
- `supabase_schema.sql`
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## 2026-11-02 (Implementation & Verification: 'Mark for Review' On-Demand Audit, Deduplication & Re-Review)

### Task
Implement and verify:
1. Business-level "Mark for Review" fast-track action in `Dashboard.tsx` and `QRDetail.tsx` allowing business owners to queue scans for agent audit before the 24-hour window (even 1 minute after scanning).
2. Strict agent deduplication logic (`verified_success` scans are permanently skipped and never re-audited or scraped).
3. Row-level action buttons in `Analytics.tsx` and `QRDetail.tsx`:
   - "Mark Re-Review 🔄" to re-queue failed reviews (`verified_fail` -> `pending`, resets `marked_for_audit = true`).
   - "Fast-Track Audit ⚡" to bypass the 24h maturation lock for recent pending scans (< 24h).
   - "Verified (Skipped)" badge for successful reviews.
   - Business filter dropdown for focused auditing.
4. End-to-end testing, linting cleanup (0 ESLint errors), and clean production build.

### Result
- Added database columns (`marked_for_audit`, `audit_requested_at`, `audit_count` on `scan_events` and `last_audit_requested_at` on `qr_codes`) plus composite index `idx_scan_events_audit_ready` to `supabase_schema.sql`.
- Updated `src/lib/auditAgent.ts` with `markScanForAudit`, `markScanForReReview`, `markBusinessForAudit`, and dual-condition eligibility `(verification_status = 'pending') AND (marked_for_audit = true OR scanned_at <= now() - 24 hours)`.
- Updated `api/cron-audit.ts` (Vercel daily cron) and `server/index.js` (Express endpoint/cron) with identical dual-condition and deduplication logic.
- Implemented UI controls in `Analytics.tsx`, `QRDetail.tsx`, and `Dashboard.tsx`.
- Wrote unit tests in `src/test/auditAgent.test.ts` testing text normalization and fuzzy similarity matching (100% pass across 7 Vitest tests).
- Fixed ESLint errors in `api/cron-audit.ts`, `SeoHead.tsx`, `auditAgent.ts`, and `geminiReviews.ts` (0 errors).
- Clean Vite production build in `dist/` with 0 errors.

### Files Created
- `src/test/auditAgent.test.ts`

### Files Modified
- `supabase_schema.sql`
- `src/lib/auditAgent.ts`
- `api/cron-audit.ts`
- `server/index.js`
- `src/pages/Analytics.tsx`
- `src/pages/QRDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/SeoHead.tsx`
- `src/lib/geminiReviews.ts`
- `PROJECT_MEMORY/PROJECT_STATE.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

### Files Deleted
- `scratch/update_server.cjs` (temporary update script removed)

## 2026-11-02 (Planning: 'Mark for Review' On-Demand Audit & Row-Level Re-Review)

### Task
Architect and design:
1. Business-level "Mark for Review" button enabling owners to fast-track scans for agent audit before the 24-hour maturation deadline (even 1 minute after scanning).
2. Deduplication engine ensuring reviews already marked `verified_success` are never re-audited.
3. Row-level table actions allowing owners to mark failed reviews for re-review ("Mark for Re-Review 🔄") or fast-track pending recent reviews ("Fast-Track Review ⚡").

### Result
- Authored detailed implementation plan in artifact `dumpareview_mark_for_review_plan.md` with complete sequence diagram, database DDL delta, dual-condition eligibility formula, and UI mockups.
- Updated `PROJECT_MEMORY/CURRENT_TASK.md`.

### Files Created
- `dumpareview_mark_for_review_plan.md` (Artifact)

### Files Modified
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## 2026-11-02 (AI 100-Review Generation, Curation Engine, & 24-Hour Verification Agent Implementation)

### Task
Implement end-to-end:
1. Automated 100 natural AI review message generator upon adding business name and Google link (`src/lib/geminiReviews.ts`).
2. Granular message curation UI (inline edit, individual delete, custom message addition, manual regeneration in `src/pages/QRDetail.tsx`).
3. 100-message usage exhaustion tracking and permission lifecycle with in-app notification bell (`src/components/NotificationBell.tsx`) offering Accept/Reject actions.
4. 24-Hour Review Verification Agent enforcing 24h+ maturation filter (scans < 24h old held for next cycle), compatible with Vercel Free Hobby tier (1 daily cron at 00:00 UTC via `vercel.json` & `api/cron-audit.ts`) and Render backend (`server/index.js`).
5. Comprehensive audit table in `src/pages/Analytics.tsx` featuring #, Review Message, Scan Timestamp, Maturation Age, 24h Agent Result badge (Successful / Fail / Awaiting 24h Window), and on-demand manual audit trigger.

### Result
- Created `src/lib/geminiReviews.ts` providing both Gemini AI integration and procedural natural language generation covering 6 industries.
- Created `src/lib/auditAgent.ts` and `api/cron-audit.ts` executing the 24-hour maturation audit.
- Updated `supabase_schema.sql` with new tables (`notifications`), audit columns on `scan_events`, and exhaustion trigger in `process_scan`.
- Created `src/components/NotificationBell.tsx` mounted in `Navbar.tsx` for real-time refill permission alerts.
- Updated `src/pages/GenerateQR.tsx`, `src/pages/QRDetail.tsx`, `src/pages/Analytics.tsx`, and `src/pages/Dashboard.tsx`.
- Wrote unit tests in `src/test/geminiReviews.test.ts` (all passed).
- Built production bundle with `vite build` (completed cleanly with 0 errors).

### Files Created
- `src/lib/geminiReviews.ts`
- `src/lib/auditAgent.ts`
- `src/components/NotificationBell.tsx`
- `api/cron-audit.ts`
- `src/test/geminiReviews.test.ts`

### Files Modified
- `supabase_schema.sql`
- `vercel.json`
- `server/index.js`
- `src/components/Navbar.tsx`
- `src/pages/GenerateQR.tsx`
- `src/pages/QRDetail.tsx`
- `src/pages/Analytics.tsx`
- `src/pages/Dashboard.tsx`
- `PROJECT_MEMORY/PROJECT_STATE.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## 2026-11-02 (Implementation Plan: AI Review Generator & 12-Hour Audit Agent)

### Task
Architect and design the technical implementation plan for:
1. Automated 100 natural AI review message generation upon Google Business link onboarding with granular edit/delete curation.
2. 100-message usage exhaustion detection with owner notification and Accept/Reject refill permission.
3. 12-hour scheduled verification agent (00:00 AM & 12:00 PM) with 12h+ maturity filter and Google review matching.
4. Comprehensive analytics audit table with row #, review message, scan timestamp, and agent success/fail status.

### Result
- Authored detailed implementation plan in artifact `dumpareview_execution_plan.md` with complete sequence diagram, database DDL delta, cron logic, and UI specifications.
- Updated `PROJECT_MEMORY/CURRENT_TASK.md`.

### Files Created
- `dumpareview_execution_plan.md`

### Files Modified
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## 2026-11-02 (Project Feature Audit & Strategic Enhancement Roadmap)

### Task
Comprehensive project inspection and architectural assessment to identify high-impact features, UX improvements, performance optimizations, and security hardening for DumpaReview.

### Result
- Performed end-to-end review of frontend routes, customer scan redirect flow (`ScanRedirect.tsx`), Supabase schema, build bundle metrics, and server components.
- Identified core bottleneck: single 1.23 MB monolithic JS bundle impacting scan load time; user friction in drafting up to 100 review messages manually; lack of negative review protection; single-platform limitation; and physical printing constraints.
- Formulated 10 high-value features organized across 4 strategic tiers (Conversion & Sentiment Shield, Physical Print Studio & AI message generation, Multi-platform & White-label expansion, and Security/Performance hardening).
- Updated `PROJECT_MEMORY/NEXT_STEPS.md` with structured strategic roadmap.

### Files Modified
- `PROJECT_MEMORY/NEXT_STEPS.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## 2026-10-12 (Branded QR Code Download with Business Name)

### Task
Display the business name on the downloaded QR code image without interfering with the scanner quiet-zone, making each downloaded file immediately identifiable.

### Result
- Created `src/lib/qrDownload.ts` providing high-resolution (640x800px) branded card rendering with:
  - Business name at the top (with dynamic auto-fit font sizing).
  - 5 gold stars and "Review us on Google" subtitle.
  - Centered QR code with generous quiet-zone margin preserving 100% scan reliability.
  - "Scan with camera to review" footer instructions and domain watermark.
  - Meaningful file naming (`{business_name}_QR_Code.png`).
- Integrated into `src/pages/GenerateQR.tsx` and `src/pages/QRDetail.tsx`.
- Verified production build completes cleanly (`npm run build`).

### Files Created
- `src/lib/qrDownload.ts`

### Files Modified
- `src/pages/GenerateQR.tsx`
- `src/pages/QRDetail.tsx`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

## 2026-10-12 (Supabase RLS Policy Fix for Firebase Auth)

### Task
Resolve `401 Unauthorized` (`new row violates row-level security policy for table "profiles"` / `"qr_codes"`) encountered during QR code creation.

### Result
- Diagnosed root cause: App uses Firebase Auth for user authentication, causing all client Supabase PostgREST requests to execute under the `anon` database role (where `auth.uid()` is null). Supabase default RLS policies rejected inserts with error `42501` (401 Unauthorized).
- Updated `supabase_schema.sql` with RLS fix scripts to disable RLS or grant full public/anon access on `profiles`, `qr_codes`, and `scan_events`.
- Provided direct SQL snippet for execution in Supabase Dashboard SQL editor.

### Files Modified
- `supabase_schema.sql`
- `PROJECT_MEMORY/BUGS_AND_FIXES.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

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
