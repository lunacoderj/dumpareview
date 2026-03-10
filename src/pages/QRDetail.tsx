import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Download, QrCode, CheckCircle, MessageSquare,
  ChevronDown, ChevronUp, ExternalLink, BarChart3, Copy, Pencil, Check, X, ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeData {
  id: string;
  name: string;
  google_review_link: string;
  messages: string[];
  message_used_counts: number[];
  successful_scans: number;
  reviews_done: number;
  created_at: string;
}

interface ScanEvent {
  id: string;
  message_used: string | null;
  message_index: number | null;
  scanned_at: string;
  review_confirmed: boolean;
}

export default function QRDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  const [qr, setQr] = useState<QRCodeData | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      try {
        const [qrRes, eventsRes] = await Promise.all([
          supabase.from("qr_codes").select("*").eq("id", id).eq("user_id", user.id).single(),
          supabase.from("scan_events").select("*").eq("qr_code_id", id).order("scanned_at", { ascending: false }).limit(200),
        ]);

        if (qrRes.error || !qrRes.data) {
          setError("QR code not found or you don't have access.");
          setLoading(false);
          return;
        }

        setQr(qrRes.data as unknown as QRCodeData);
        setEvents(eventsRes.data ?? []);
      } catch {
        setError("Failed to load data.");
      }
      setLoading(false);
    };

    fetchData();
  }, [user, id]);

  const handleDownload = () => {
    if (!qrRef.current || !qr) return;
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
      a.download = `${qr.name}-qrcode.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSaveName = async () => {
    if (!qr || !newName.trim()) return;
    const { error } = await supabase.from("qr_codes").update({ name: newName.trim() }).eq("id", qr.id);
    if (error) {
      toast.error("Failed to update name");
    } else {
      setQr({ ...qr, name: newName.trim() });
      toast.success("Name updated!");
    }
    setEditingName(false);
  };

  // Compute message stats
  const messageStats = qr
    ? qr.messages.map((msg, i) => {
        const usedCount = qr.message_used_counts?.[i] ?? 0;
        const eventCount = events.filter((e) => e.message_index === i).length;
        return { index: i, message: msg, usedCount, eventCount };
      })
    : [];

  const totalUsedCount = messageStats.reduce((s, m) => s + m.usedCount, 0);
  const visibleMessages = showAllMessages ? messageStats : messageStats.slice(0, 5);

  const scanUrl = qr ? `${window.location.origin}/scan/${qr.id}` : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !qr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "QR code not found."}</p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-2xl font-bold h-auto py-1 max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={!newName.trim()}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground">{qr.name}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setNewName(qr.name); setEditingName(true); }}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
          </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Created {format(new Date(qr.created_at), "MMMM d, yyyy")}
            </p>
          <a
            href={qr.google_review_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" /> Google Review Link
          </a>
        </div>

        {/* Top section: QR + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* QR Code Card */}
          <div className="stat-card rounded-2xl flex flex-col items-center p-6">
            <div ref={qrRef} className="mb-4">
              <div className="p-4 bg-white rounded-2xl border border-border shadow-sm inline-block">
                <QRCodeSVG value={scanUrl} size={160} level="H" includeMargin />
              </div>
            </div>
            <Button onClick={handleDownload} className="hero-gradient text-white border-0 shadow-primary hover:opacity-90 w-full">
              <Download className="h-4 w-4 mr-2" /> Download QR
            </Button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(scanUrl);
                toast.success("Scan URL copied!");
              }}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copy Scan URL
            </button>
          </div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 hero-gradient rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Successful Scans</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{qr.successful_scans}</p>
            </div>
            <div className="stat-card rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 teal-gradient rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Total Messages</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{qr.messages.length}</p>
            </div>
            <div className="stat-card rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-warning rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Messages Copied</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalUsedCount}</p>
            </div>
            <div className="stat-card rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                  <ThumbsUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Reviews Done</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{qr.reviews_done}</p>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm mb-8">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-lg">Messages</h2>
            </div>
            <span className="text-sm text-muted-foreground">{qr.messages.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Message</TableHead>
                  <TableHead className="font-semibold text-center w-32">Times Used</TableHead>
                  <TableHead className="font-semibold text-center w-32">Confirmed Copies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMessages.map((m) => (
                  <TableRow key={m.index} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{m.index + 1}</TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground max-w-lg">{m.message}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                        {m.usedCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                        {m.eventCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {messageStats.length > 5 && (
            <div className="p-4 border-t border-border text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMessages(!showAllMessages)}
              >
                {showAllMessages ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> Show All {messageStats.length} Messages
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Recent Scan Events */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-lg">Recent Scan Events</h2>
            </div>
            <span className="text-sm text-muted-foreground">{events.length} events</span>
          </div>
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground text-sm">No scan events yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-12 font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Message Used</TableHead>
                    <TableHead className="font-semibold w-48">Scanned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev, idx) => (
                    <TableRow key={ev.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm text-foreground max-w-md truncate">
                        {ev.message_used ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ev.scanned_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
