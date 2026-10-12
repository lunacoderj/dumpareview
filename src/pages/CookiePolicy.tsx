import { Link } from "react-router-dom";
import { Cookie, Settings, Shield, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="border-b border-border pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
            <Cookie className="h-3.5 w-3.5" />
            Cookie Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-3">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Last Updated: October 12, 2026 • Official domain:{" "}
            <span className="font-semibold text-foreground">dumpareview.online</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">01.</span> What Are Cookies?
            </h2>
            <p>
              Cookies are small text files that are stored on your device (computer, smartphone, or tablet) when you visit a website.
              They are widely used to make websites work efficiently, provide secure authentication, remember preferences, and provide analytical insights to website owners.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">02.</span> How DumpaReview Uses Cookies
            </h2>
            <p>
              When you use <strong className="text-foreground">DumpaReview (dumpareview.online)</strong>,
              we use cookies and similar browser storage mechanisms (such as <code className="text-xs bg-muted px-1.5 py-0.5 rounded">localStorage</code> and Service Worker cache)
              for three main purposes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3 text-xs">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="font-bold text-foreground block">1. Strictly Necessary</span>
                <p>Required for secure authentication via Google Firebase and core routing. Without these, the dashboard cannot function.</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="font-bold text-foreground block">2. Functional & Offline</span>
                <p>Used to store your cookie consent preferences and cache static resources offline via our Service Worker.</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <span className="font-bold text-foreground block">3. Advertising & AdSense</span>
                <p>Google AdSense uses cookies to serve relevant ads on our public review redirect landing pages.</p>
              </div>
            </div>
          </section>

          {/* Section 3 - Table */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">03.</span> Cookie & Local Storage Inventory
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border font-semibold text-foreground">
                  <tr>
                    <th className="p-3">Name / Key</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">firebase:authUser:*</td>
                    <td className="p-3">Firebase / Google</td>
                    <td className="p-3">Strictly Necessary</td>
                    <td className="p-3">Stores OAuth authentication session tokens securely in IndexedDB/localStorage.</td>
                    <td className="p-3">Session / Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">dumpareview_cookie_consent</td>
                    <td className="p-3">DumpaReview</td>
                    <td className="p-3">Functional</td>
                    <td className="p-3">Remembers your cookie banner decision so you aren&apos;t prompted repeatedly.</td>
                    <td className="p-3">1 Year</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">dumpareview-v2 (Cache)</td>
                    <td className="p-3">DumpaReview SW</td>
                    <td className="p-3">Performance</td>
                    <td className="p-3">Service Worker asset cache ensuring fast page loads and offline resilience.</td>
                    <td className="p-3">Persistent until update</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-foreground">__gads, __gpi, IDE</td>
                    <td className="p-3">Google AdSense</td>
                    <td className="p-3">Advertising</td>
                    <td className="p-3">Used by Google to serve and measure non-intrusive advertisements on scan pages.</td>
                    <td className="p-3">Up to 13 Months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">04.</span> How to Control or Disable Cookies
            </h2>
            <p>
              You have the right to accept, reject, or manage cookies at any time.
              You can adjust your browser settings to decline all or some browser cookies, or to alert you when cookies are being sent.
            </p>
            <div className="rounded-xl bg-card border border-border p-4 text-xs space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-primary" />
                Browser Settings Guidance:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Google Chrome:</strong> Settings → Privacy & Security → Third-party cookies</li>
                <li><strong className="text-foreground">Mozilla Firefox:</strong> Settings → Privacy & Security → Enhanced Tracking Protection</li>
                <li><strong className="text-foreground">Apple Safari:</strong> Settings → Privacy → Block all cookies / Manage Website Data</li>
                <li><strong className="text-foreground">Microsoft Edge:</strong> Settings → Cookies & Site permissions → Manage & delete cookies</li>
              </ul>
              <p className="pt-2 text-muted-foreground">
                <Info className="h-3.5 w-3.5 inline mr-1 text-primary" />
                <em>Note: If you disable essential cookies, certain features of the DumpaReview dashboard may not function properly.</em>
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Questions & Inquiries
            </h2>
            <p>If you have any questions regarding our use of cookies or privacy practices, please contact us:</p>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-foreground font-medium">DumpaReview Compliance Office</p>
              <p>Email: <a href="mailto:support@dumpareview.online" className="text-primary underline">support@dumpareview.online</a></p>
              <p>Website: <a href="https://dumpareview.online" className="text-primary underline">https://dumpareview.online</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
