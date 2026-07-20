import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle, Copy, AlertCircle, QrCode, ExternalLink, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanState = "loading" | "ready" | "copied" | "review_opened" | "done" | "error" | "no_messages" | "redirecting";

export default function ScanRedirect() {
  const { id } = useParams<{ id: string }>();
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [message, setMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [reviewLink, setReviewLink] = useState("");
  const [error, setError] = useState("");
  const processed = useRef(false);
  const adsInitialized = useRef(false);

  useEffect(() => {
    if (!id || processed.current) return;
    processed.current = true;
    handleScan();
  }, [id]);

  // Initialize AdSense only once
  useEffect(() => {
    if (adsInitialized.current) return;
    
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        adsbygoogle.push({});
        adsInitialized.current = true;
      }
    } catch (e) {
      console.error("AdSense initialization failed", e);
    }
  }, [scanState]); // Keep scanState as trigger but ref prevents multiple calls

  const handleScan = async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc("process_scan", {
        qr_id: id!,
      });

      if (rpcError) throw rpcError;

      const result = data as { message?: string; message_index?: number; google_review_link?: string; error?: string };

      if (result.error === "QR code not found") {
        setScanState("error");
        setError("QR code not found or has been deleted.");
        return;
      }
      if (result.error === "No messages configured") {
        setScanState("no_messages");
        return;
      }

      setMessage(result.message!);
      setMessageIndex(result.message_index!);
      setReviewLink(result.google_review_link!);
      setScanState("ready");
    } catch {
      setScanState("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleAction = async () => {
    setScanState("redirecting");
    try {
      // 1. Copy to clipboard (Must be in click handler)
      await navigator.clipboard.writeText(message);
      
      // 2. Log the event (Await this to ensure it records before redirect)
      await supabase.rpc("confirm_scan", {
        qr_id: id!,
        p_message_used: message,
        p_message_index: messageIndex,
      });

      // 3. Redirect to review page
      window.location.href = reviewLink;
    } catch (err) {
      // Fallback if anything fails, still try to redirect
      window.location.href = reviewLink;
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-start p-4 sm:p-6 overflow-x-hidden safe-area-padding">
      
      {/* Top Ad Space */}
      <div className="w-full max-w-sm mb-6 bg-white/10 rounded-xl overflow-hidden min-h-[100px] flex items-center justify-center border border-white/10">
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-6222108934557142"
             data-ad-slot="AUTO"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <span className="text-[10px] text-white/40 absolute">Advertisement</span>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        {/* Decorative elements for app-like feel */}
        <div className="absolute top-0 left-0 w-full h-1.5 hero-gradient opacity-80" />
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 hero-gradient rounded-xl flex items-center justify-center shadow-lg">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gradient">QReview Pro</span>
        </div>

        {scanState === "loading" && (
          <div className="py-12">
            <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-primary/20 border-t-primary mx-auto mb-6" />
            <p className="text-muted-foreground font-semibold text-lg animate-pulse">Initializing...</p>
          </div>
        )}

        {scanState === "ready" && (
          <div className="py-2 space-y-7">
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Your Review</h2>
              <p className="text-base text-muted-foreground leading-snug px-2">
                We've crafted a personalized message for you. Tap below to share your experience.
              </p>
            </div>

            <div className="bg-secondary/40 rounded-3xl p-6 text-left border border-border/40 relative overflow-hidden group active:scale-[0.99] transition-transform">
              <div className="absolute top-0 left-0 w-1.5 h-full hero-gradient" />
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-black text-primary/70 uppercase tracking-[0.2em]">Suggested Feedback</span>
              </div>
              <p className="text-base text-foreground leading-relaxed font-medium italic">"{message}"</p>
            </div>

            <Button
              onClick={handleAction}
              className="w-full h-16 text-xl font-bold hero-gradient text-white border-0 shadow-xl hover:scale-[1.03] active:scale-95 transition-all rounded-[1.25rem]"
            >
              <Copy className="h-6 w-6 mr-3" />
              Copy & Continue
            </Button>
            
            <p className="text-[11px] text-muted-foreground/80 px-6 leading-relaxed">
              Message will be copied automatically. You will be redirected to the official Google Review page.
            </p>
          </div>
        )}

        {scanState === "redirecting" && (
          <div className="py-12">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-green-50 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-3">Redirecting...</h2>
            <p className="text-base text-muted-foreground">Opening Google Review portal.</p>
          </div>
        )}

        {scanState === "error" && (
          <div className="py-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-50">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-3">Oops!</h2>
            <p className="text-base text-muted-foreground px-4">{error}</p>
            <Button 
              variant="outline" 
              className="mt-8 w-full h-12 rounded-xl font-bold"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-border/40">
          <p className="text-[11px] font-bold text-muted-foreground/60 flex items-center justify-center gap-1.5 uppercase tracking-widest">
            Verified by <span className="text-primary/80 font-black">QReview Pro</span>
          </p>
        </div>
      </div>

      {/* Bottom Ad Space */}
      <div className="w-full max-w-sm mt-8 bg-white/10 rounded-xl overflow-hidden min-h-[100px] flex items-center justify-center border border-white/10">
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-6222108934557142"
             data-ad-slot="AUTO"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <span className="text-[10px] text-white/40 absolute">Advertisement</span>
      </div>
    </div>
  );
}
