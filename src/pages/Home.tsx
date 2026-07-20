import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { QrCode, Star, ArrowRight, CheckCircle, Zap, Shield, BarChart3 } from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: QrCode,
    title: "Smart QR Generation",
    desc: "Create branded QR codes linked to your Google Review page in seconds.",
  },
  {
    icon: Zap,
    title: "Auto-Copy Messages",
    desc: "Each scan automatically copies a unique review message — no repetition until all are used.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    desc: "Monitor successful scans and review completions from your dashboard.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Your data is protected and your QR codes never expire.",
  },
];

const steps = [
  { step: "01", title: "Create Your QR", desc: "Add your Google Review link and up to 100 pre-written messages." },
  { step: "02", title: "Display the QR", desc: "Print or display your QR at checkout, tables, or receipts." },
  { step: "03", title: "Customer Scans", desc: "A unique message is copied to their clipboard automatically." },
  { step: "04", title: "Get the Review", desc: "They paste and submit — it's that simple!" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(175_60%_50%_/_0.2),_transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 text-white/90 text-sm mb-8 font-medium">
              <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              Boost your Google reviews effortlessly
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Turn Every Customer Into a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">
                5-Star Review
              </span>
            </h1>
            <p className="text-lg text-white/75 mb-10 max-w-2xl mx-auto leading-relaxed">
              Generate smart QR codes that auto-copy a unique review message for every customer — making it ridiculously easy to collect authentic Google reviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl text-base px-8 h-12"
                asChild
              >
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-medium text-base px-8 h-12 bg-transparent"
                asChild
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Floating QR mockup */}
          <div className="mt-16 flex justify-center">
            <div className="animate-float bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 hero-gradient rounded-lg flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Cafe Bella Review QR</p>
                  <p className="text-xs text-muted-foreground">12 messages · 47 scans</p>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center border border-primary/10">
                <QrCode className="h-24 w-24 text-primary/60" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                47 successful reviews collected
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Set up once, collect reviews forever. It takes less than 2 minutes to get started.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="stat-card group text-center">
                <div className="text-4xl font-bold text-gradient mb-3 font-display">{step}</div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features designed to maximize your review collection rate.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="stat-card group flex gap-5">
                <div className="flex-shrink-0 h-12 w-12 hero-gradient rounded-xl flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="hero-gradient rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Grow Your Reviews?
            </h2>
            <p className="text-white/75 text-lg mb-8">
              Join businesses already using QReview Pro to build their online reputation.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl text-base px-8 h-12"
              asChild
            >
              <Link to="/auth">
                Start for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">QReview Pro</span>
          </div>
          <p>© {new Date().getFullYear()} QReview Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
