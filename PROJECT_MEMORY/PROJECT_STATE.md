# Project State

## Project Name
DumpaReview (formerly QReview)

## Description
A web application to generate smart QR codes rotating through pre-written review messages to collect 5-star Google Reviews for businesses.

## Tech Stack
- Frontend: React 18, Vite 5, TypeScript
- UI & Styling: Tailwind CSS, Radix UI (shadcn/ui), Lucide React
- Routing: React Router DOM v6
- State Management: TanStack React Query v5
- Authentication: Firebase Auth (Google Sign-In)
- Database: Supabase (PostgreSQL with RPC functions)
- Hosting / Deployment: Cloudflare Pages / Vercel (target custom domain `dumpareview.online`)

## Current Development Phase
Domain migration to `dumpareview.online`, legal compliance (Terms, Privacy, Cookies), sitemap generation, and SEO enhancement.

## Completed Features
- Dynamic QR code generation with custom business review links
- Google authentication via Firebase
- QR code scan tracking and scan redirect with AdSense integration
- Dashboard for managing QR codes and review messages
- Analytics dashboard with scan counts and performance metrics
- Full legal compliance suite: Terms of Service, Privacy Policy, Cookie Policy, and dynamic Cookie Consent banner
- Search Engine Optimization (SEO): Canonical tags, comprehensive client keywords, JSON-LD schema, Open Graph, Twitter Cards
- Site indexing infrastructure: `sitemap.xml` and `robots.txt`
- **AI 100-Review Generator**: Automatically drafts 100 unique, human-like 5-star Google review messages tailored to business name & category (`src/lib/geminiReviews.ts`).
- **Granular Message Curation**: Inline edit, individual delete, custom message addition, and 100-review regeneration in `QRDetail.tsx`.
- **100-Message Exhaustion Lifecycle**: Detects when all 100 messages have cycled, alerts the owner via `NotificationBell` & in-app banner, and asks permission to generate 100 new reviews (with Accept/Reject handling).
- **24-Hour Review Verification Agent**: Runs daily (00:00 UTC) matching live Google reviews against scan messages. Strictly enforces 24h+ maturation gate (scans under 24h old deferred to next cycle unless explicitly fast-tracked). Fully compliant with Vercel Free tier 1-cron-job limit (`vercel.json`, `api/cron-audit.ts`, `server/index.js`).
- **24-Hour Audit Analytics Table**: Comprehensive log in `Analytics.tsx` with row #, review message text, scan timestamp, maturation age, and agent result badge (Successful / Fail / Awaiting 24h Window) plus manual trigger button.
- **Fast-Track & Re-Review Audit Controls**: Owners can mark a business or specific scan for immediate agent audit before the 24h timer expires (even 1 minute after scanning). Includes deduplication (strictly skipping verified reviews) and row-level "Mark Re-Review" & "Fast-Track Audit" actions in Analytics & QRDetail.

## Known Limitations
- Firebase Authorized Domain registration must include `dumpareview.online` in Firebase Console or Google Cloud Identity Platform.

## Known Bugs
- Fixed: Disguised JPEG image files in `pwa-192.png` and `pwa-512.png` failing manifest icon download/validation.
- Fixed: Cache-First lock in `sw.js` serving outdated `index.html` referencing non-existent CSS/JS hashes.
- Fixed: Missing `_redirects` file in `public/` directory for Cloudflare Pages SPA client-side routing.
- Fixed: 4 ESLint blocking errors in `command.tsx`, `textarea.tsx`, `ScanRedirect.tsx`, and `tailwind.config.ts`.
- Fixed: ESLint errors in `api/cron-audit.ts`, `SeoHead.tsx`, `auditAgent.ts`, and `geminiReviews.ts` resolved; ESLint passed with 0 errors.
- Fixed: Unit tests verified via Vitest with 100% pass rate across 3 test suites.
- Fixed: Legacy `QReview Pro` naming replaced with `DumpaReview` across all components and styles.
