# Architecture

## Overview
DumpaReview is a modern single-page application (SPA) designed to help businesses collect Google Reviews by generating smart dynamic QR codes.

## Frontend Architecture
- **Framework**: React 18 + TypeScript + Vite 5
- **Routing**: `react-router-dom` with routes:
  - `/` — Landing page
  - `/login` — Google sign-in
  - `/dashboard` — QR code management
  - `/generate-qr` — Create new QR codes
  - `/analytics` — Scan statistics and review conversions
  - `/s/:id` — Scan redirect endpoint for customers
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui design system)
- **Offline / PWA**: Progressive Web App with `public/sw.js` and `public/manifest.json`

## Backend & Database Architecture
- **Supabase**: PostgreSQL database storing QR codes, review messages, and scan events.
- **Firebase Auth**: User authentication handling Google sign-in sessions.

## SPA Routing & Deployment
- Cloudflare Pages / Vercel hosting.
- `public/_redirects`: `/* /index.html 200` ensures Cloudflare Pages delegates routing to React Router.
- `vercel.json`: Handles rewrite routing if deployed on Vercel.
- `public/sw.js`: Network-First navigation with cache fallback to prevent stale asset hash lockouts.
