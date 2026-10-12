## Current Objective
Provide guidance on Vercel environment variable settings (Config vs Secret) and Render backend deployment requirements, commit Firebase project migration and automatic account data sync logic.

## Current Status
Completed - Frontend builds cleanly (`npm run build`). Account data synchronization logic implemented to preserve all QR codes and scan history across Firebase accounts. Clear instructions prepared for Vercel and Render configurations.

## Files Being Worked On
- `.env`
- `src/lib/accountSync.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/Analytics.tsx`
- `server/.env`
- `PROJECT_MEMORY/CHANGELOG.md`
- `PROJECT_MEMORY/CURRENT_TASK.md`

## Implementation Progress
- [x] Update local `.env` with new Firebase project `dumpareviews`
- [x] Create `src/lib/accountSync.ts` with automated email-based QR code migration across Firebase accounts
- [x] Integrate `syncUserAccount` into `Dashboard.tsx` and `Analytics.tsx`
- [x] Fix import paths and verify `npm run build` passes with 0 errors
- [x] Update `server/.env` for `dumpareviews` and `https://dumpareview.online`
- [x] Document Vercel "Config vs Secret" distinction for `VITE_` variables
- [x] Document Render backend environment variable requirements (`FRONTEND_URL`, `FIREBASE_PROJECT_ID`)
