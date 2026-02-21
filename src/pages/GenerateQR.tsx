import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Plus, Trash2, Download, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface GeneratedQR {
  id: string;
  name: string;
  scanUrl: string;
}

type InputMode = "individual" | "bulk";

export default function GenerateQR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [messages, setMessages] = useState<string[]>([""]);
  const [bulkText, setBulkText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("bulk");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQR | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const addMessage = () => {
    if (messages.length >= 100) {
      toast.error("Maximum 100 messages allowed.");
      return;
    }
    setMessages([...messages, ""]);
  };

  const removeMessage = (i: number) => {
    if (messages.length === 1) return;
    setMessages(messages.filter((_, idx) => idx !== i));
  };

  const updateMessage = (i: number, val: string) => {
    const updated = [...messages];
    updated[i] = val;
    setMessages(updated);
  };

  const getValidMessages = (): string[] => {
    if (inputMode === "bulk") {
      return bulkText
        .split("\n")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
    }
    return messages.filter((m) => m.trim());
  };

  const handleGenerate = async () => {
    if (!name.trim()) { toast.error("Please enter a name for the QR code."); return; }
    if (!link.trim()) { toast.error("Please enter a Google Review link."); return; }
    if (!link.startsWith("http")) { toast.error("Please enter a valid URL starting with http(s)://"); return; }
    const validMessages = getValidMessages();
    if (validMessages.length === 0) { toast.error("Please add at least one message."); return; }
    if (validMessages.length > 100) { toast.error("Maximum 100 messages allowed."); return; }
    if (!user) { toast.error("You must be logged in."); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("qr_codes")
        .insert({
          user_id: user.id,
          name: name.trim(),
          google_review_link: link.trim(),
          messages: validMessages,
          message_used_counts: new Array(validMessages.length).fill(0),
          current_message_index: 0,
          successful_scans: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const scanUrl = `${window.location.origin}/scan/${data.id}`;
      setGenerated({ id: data.id, name: data.name, scanUrl });
      toast.success("QR code generated successfully!");
    } catch {
      toast.error("Failed to generate QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 400;
    canvas.height = 400;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.download = `${generated?.name ?? "qr"}-qrcode.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleReset = () => {
    setGenerated(null);
    setName("");
    setLink("");
    setMessages([""]);
    setBulkText("");
  };

  const bulkCount = bulkText.split("\n").filter((m) => m.trim()).length;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate QR Code</h1>
          <p className="text-muted-foreground">Create a QR code with pre-written review messages for your customers.</p>
        </div>

        {generated ? (
          <div className="stat-card rounded-2xl text-center p-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">QR Code Ready!</h2>
            <p className="text-muted-foreground mb-8">{generated.name}</p>

            <div ref={qrRef} className="flex justify-center mb-6">
              <div className="p-6 bg-white rounded-2xl border border-border shadow-md inline-block">
                <QRCodeSVG value={generated.scanUrl} size={200} level="H" includeMargin />
              </div>
            </div>

            <div className="mb-6 p-4 bg-secondary rounded-xl text-left">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Scan URL</p>
              <p className="text-sm text-foreground font-mono break-all">{generated.scanUrl}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleDownload} className="hero-gradient text-white border-0 shadow-primary hover:opacity-90">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>View Dashboard</Button>
              <Button variant="ghost" onClick={handleReset}>Create Another</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="stat-card rounded-2xl space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">QR Code Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cafe Bella Review QR" className="mt-1.5 h-11" />
                <p className="text-xs text-muted-foreground mt-1">A label to identify this QR code in your dashboard.</p>
              </div>
              <div>
                <Label htmlFor="link" className="text-sm font-medium">Google Review Link</Label>
                <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://g.page/r/your-business/review" className="mt-1.5 h-11" />
                <p className="text-xs text-muted-foreground mt-1">The URL customers will be taken to after copying the message.</p>
              </div>
            </div>

            <div className="stat-card rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Review Messages</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inputMode === "bulk" ? `${bulkCount}` : `${messages.filter((m) => m.trim()).length}`} / 100 messages.
                    Each scan picks a random unused message.
                  </p>
                </div>
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                  <button
                    onClick={() => setInputMode("bulk")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inputMode === "bulk" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Bulk Paste
                  </button>
                  <button
                    onClick={() => setInputMode("individual")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inputMode === "individual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Individual
                  </button>
                </div>
              </div>

              {inputMode === "bulk" ? (
                <div>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"Paste all messages here, one per line:\n\nGreat food and service!\nLoved the ambiance, will come back.\nBest coffee in town!"}
                    className="min-h-[240px] text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    One message per line. Empty lines are ignored.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <Button variant="outline" size="sm" onClick={addMessage} disabled={messages.length >= 100}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {messages.map((msg, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center text-xs font-bold text-muted-foreground bg-secondary rounded-lg mt-0.5">
                          {i + 1}
                        </span>
                        <Textarea
                          value={msg}
                          onChange={(e) => updateMessage(i, e.target.value)}
                          placeholder={`Message ${i + 1}: e.g. "Great service and food!"`}
                          className="flex-1 min-h-[80px] text-sm resize-none"
                        />
                        <button
                          onClick={() => removeMessage(i)}
                          disabled={messages.length === 1}
                          className="flex-shrink-0 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors mt-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 text-base hero-gradient text-white border-0 shadow-primary hover:opacity-90"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-3" />
              ) : (
                <QrCode className="h-5 w-5 mr-2" />
              )}
              {loading ? "Generating..." : "Generate QR Code"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
