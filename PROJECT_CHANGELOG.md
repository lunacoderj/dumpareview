# Project Changelog - DumpaReview

## [2026-11-05] - Resilient Schema Fallbacks, Service Worker Navigation Crash Fix, & PostgREST 400 Resolution

### Root Cause Analysis
1. **Service Worker Navigation Crash**: `public/sw.js` threw `Uncaught (in promise) TypeError: Failed to fetch` on `/qr/:id` routes because unhandled promise rejections in fetch events caused the browser to reject SPA route loads.
2. **PostgREST 400 Bad Request on Notifications**: `NotificationBell.tsx` queried `notifications?select=*,qr_codes(name,business_category)` which failed with error `PGRST200` due to a lack of foreign key constraint on the existing table in Supabase.
3. **AI 100 Messages & QR Generation Failures**: The live Supabase database had not yet had the schema migrations applied, so inserting or updating `business_category`, `status`, `auto_refill_prompted`, and `last_generated_at` threw Postgres column errors.
4. **Audit Agent & Analytics Failures**: Missing `verification_status` and `marked_for_audit` columns in `scan_events` caused queries to return errors and fail silently.

### Changes Made & Updates
- **Service Worker Hardening (`public/sw.js`)**:
  - Broadened SPA route detection: matches `navigate` mode, `accept: text/html`, root URLs, and all paths without file extensions.
  - Wrapped all network fetch operations with `.catch()` fallback to `/index.html` or a graceful HTTP 408 response, preventing unhandled promise rejections.
  - Bumped cache version to `dumpareview-v3` to ensure immediate client cache refresh.
- **Graceful Supabase Schema Fallbacks**:
  - In `src/components/NotificationBell.tsx`: decoupled the query to `select("*")` without foreign key join, resolving PostgREST 400 errors; added client-side in-memory mapping to `qr_codes`; handled both `read` and `is_read` column formats.
  - In `src/pages/GenerateQR.tsx`: added automated fallback to core columns (`user_id`, `name`, `google_review_link`, `messages`, `message_used_counts`, `current_message_index`, `successful_scans`) so creating a QR code succeeds even if new columns are missing in DB.
  - In `src/pages/QRDetail.tsx`: added automated fallback to core columns (`messages`, `message_used_counts`, `current_message_index`, `updated_at`) on 100 review generation, ensuring reviews are saved successfully.
  - In `src/pages/Analytics.tsx`: added fallback query for `scan_events` so scan history is never blank.
  - In `src/lib/auditAgent.ts`: added fallback query for pending scans.
- **Database Schema Script Upgrade (`supabase_schema.sql`)**:
  - Added explicit `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS ...` statements for `qr_code_id`, `type`, `action_type`, `action_status`, and `is_read` to handle existing tables gracefully.
- **Testing & Verification**:
  - Vitest: 3 test suites, 7 tests all passed (100% pass rate).
  - ESLint: 0 errors across codebase.
  - Vite: Production build compiled cleanly into `dist/`.

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

## [2026-11-02] - Implementation & Verification: 'Mark for Review' On-Demand Audit, Deduplication & Re-Review

### Changes Made & Updates
- **Fast-Track Audit & Maturation Bypass**:
  - Implemented business-level "Mark for Review" button in `Dashboard.tsx` and `QRDetail.tsx` allowing business owners to queue scans for agent audit before the 24-hour maturation deadline (even 1 minute after scanning).
- **Strict Deduplication Engine**:
  - Configured agent to strictly skip and exclude review messages already marked `verified_success`, avoiding duplicate scraping or reprocessing.
- **Granular Row-Level Actions in Analytics**:
  - Added "Mark for Re-Review 🔄" for failed reviews (`verified_fail` -> `pending`, `marked_for_audit = true`).
  - Added "Fast-Track Audit ⚡" for pending recent reviews (< 24h old) to bypass the 24h maturation lock immediately.
  - Added "Verified (Skipped)" badge for successful reviews.
  - Added business filter dropdown for isolated review audits.
- **Database Schema Upgrades**:
  - Added `marked_for_audit BOOLEAN DEFAULT false`, `audit_requested_at TIMESTAMP`, and `audit_count INTEGER DEFAULT 0` to `scan_events` in `supabase_schema.sql`.
  - Added `last_audit_requested_at TIMESTAMP` to `qr_codes`.
  - Added composite index `idx_scan_events_audit_ready` on `(verification_status, marked_for_audit, scanned_at)`.
- **Backend & Cron Engine Alignment**:
  - Updated `src/lib/auditAgent.ts`, `api/cron-audit.ts` (Vercel daily cron), and `server/index.js` (Express cron & manual endpoint) to enforce dual-condition eligibility: `(verification_status = 'pending') AND (marked_for_audit = true OR scanned_at <= now() - 24 hours)`.
- **Quality Assurance & Verification**:
  - Unit tests created in `src/test/auditAgent.test.ts` (7/7 tests passed across all 3 test suites).
  - ESLint errors in `api/cron-audit.ts`, `SeoHead.tsx`, `auditAgent.ts`, and `geminiReviews.ts` fixed; ESLint passed with 0 errors.
  - Production build compiled with `vite build` cleanly into `dist/` with 0 errors.

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
- `scratch/update_server.cjs`

## [2026-11-02] - Planning: 'Mark for Review' On-Demand Audit & Row-Level Re-Review System

### Changes Made & Updates
- **On-Demand Audit Trigger & 24h Bypass Architecture**:
  - Detailed design for business-level "Mark for Review" button allowing business owners to fast-track scans for agent audit before the 24-hour maturation deadline (even 1 minute after scanning).
  - Built-in deduplication engine: strictly excludes reviews that have already been audited and marked `verified_success`, avoiding redundant scraping and saving API costs.
  - Granular table actions: provides row-level "Fast-Track Review ⚡" for recent unverified scans and "Mark for Re-Review 🔄" for failed reviews to request an agent re-audit.
- **Project Records Updated**:
  - Created implementation plan artifact `dumpareview_mark_for_review_plan.md`.
  - Updated `PROJECT_MEMORY/CURRENT_TASK.md` and `PROJECT_MEMORY/CHANGELOG.md`.

### Files Created
- `dumpareview_mark_for_review_plan.md` (Artifact)

### Files Modified
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## [2026-11-02] - AI 100-Review Generator, Curation Engine, & 24-Hour Verification Agent Implementation

### Changes Made & Updates
- **AI 100 Natural Review Generator**:
  - Created `src/lib/geminiReviews.ts` providing automated generation of 100 authentic 5-star Google reviews tailored to business name, category, and keywords via Gemini API with procedural natural language engine fallback.
  - Integrated into `src/pages/GenerateQR.tsx` with category selection (Restaurants, Salons, Dental, Auto, Retail, General) and one-click generation.
- **Granular Message Curation**:
  - Implemented inline message editing, individual message deletion, custom message addition, and manual 100-review regeneration in `src/pages/QRDetail.tsx`.
- **100-Message Exhaustion & Refill Permission Lifecycle**:
  - Updated `supabase_schema.sql` `process_scan` RPC to detect when all 100 messages have cycled.
  - Created `src/components/NotificationBell.tsx` mounted in `src/components/Navbar.tsx` and exhaustion banners in `src/pages/QRDetail.tsx` and `src/pages/Dashboard.tsx` offering instant Accept (generate 100 fresh reviews) or Reject actions.
- **24-Hour Scheduled Review Verification Agent (Vercel Free Tier Compatible)**:
  - Adapted schedule to Vercel Hobby tier (1 cron job per day at `0 0 * * *` 00:00 UTC) via `vercel.json` and serverless function `api/cron-audit.ts`.
  - Implemented strict 24-hour maturation rule in `src/lib/auditAgent.ts` and `server/index.js`: only scans >= 24 hours old are evaluated; scans under 24 hours are deferred to the next cycle.
  - Compares scan messages against Google review text with text normalization and similarity matching, marking scan events as `verified_success` or `verified_fail`.
- **Comprehensive 24h Audit Analytics Table**:
  - Added audit table in `src/pages/Analytics.tsx` with columns: `#`, `Review Message Text`, `Scan Timestamp`, `Maturation Age`, and `24-Hour Agent Audit Result` (Successful / Fail / Awaiting 24h Window).
  - Added on-demand "Run 24h Audit Now" button for instant testing.
- **Testing & Build Verification**:
  - Added unit test suite `src/test/geminiReviews.test.ts` (all tests passing).
  - Production build verified with `npm run build` (completed cleanly with 0 errors).

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

## [2026-11-02] - Implementation Plan: AI Review Generator & 12-Hour Audit Agent

### Changes Made & Updates
- **Technical Architectural Blueprint**:
  - Detailed design for automated 100 natural AI review message generation using Gemini API upon business link addition.
  - Granular message curation UI (inline edit, individual delete, custom add, manual regeneration).
  - 100-message usage exhaustion trigger and interactive notification lifecycle (Accept / Reject permission prompt).
  - 12-hour scheduled verification agent (00:00 AM and 12:00 PM cron cycles) enforcing 12h+ maturity filter (e.g. 1:00 AM scan held until midnight).
  - Scraper matching engine comparing scanned messages with live Google Maps reviews.
  - Analytics audit table with row #, review message text, scan timestamp, and agent success/fail status badge.
- **Project Memory & Plan Artifact**:
  - Authored full implementation plan artifact `dumpareview_execution_plan.md`.
  - Updated `PROJECT_MEMORY/CURRENT_TASK.md` and `PROJECT_MEMORY/CHANGELOG.md`.

### Files Created
- `dumpareview_execution_plan.md` (Artifact)

### Files Modified
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## [2026-11-02] - Comprehensive Project Audit & Strategic Enhancement Roadmap

### Changes Made & Updates
- **Full Architecture & UX Audit**:
  - Inspected frontend SPA routes, Supabase PostgREST queries and RPC functions, client-side bundle performance (1.23 MB monolithic chunk), and scan redirect flow (`ScanRedirect.tsx`).
  - Evaluated real-world business adoption hurdles: writing up to 100 messages manually, lack of protection against negative 1-star reviews on Google, single-platform limitation, and missing physical print collateral formats.
- **Strategic Enhancement Roadmap**:
  - Mapped 10 high-impact features categorized into:
    1. Sentiment Shield / Review Gating (intercepts 1-3 star reviews into private owner feedback while directing 4-5 stars to Google).
    2. AI Review Message Generator & Pre-built Industry Template Library (Gemini API integration).
    3. Route-Level Lazy Loading / Code-Splitting (<90 KB scan page load).
    4. Table Tent & Printable Collateral Studio (A4/A5 PDF foldouts, logo watermarking, acrylic counter stands).
    5. Customer Multi-Choice / Shuffle Message Picker.
    6. Google Place ID & Review Link Auto-Finder.
    7. Multi-Platform Review Support (Google, TripAdvisor, Yelp, Facebook, Trustpilot).
    8. White-Label & Ad-Free Pro Tier.
    9. Database Security Hardening (Supabase RLS & API protection).
    10. Scan Rate Limiting & Bot Filtering.
  - Updated `PROJECT_MEMORY/NEXT_STEPS.md` and `PROJECT_MEMORY/CHANGELOG.md`.

### Files Modified
- `PROJECT_MEMORY/NEXT_STEPS.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`

## [2026-10-15] - Technical SEO & Google Search Console Alignment Overhaul

### Changes Made & Updates
- **Domain Canonicalization & Alignment**:
  - Aligned custom production domain across all metadata to approved live URL `https://www.dumpareview.online` (resolving non-www vs www canonical variance).
  - Updated `index.html` canonical tag, OpenGraph url/image tags, Twitter image tag, and WebApplication JSON-LD schema URL.
  - Created `src/siteSeo.ts` to provide centralized constants and canonical URL builder.
- **SPA Canonical Flip & Soft-404 Crawl Resolution**:
  - Created dynamic `src/components/SeoHead.tsx` component that synchronizes `<title>`, `<meta name="description">`, `<meta name="robots">`, `<meta property="og:url">`, and `<link rel="canonical">` to the active route.
  - Mounted `<SeoHead />` inside `AppLayout` in `src/App.tsx` ensuring subpages (`/terms`, `/privacy`, `/cookies`, `/auth`) self-canonicalize correctly rather than defaulting back to the homepage canonical.
  - Updated `src/pages/NotFound.tsx` with `<SeoHead title="404 - Page Not Found | DumpaReview" noIndex={true} />` ensuring all soft-404 crawler encounters are explicitly marked with `noindex, nofollow`.
- **Sitemap & Robots Update**:
  - Updated `public/robots.txt` specifying allowed crawling, protected paths, and accurate sitemap URL.
  - Updated `public/sitemap.xml` with canonical URLs under `https://www.dumpareview.online` with updated `lastmod` timestamps.

### Files Created
- `src/siteSeo.ts`
- `src/components/SeoHead.tsx`
- `PROJECT_CHANGELOG.md`

### Files Modified
- `index.html`
- `src/App.tsx`
- `src/pages/NotFound.tsx`
- `public/robots.txt`
- `public/sitemap.xml`
