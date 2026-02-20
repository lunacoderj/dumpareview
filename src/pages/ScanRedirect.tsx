import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Copy, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanState = "loading" | "done" | "error" | "no_messages";

interface QRData {
  id: string;
  name: string;
  google_review_link: string;
  messages: string[];
  current_message_index: number;
  successful_scans: number;
}

export default function ScanRedirect() {
  const { id } = useParams<{ id: string }>();
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [message, setMessage] = useState("");
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
      const { data: qr, error: fetchError } = await supabase
        .from("qr_codes")
        .select("id, name, google_review_link, messages, current_message_index, successful_scans")
        .eq("id", id)
        .single();

      if (fetchError || !qr) {
        setScanState("error");
        setError("QR code not found or has been deleted.");
        return;
      }

      const qrData = qr as QRData;

      if (!qrData.messages || qrData.messages.length === 0) {
        setScanState("no_messages");
        return;
      }

      const msgIndex = qrData.current_message_index % qrData.messages.length;
      const selectedMessage = qrData.messages[msgIndex];
      const nextIndex = (msgIndex + 1) % qrData.messages.length;

      setMessage(selectedMessage);
      setReviewLink(qrData.google_review_link);

      // Try clipboard copy
      try {
        await navigator.clipboard.writeText(selectedMessage);
      } catch {
        // Will show manual copy button as fallback
      }

      // Update index and increment scans
      await supabase
        .from("qr_codes")
        .update({
          current_message_index: nextIndex,
          successful_scans: qrData.successful_scans + 1,
        })
        .eq("id", id);

      // Log scan event
      await supabase.from("scan_events").insert({
        qr_code_id: id,
        message_used: selectedMessage,
        message_index: msgIndex,
      });

      setScanState("done");

      // Redirect after 2.5 seconds
      setTimeout(() => {
        window.location.href = qrData.google_review_link;
      }, 2500);

    } catch {
      setScanState("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleManualCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      /* ignore */
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
              onClick={handleManualCopy}
              variant="outline"
              size="sm"
              className="w-full mb-3"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Again
            </Button>

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
