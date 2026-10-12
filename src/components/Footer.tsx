import { Link } from "react-router-dom";
import { QrCode, Mail, ExternalLink, ShieldCheck, HeartHandshake } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm text-card-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl hero-gradient shadow-primary group-hover:scale-105 transition-transform">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gradient font-display">DumpaReview</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The premier smart review acceleration platform. Helping restaurants, salons, clinics, and local businesses turn happy customers into authentic 5-star Google reviews effortlessly.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                SSL Verified & Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                <HeartHandshake className="h-3.5 w-3.5" />
                dumpareview.online
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Solutions</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Home & Features</Link>
              </li>
              <li>
                <Link to="/generate" className="hover:text-primary transition-colors">Smart QR Generator</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">Business Dashboard</Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-primary transition-colors">Scan Analytics</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-primary transition-colors">Sign In / Register</Link>
              </li>
            </ul>
          </div>

          {/* Target Clients */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">For Business</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="hover:text-foreground transition-colors cursor-default">Restaurants & Cafes</span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-default">Salons & Spas</span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-default">Dental & Medical Clinics</span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-default">Auto Repair & Detailers</span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-default">Real Estate & Agencies</span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal & Trust</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
              </li>
              <li>
                <a
                  href="mailto:support@dumpareview.online"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  support@dumpareview.online
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} DumpaReview (dumpareview.online). All rights reserved.</p>
          <p className="text-center sm:text-right text-[11px] max-w-md">
            DumpaReview is an independent service facilitating customer review links. Google and the Google logo are registered trademarks of Google LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
