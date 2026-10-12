import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("dumpareview_cookie_consent");
    if (!consent) {
      // Small delay to ensure smooth entry
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("dumpareview_cookie_consent", "all");
    setVisible(false);
  };

  const handleEssential = () => {
    localStorage.setItem("dumpareview_cookie_consent", "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg hero-gradient flex items-center justify-center text-white shrink-0">
              <Cookie className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">We value your privacy</h3>
          </div>
          <button
            onClick={handleEssential}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            aria-label="Dismiss cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          DumpaReview uses essential cookies for secure login and platform functionality, and optional advertising cookies (Google AdSense) to keep our tools accessible. You can read our{" "}
          <Link to="/cookies" className="text-primary underline hover:text-primary/80 font-medium">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary underline hover:text-primary/80 font-medium">
            Privacy Policy
          </Link>{" "}
          for full details.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleAccept}
            className="flex-1 hero-gradient text-white border-0 shadow-sm text-xs h-9"
          >
            Accept All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEssential}
            className="flex-1 text-xs h-9"
          >
            Essential Only
          </Button>
        </div>
      </div>
    </div>
  );
}
