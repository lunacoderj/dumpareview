import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
            <Lock className="h-3.5 w-3.5" />
            Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Effective Date: October 12, 2026 • Official domain:{" "}
            <span className="font-semibold text-foreground">dumpareview.online</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">01.</span> Introduction
            </h2>
            <p>
              At <strong className="text-foreground">DumpaReview</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;),
              accessible via <a href="https://dumpareview.online" className="text-primary underline">https://dumpareview.online</a>,
              we take the privacy of our business clients and their customers very seriously.
              This Privacy Policy explains what information we collect, how it is stored and processed, and your rights regarding that information.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">02.</span> Information We Collect
            </h2>
            <p>We collect information in the following categories:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  Account & Profile Information
                </div>
                <p>
                  When you sign in using Google OAuth via Firebase, we receive your name, email address, avatar photo URL, and unique Google user ID.
                  We do not receive or store your Google password.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Database className="h-4 w-4 text-primary" />
                  Business & QR Code Data
                </div>
                <p>
                  Business names, target Google review URLs, customized review message suggestions, and associated configuration options you save in your dashboard.
                </p>
              </div>
            </div>

            <p>
              <strong className="text-foreground">QR Scan Interaction Data:</strong> When an end user scans one of your generated QR codes,
              we process anonymized request telemetry (timestamp, user-agent string, approximate country/region, and referral header) to increment the scan counter
              and copy the rotated message. We do not track or store the identity or personal contact information of individual customers who scan the codes.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">03.</span> How We Use Your Information
            </h2>
            <p>We use the collected information for specific, lawful purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide, operate, and maintain the DumpaReview web application and QR routing services.</li>
              <li>To securely authenticate registered accounts and prevent unauthorized dashboard access.</li>
              <li>To calculate and present aggregated performance analytics (scan volume, completed reviews).</li>
              <li>To detect and prevent technical errors, fraudulent scans, or security threats.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">04.</span> Third-Party Service Providers
            </h2>
            <p>We partner with trusted enterprise service providers to power DumpaReview:</p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border flex items-start justify-between gap-3">
                <div>
                  <strong className="text-foreground">Supabase (PostgreSQL)</strong>
                  <p className="text-muted-foreground">Stores encrypted database records, QR metadata, and scan counter state.</p>
                </div>
                <span className="text-emerald-500 font-medium">Database</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border flex items-start justify-between gap-3">
                <div>
                  <strong className="text-foreground">Google Firebase Authentication</strong>
                  <p className="text-muted-foreground">Handles OAuth 2.0 authentication tokens securely without exposing credentials.</p>
                </div>
                <span className="text-emerald-500 font-medium">Auth</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border flex items-start justify-between gap-3">
                <div>
                  <strong className="text-foreground">Google AdSense</strong>
                  <p className="text-muted-foreground">Serves advertising units on public review redirect pages to support free tiers.</p>
                </div>
                <span className="text-emerald-500 font-medium">Advertising</span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">05.</span> Advertising & Google AdSense Disclosures
            </h2>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to DumpaReview or other websites.
              Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visits to our site and/or other sites on the Internet.
            </p>
            <p>
              Users may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline"
              >
                Google Ads Settings
              </a>{" "}
              or by visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline"
              >
                www.aboutads.info
              </a>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">06.</span> Your Data Protection Rights (GDPR & CCPA)
            </h2>
            <p>Under regulations like GDPR and CCPA, you have specific rights concerning your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Request correction of inaccurate information.</li>
              <li><strong className="text-foreground">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your account and associated QR codes.</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> Request export of your QR data.</li>
            </ul>
            <p>
              To exercise any of these rights, contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@dumpareview.online" className="text-primary underline font-medium">privacy@dumpareview.online</a>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Contact Our Privacy Team
            </h2>
            <p>If you have any questions or concerns regarding this Privacy Policy, please get in touch with us:</p>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-foreground font-medium">DumpaReview Privacy & Compliance</p>
              <p>Email: <a href="mailto:privacy@dumpareview.online" className="text-primary underline">privacy@dumpareview.online</a></p>
              <p>Website: <a href="https://dumpareview.online" className="text-primary underline">https://dumpareview.online</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
