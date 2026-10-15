# Project Changelog - DumpaReview

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
