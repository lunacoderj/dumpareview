import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Target, UploadCloud, Banknote, Mail } from "lucide-react";
import WallOfFameSection from "@/components/WallOfFameSection";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 flex-1 flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20 -z-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/30 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-foreground mb-6">
            Get Paid for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Honest Reviews</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Join our platform to participate in targeted campaigns. Dump a review, upload your proof, and receive payouts directly to your account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-primary/25 shadow-xl hover:scale-105 transition-transform" asChild>
                <Link to="/tasks">Go to Dashboard <ChevronRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-primary/25 shadow-xl hover:scale-105 transition-transform" asChild>
                  <Link to="/auth">Start Earning Now <ChevronRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full hover:bg-secondary/50" asChild>
                  <a href="#how-it-works">Learn More</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works Pin-to-Pin</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Follow these simple steps to start earning. We guarantee transparency and fast payouts.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Pick a Campaign</h3>
                <p className="text-muted-foreground">Browse active campaigns and lock a task. You have 20 minutes to complete it before it's released back.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Submit Proof</h3>
                <p className="text-muted-foreground">Complete the review as instructed and upload a clear screenshot as proof of your work.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                  <Banknote className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Get Paid</h3>
                <p className="text-muted-foreground">Once our admins audit and approve your submission, the payout is transferred directly to your PhonePe account.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Wall of Fame Section */}
      <WallOfFameSection />

      {/* Footer / Contact */}
      <footer className="mt-auto bg-card border-t border-border/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Have Questions? Build Trust.</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            We believe in 100% transparency. If you have any doubts regarding payments, campaigns, or how the platform works, feel free to reach out.
          </p>
          <a 
            href="mailto:contact@dumpareview.com" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            contact@dumpareview.com
          </a>
          
          <div className="mt-16 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DumpAReview. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
