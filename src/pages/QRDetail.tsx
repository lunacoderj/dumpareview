import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Download, CheckCircle, MessageSquare,
  ChevronDown, ChevronUp, ExternalLink, BarChart3, Copy, Pencil, Check, X,
  Trash2, Plus, Sparkles, AlertTriangle, ShieldCheck, Clock, ShieldAlert, RotateCcw, Zap
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";
import { downloadQRCodeWithBusinessName } from "@/lib/qrDownload";
import { QRCodeSVG } from "qrcode.react";
import { generate100Reviews } from "@/lib/geminiReviews";
import { markBusinessForAudit, markScanForAudit, markScanForReReview } from "@/lib/auditAgent";

interface QRCodeData {
  id: string;
  name: string;
  google_review_link: string;
  business_category?: string;
  status?: string;
  auto_refill_prompted?: boolean;
  messages: string[];
  message_used_counts: number[];
  successful_scans: number;
  created_at: string;
}

interface ScanEvent {
  id: string;
  message_used: string | null;
  message_index: number | null;
  verification_status?: string;
  marked_for_audit?: boolean;
  audit_count?: number;
  verified_at?: string;
  scanned_at: string;
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
  const [markingBusiness, setMarkingBusiness] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  // Edit Single Message State
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  // Add Single Message State
  const [isAddMsgOpen, setIsAddMsgOpen] = useState(false);
  const [newMsgText, setNewMsgText] = useState("");

  // AI 100 Refill State
  const [isGenerating100, setIsGenerating100] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    try {
      const [qrRes, eventsRes] = await Promise.all([
        supabase.from("qr_codes").select("*").eq("id", id).single(),
        supabase.from("scan_events").select("*").eq("qr_code_id", id).order("scanned_at", { ascending: false }).limit(200),
      ]);

      if (qrRes.error || !qrRes.data) {
        setError("QR code not found or you don't have access.");
        setLoading(false);
        return;
      }

      setQr(qrRes.data as unknown as QRCodeData);
      setEvents((eventsRes.data ?? []) as unknown as ScanEvent[]);
    } catch {
      setError("Failed to load data.");
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!qrRef.current || !qr) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const success = downloadQRCodeWithBusinessName(svg, qr.name || "Business");
    if (success) {
      toast.success("QR code downloaded with business name!");
    } else {
      toast.error("Failed to download QR code image.");
    }
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

  // Mark all scans of this business for audit
  const handleMarkBusinessForAudit = async () => {
    if (!qr) return;
    setMarkingBusiness(true);
    try {
      const count = await markBusinessForAudit(qr.id);
      toast.success(`Marked ${count} pending/failed scans for audit! Bypassing 24-hour wait.`);
      await fetchData();
    } catch {
      toast.error("Failed to mark business for audit.");
    } finally {
      setMarkingBusiness(false);
    }
  };

  // Row action: Fast track
  const handleFastTrackScan = async (scanId: string) => {
    setRowActionId(scanId);
    const success = await markScanForAudit(scanId);
    if (success) {
      toast.success("Fast-tracked for audit! The 24-hour wait is bypassed.");
      setEvents((prev) =>
        prev.map((e) => (e.id === scanId ? { ...e, marked_for_audit: true } : e))
      );
    } else {
      toast.error("Failed to mark scan for audit.");
    }
    setRowActionId(null);
  };

  // Row action: Re-review failed
  const handleReReviewScan = async (scanId: string) => {
    setRowActionId(scanId);
    const success = await markScanForReReview(scanId);
    if (success) {
      toast.success("Marked for re-review! The agent will re-audit Google Maps.");
      setEvents((prev) =>
        prev.map((e) =>
          e.id === scanId ? { ...e, verification_status: "pending", marked_for_audit: true } : e
        )
      );
    } else {
      toast.error("Failed to mark for re-review.");
    }
    setRowActionId(null);
  };

  // Edit message
  const handleOpenEdit = (index: number, currentText: string) => {
    setEditingMsgIndex(index);
    setEditingMsgText(currentText);
  };

  const handleSaveEditedMessage = async () => {
    if (!qr || editingMsgIndex === null || !editingMsgText.trim()) return;
    const updatedMessages = [...qr.messages];
    updatedMessages[editingMsgIndex] = editingMsgText.trim();

    const { error } = await supabase
      .from("qr_codes")
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq("id", qr.id);

    if (error) {
      toast.error("Failed to update review message.");
    } else {
      setQr({ ...qr, messages: updatedMessages });
      toast.success(`Message #${editingMsgIndex + 1} updated!`);
      setEditingMsgIndex(null);
    }
  };

  // Delete message
  const handleDeleteMessage = async (indexToDelete: number) => {
    if (!qr) return;
    if (qr.messages.length <= 1) {
      toast.error("You must have at least one message.");
      return;
    }

    const updatedMessages = qr.messages.filter((_, i) => i !== indexToDelete);
    const updatedCounts = (qr.message_used_counts || []).filter((_, i) => i !== indexToDelete);

    const { error } = await supabase
      .from("qr_codes")
      .update({
        messages: updatedMessages,
        message_used_counts: updatedCounts,
        current_message_index: qr.current_message_index >= updatedMessages.length ? 0 : qr.current_message_index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qr.id);

    if (error) {
      toast.error("Failed to delete message.");
    } else {
      setQr({ ...qr, messages: updatedMessages, message_used_counts: updatedCounts });
      toast.success("Message deleted successfully.");
    }
  };

  // Add message
  const handleAddMessage = async () => {
    if (!qr || !newMsgText.trim()) return;
    const updatedMessages = [...qr.messages, newMsgText.trim()];
    const updatedCounts = [...(qr.message_used_counts || []), 0];

    const { error } = await supabase
      .from("qr_codes")
      .update({
        messages: updatedMessages,
        message_used_counts: updatedCounts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qr.id);

    if (error) {
      toast.error("Failed to add message.");
    } else {
      setQr({ ...qr, messages: updatedMessages, message_used_counts: updatedCounts });
      toast.success("New message added!");
      setNewMsgText("");
      setIsAddMsgOpen(false);
    }
  };

  // Trigger 100 Fresh Reviews
  const handleGenerate100FreshReviews = async () => {
    if (!qr) return;
    setIsGenerating100(true);
    toast.info(`Generating 100 natural 5-star reviews for ${qr.name}...`);
    try {
      const freshReviews = await generate100Reviews({
        businessName: qr.name,
        category: qr.business_category || "General Business",
      });

      const fullPayload = {
        messages: freshReviews,
        message_used_counts: new Array(freshReviews.length).fill(0),
        current_message_index: 0,
        status: "active",
        auto_refill_prompted: false,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase
        .from("qr_codes")
        .update(fullPayload)
        .eq("id", qr.id);

      // Fallback for legacy DB schema without status/auto_refill_prompted
      if (error) {
        console.warn("[DumpaReview] Full update failed, retrying with core columns:", error.message);
        const baselinePayload = {
          messages: freshReviews,
          message_used_counts: new Array(freshReviews.length).fill(0),
          current_message_index: 0,
          updated_at: new Date().toISOString(),
        };
        const fbRes = await supabase
          .from("qr_codes")
          .update(baselinePayload)
          .eq("id", qr.id);
        error = fbRes.error;
      }

      if (error) throw error;

      setQr({
        ...qr,
        messages: freshReviews,
        message_used_counts: new Array(freshReviews.length).fill(0),
        current_message_index: 0,
        status: "active",
        auto_refill_prompted: false,
      });

      toast.success("Successfully generated and loaded 100 fresh review messages!");
    } catch {
      toast.error("Failed to generate new reviews. Please try again.");
    } finally {
      setIsGenerating100(false);
    }
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
  const visibleMessages = showAllMessages ? messageStats : messageStats.slice(0, 8);
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
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* 100-Message Exhaustion Alert Banner */}
        {(qr.status === "exhausted" || qr.auto_refill_prompted) && (
          <div className="mb-8 p-5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">All 100 Review Messages Used!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customers have cycled through all 100 pre-written reviews. Would you like to generate a fresh batch of 100 reviews?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleGenerate100FreshReviews}
                disabled={isGenerating100}
                className="hero-gradient text-white font-bold h-9 text-xs shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isGenerating100 ? "Generating..." : "Accept & Generate 100"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.from("qr_codes").update({ auto_refill_prompted: false, status: "active" }).eq("id", qr.id);
                  setQr({ ...qr, auto_refill_prompted: false, status: "active" });
                  toast.info("Keeping current message rotation.");
                }}
                className="h-9 text-xs"
              >
                Keep Current
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
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
              Created {format(new Date(qr.created_at), "MMMM d, yyyy")} · Category: {qr.business_category || "General"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={markingBusiness}
              onClick={handleMarkBusinessForAudit}
              className="h-9 text-xs font-bold border-primary text-primary hover:bg-primary/10"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              {markingBusiness ? "Marking..." : "Mark Business for Audit"}
            </Button>
            <a
              href={qr.google_review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline text-sm font-medium px-2 py-1"
            >
              <ExternalLink className="h-4 w-4" /> Google Review Link
            </a>
          </div>
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
            <Button onClick={handleDownload} className="hero-gradient text-white border-0 shadow-primary hover:opacity-90 w-full font-bold">
              <Download className="h-4 w-4 mr-2" /> Download Branded QR
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
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                <span className="text-sm font-medium text-muted-foreground">Configured Messages</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{qr.messages.length}</p>
            </div>
            <div className="stat-card rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Messages Copied</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalUsedCount}</p>
            </div>
          </div>
        </div>

        {/* Messages Curation Section */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-8">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground text-lg">Review Messages ({qr.messages.length}/100)</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curation tools: Edit, delete, add custom reviews, or regenerate all 100 with AI.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddMsgOpen(true)}
                className="h-9 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Message
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate100FreshReviews}
                disabled={isGenerating100}
                className="h-9 text-xs hero-gradient text-white font-bold shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {isGenerating100 ? "Crafting 100..." : "Regenerate 100 with AI"}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Review Message Text</TableHead>
                  <TableHead className="font-semibold text-center w-28">Times Used</TableHead>
                  <TableHead className="font-semibold text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMessages.map((m) => (
                  <TableRow key={m.index} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-muted-foreground">{m.index + 1}</TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground max-w-xl leading-relaxed italic">
                        "{m.message}"
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-secondary text-foreground text-xs font-bold">
                        {m.usedCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(m.index, m.message)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteMessage(m.index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {messageStats.length > 8 && (
            <div className="p-4 border-t border-border text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMessages(!showAllMessages)}
                className="font-semibold text-xs"
              >
                {showAllMessages ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> Collapse to 8 Messages
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

        {/* Recent Scan Events with 24-Hour Agent Audit & Row-Level Actions */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Customer Scan Log & Agent Audit</h2>
            </div>
            <span className="text-xs text-muted-foreground">{events.length} scans recorded</span>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No scan events yet. Display your QR code to start collecting reviews!
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-12 font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Suggested Review Message</TableHead>
                    <TableHead className="font-semibold w-36">Scanned At</TableHead>
                    <TableHead className="font-semibold text-center w-40">Agent Audit Status</TableHead>
                    <TableHead className="font-semibold text-right w-40">Audit Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev, idx) => {
                    const hoursAgo = differenceInHours(new Date(), new Date(ev.scanned_at));
                    const isMatured = hoursAgo >= 24;
                    const isSuccess = ev.verification_status === "verified_success";
                    const isFail = ev.verification_status === "verified_fail";
                    const isQueued = ev.marked_for_audit;

                    return (
                      <TableRow key={ev.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-sm text-foreground max-w-md truncate">
                          {ev.message_used ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(ev.scanned_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-center">
                          {isSuccess ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : isFail ? (
                            <Badge variant="destructive" className="font-bold text-[11px] px-2.5 py-0.5">
                              <X className="h-3 w-3 mr-1" /> Not Found
                            </Badge>
                          ) : isQueued ? (
                            <Badge className="bg-blue-600 text-white font-semibold text-[11px] px-2.5 py-0.5">
                              <Clock className="h-3 w-3 mr-1" /> Queued for Audit
                            </Badge>
                          ) : isMatured ? (
                            <Badge variant="secondary" className="font-bold text-[11px] px-2.5 py-0.5 text-blue-700 bg-blue-50">
                              <Clock className="h-3 w-3 mr-1" /> Ready (24h+)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-medium text-[10px] px-2 py-0.5 text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" /> Maturing ({hoursAgo}/24h)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSuccess ? (
                            <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Verified (Skipped)
                            </span>
                          ) : isFail ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rowActionId === ev.id}
                              onClick={() => handleReReviewScan(ev.id)}
                              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              {rowActionId === ev.id ? "Queuing..." : "Re-Review"}
                            </Button>
                          ) : isQueued ? (
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              Queued
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rowActionId === ev.id}
                              onClick={() => handleFastTrackScan(ev.id)}
                              className="h-7 text-xs font-semibold text-primary hover:bg-primary/5"
                            >
                              <Zap className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" />
                              {rowActionId === ev.id ? "Fast-tracking..." : "Fast-Track"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Dialog for Editing Message */}
        <Dialog open={editingMsgIndex !== null} onOpenChange={(open) => !open && setEditingMsgIndex(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Edit Review Message #{editingMsgIndex !== null ? editingMsgIndex + 1 : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                value={editingMsgText}
                onChange={(e) => setEditingMsgText(e.target.value)}
                className="min-h-[120px] text-sm resize-none"
                placeholder="Enter review message..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMsgIndex(null)}>Cancel</Button>
              <Button onClick={handleSaveEditedMessage} className="hero-gradient text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for Adding New Message */}
        <Dialog open={isAddMsgOpen} onOpenChange={setIsAddMsgOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Add Custom Review Message
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                className="min-h-[120px] text-sm resize-none"
                placeholder="e.g. Outstanding service! Clean atmosphere and very polite staff."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMsgOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMessage} disabled={!newMsgText.trim()} className="hero-gradient text-white">
                Add Review Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
