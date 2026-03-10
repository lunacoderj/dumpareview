import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Copy, AlertCircle, QrCode, ExternalLink, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanState = "loading" | "ready" | "copied" | "review_opened" | "done" | "error" | "no_messages";

export default function ScanRedirect() {
  const { id } = useParams<{ id: string }>();
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [message, setMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [reviewLink, setReviewLink] = useState("");
  const [error, setError] = useState("");
  const [scanEventId, setScanEventId] = useState<string | null>(null);
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
        // Copy succeeded — confirm scan
        const { data: eventId } = await (supabase.rpc as any)("confirm_scan", {
          qr_id: id!,
          p_message_used: result.message!,
          p_message_index: result.message_index!,
        });
        setScanEventId(eventId as string);
        setScanState("copied");
      } catch {
        // Clipboard failed — show manual copy UI
        setScanState("ready");
      }
    } catch {
      setScanState("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      const { data: eventId } = await (supabase.rpc as any)("confirm_scan", {
        qr_id: id!,
        p_message_used: message,
        p_message_index: messageIndex,
      });
      setScanEventId(eventId as string);
      setScanState("copied");
    } catch {
      // Still can't copy — let user try again
    }
  };

  const handleOpenReview = () => {
    window.open(reviewLink, "_blank");
    setScanState("review_opened");
  };

  const handleDone = async () => {
    if (!scanEventId || !id) return;
    try {
      await (supabase.rpc as any)("confirm_review_done", {
        qr_id: id,
        scan_event_id: scanEventId,
      });
      setScanState("done");
    } catch {
      // silently fail
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

        {(scanState === "copied" || scanState === "review_opened") && (
          <div className="py-2">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Message Copied! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {scanState === "copied"
                ? "Now open the review page, paste your message, and post your review!"
                : "Paste the message, post your review, then tap Done below."}
            </p>

            <div className="bg-secondary rounded-xl p-4 text-left mb-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Review Message</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleOpenReview}
                className="w-full hero-gradient text-white border-0 shadow-primary hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {scanState === "copied" ? "Open Review Page" : "Open Review Page Again"}
              </Button>

              <Button
                onClick={handleDone}
                disabled={scanState === "copied"}
                variant="outline"
                className={`w-full transition-all ${
                  scanState === "review_opened"
                    ? "border-green-500 text-green-700 hover:bg-green-50 font-semibold"
                    : "opacity-50"
                }`}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {scanState === "copied" ? "Open review page first" : "I've Posted My Review ✓"}
              </Button>

              {scanState === "copied" && (
                <p className="text-xs text-muted-foreground">
                  The "Done" button will activate after you open the review page.
                </p>
              )}
            </div>
          </div>
        )}

        {scanState === "done" && (
          <div className="py-2">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-green-100">
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Thank You! 🙏</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Your review has been noted. We really appreciate your feedback!
            </p>
          </div>
        )}

        {scanState === "error" && (
          <div className="py-6">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-red-100">
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
