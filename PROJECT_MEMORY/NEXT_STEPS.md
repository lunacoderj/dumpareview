# Next Steps

Prioritized list of remaining development and deployment tasks for `dumpareview.online`:

1. **Commit and Push Code Changes**:
   - Push all updated files (legal pages, footer, cookie consent, sitemap, robots, SEO metadata) to `origin/main`.

2. **Add Authorized Domain in Firebase / Google Cloud**:
   - In Firebase Console -> **Authentication** -> **Settings** -> **Authorized domains**:
     - Type naked domain: `dumpareview.online` (no `https://`, no trailing `/`).
     - If receiving "Error adding to authorized domain list", disable adblockers or add directly in Google Cloud Console Identity Platform / OAuth 2.0 Client credentials.

3. **Configure Custom Domain in Cloudflare Pages / Vercel**:
   - Add custom domain `dumpareview.online` and `www.dumpareview.online`.
   - Ensure Build Output Directory is `dist` and build command is `npm run build`.

4. **Update Supabase Auth URL Configuration**:
   - Under Supabase Dashboard -> **Authentication** -> **URL Configuration**:
     - Site URL: `https://dumpareview.online`
     - Redirect URLs: `https://dumpareview.online/**`

5. **Test Live Site & Clear Client Cache**:
   - Verify `https://dumpareview.online/` loads with 200 OK.
   - Verify `/terms`, `/privacy`, `/cookies`, `/sitemap.xml`, and `/robots.txt` are accessible.
