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

## Known Limitations
- Firebase Authorized Domain registration must include `dumpareview.online` in Firebase Console or Google Cloud Identity Platform.

## Known Bugs
- Fixed: Disguised JPEG image files in `pwa-192.png` and `pwa-512.png` failing manifest icon download/validation.
- Fixed: Cache-First lock in `sw.js` serving outdated `index.html` referencing non-existent CSS/JS hashes.
- Fixed: Missing `_redirects` file in `public/` directory for Cloudflare Pages SPA client-side routing.
- Fixed: 4 ESLint blocking errors in `command.tsx`, `textarea.tsx`, `ScanRedirect.tsx`, and `tailwind.config.ts`.
- Fixed: Legacy `QReview Pro` naming replaced with `DumpaReview` across all components and styles.
