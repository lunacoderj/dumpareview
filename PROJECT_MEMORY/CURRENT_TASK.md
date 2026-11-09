## Current Objective
Diagnose and resolve why live Google Maps reviews were showing as "Not Found" in the Audit table even though the review existed on Google Maps.

## Root Cause
The audit agent in both the client (`auditAgent.ts`), cron (`api/cron-audit.ts`), and server (`server/index.js`) was previously reading from the `apify_scraped_reviews` Supabase table. However, no background process or endpoint was ever executing Apify for `qr_codes.google_review_link`. The table was completely empty (0 rows), causing all scans to be compared against an empty array and marked `verified_fail` ("Not Found").

## Solution & Current Status
Completed & Verified:
1. Live Scrape Verification: Connected Apify actor `compass/google-maps-reviews-scraper` to scrape live reviews from `H M Ambulance Services in Guntur`. Detected 10 matching scans (including Dayananda Sagar, Reshma Pantala, Santhosh Vana, etc.) with 100% similarity and updated them to `verified_success`.
2. Backend Scraper & Endpoint: Implemented `auditScansForQRCode`, `run24HourReviewAudit`, and `POST /api/audit/trigger` in `server/index.js` to automatically resolve Google short links and scrape live reviews using Apify.
3. Frontend Integration: Updated `src/lib/auditAgent.ts`, `QRDetail.tsx`, and `Analytics.tsx` so clicking "Re-Review 🔄" or "Run Audit" triggers the backend Apify scraper and updates the UI.
4. Testing: 8/8 Vitest tests passed, 0 ESLint errors, clean Vite production build.

## Files Modified
- `server/index.js` (Apify live scraper integration, URL resolver, POST /api/audit/trigger endpoint)
- `src/lib/auditAgent.ts` (Backend audit trigger, enhanced similarity calculation with emoji handling, lower threshold)
- `src/pages/QRDetail.tsx` (Auto-refresh on Re-Review, live scraping toast feedback)
- `src/pages/Analytics.tsx` (Auto-refresh on Re-Review and Fast-Track, live scraping toast feedback)
- `api/cron-audit.ts` (Forward cron trigger to Render backend scraper)
- `src/test/auditAgent.test.ts` (Unit test for real-world review with leading emoji)
- `PROJECT_MEMORY/CURRENT_TASK.md`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_CHANGELOG.md`
