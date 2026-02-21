import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Copy, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanState = "loading" | "ready" | "done" | "error" | "no_messages";

export default function ScanRedirect() {
  const { id } = useParams<{ id: string }>();
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [message, setMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [reviewLink, setReviewLink] = useState("");
  const [error, setError] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (!id || processed.current) return;
    processed.current = true;
    handleScan();
  }, [id]);

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

      // Try auto-copy
      try {
        await navigator.clipboard.writeText(result.message!);
        // Copy succeeded — confirm scan and redirect
        await confirmAndRedirect(id!, result.message!, result.message_index!, result.google_review_link!);
      } catch {
        // Clipboard failed — show manual copy UI
        setScanState("ready");
      }
    } catch {
      setScanState("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const confirmAndRedirect = async (qrId: string, msg: string, idx: number, link: string) => {
    setScanState("done");
    await supabase.rpc("confirm_scan", {
      qr_id: qrId,
      p_message_used: msg,
      p_message_index: idx,
    });
    setTimeout(() => {
      window.location.href = link;
    }, 1000);
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      await confirmAndRedirect(id!, message, messageIndex, reviewLink);
    } catch {
      // Still can't copy — let user try again
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 hero-gradient rounded-lg flex items-center justify-center">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gradient">QReview Pro</span>
        </div>

        {scanState === "loading" && (
          <div className="py-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Preparing your message...</p>
          </div>
        )}

        {scanState === "ready" && (
          <div className="py-2">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-amber-100">
              <Copy className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Copy Your Review</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Tap the button below to copy the message, then paste it on the review page.
            </p>

            <div className="bg-secondary rounded-xl p-4 text-left mb-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Review Message</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>

            <Button
              onClick={handleManualCopy}
              className="w-full hero-gradient text-white border-0 shadow-primary hover:opacity-90"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Message
            </Button>
          </div>
        )}

        {scanState === "done" && (
          <div className="py-2">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-success-muted">
              <CheckCircle className="h-8 w-8 text-success-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Message Copied! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Redirecting you to the review page…
            </p>

            <div className="bg-secondary rounded-xl p-4 text-left mb-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Review Message</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Paste this message into the Google review box!
            </p>

            <Button
              onClick={() => { window.location.href = reviewLink; }}
              className="w-full hero-gradient text-white border-0 shadow-primary hover:opacity-90"
              size="sm"
            >
              Open Review Page Now
            </Button>
          </div>
        )}

        {scanState === "error" && (
          <div className="py-6">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-error-muted">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Oops!</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {scanState === "no_messages" && (
          <div className="py-6">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-amber-100">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Messages</h2>
            <p className="text-sm text-muted-foreground">This QR code doesn't have any review messages configured.</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
          Powered by <span className="font-semibold text-primary">QReview Pro</span>
        </p>
      </div>
    </div>
  );
}
