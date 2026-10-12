import { Link } from "react-router-dom";
import { Shield, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
            <FileText className="h-3.5 w-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display mb-3">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-sm">
            Last updated: October 12, 2026 • Official domain:{" "}
            <span className="font-semibold text-foreground">dumpareview.online</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">01.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing or using <strong className="text-foreground">DumpaReview</strong> (accessible at{" "}
              <a href="https://dumpareview.online" className="text-primary underline">https://dumpareview.online</a>),
              you agree to be bound by these Terms and Conditions (&quot;Terms&quot;), our Privacy Policy, and our Cookie Policy.
              If you do not agree to all of these Terms, you may not access or use any part of the service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">02.</span> Description of the Service
            </h2>
            <p>
              DumpaReview provides cloud-based tools that allow business owners and operators to create dynamic QR codes linked
              to their public Google Review submission pages. The platform features rotating suggested review templates designed
              to assist legitimate customers in composing feedback. DumpaReview also provides scan tracking metrics and performance analytics.
            </p>
            <div className="rounded-xl bg-card border border-border p-4 my-3 text-xs space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Service Highlights:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dynamic QR generation linking to verified Google Business review destinations.</li>
                <li>Rotating review prompt templates to reduce friction for happy patrons.</li>
                <li>Real-time scan counter and device telemetry analytics.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">03.</span> Compliance with Google Review Guidelines
            </h2>
            <p>
              As a user of DumpaReview, you acknowledge and agree that your use of our platform must strictly comply with all applicable
              policies governing online customer reviews, including the <strong className="text-foreground">Google Maps & Business Profile User Contributed Content Policy</strong>.
            </p>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Prohibited Practices:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You may not use DumpaReview to solicit fake, fraudulent, or paid reviews.</li>
                <li>You may not gate reviews (e.g., selectively filtering negative reviews while only directing positive reviewers to Google).</li>
                <li>You may not offer financial incentives, discounts, or gifts in exchange for 5-star reviews.</li>
              </ul>
            </div>
            <p>
              DumpaReview is an independent software tool designed to simplify URL access and is <strong className="text-foreground">not affiliated with, endorsed by, or sponsored by Google LLC</strong>.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">04.</span> User Accounts & Authentication
            </h2>
            <p>
              To access creator features (e.g., dashboard, QR generation, analytics), you must authenticate through Google Sign-In
              powered by Firebase Auth. You are solely responsible for maintaining the confidentiality of your credentials and for all
              activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">05.</span> Intellectual Property Rights
            </h2>
            <p>
              The DumpaReview platform, including its user interface, algorithms, graphic assets, stylesheets, source code, and branding,
              is the exclusive property of DumpaReview and is protected by copyright and intellectual property laws. You are granted
              a limited, non-exclusive license to use the generated QR codes for your lawful business promotional activities.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">06.</span> Disclaimers & Limitation of Liability
            </h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              DumpaReview does not warrant that the service will be uninterrupted, error-free, or free of harmful components.
            </p>
            <p>
              IN NO EVENT SHALL DUMPAREVIEW, ITS FOUNDERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES,
              INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS REPUTATION, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">07.</span> Third-Party Links & Advertising
            </h2>
            <p>
              Our public redirect and scan pages may display third-party advertisements via Google AdSense to support the platform.
              We do not control the content of third-party advertisements or websites linked through the service.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-base">08.</span> Modifications & Governing Law
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated revision date.
              Your continued use of DumpaReview after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Contact Information
            </h2>
            <p>
              If you have any questions or inquiries regarding these Terms and Conditions, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-foreground font-medium">DumpaReview Legal Department</p>
              <p>Email: <a href="mailto:support@dumpareview.online" className="text-primary underline">support@dumpareview.online</a></p>
              <p>Website: <a href="https://dumpareview.online" className="text-primary underline">https://dumpareview.online</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
