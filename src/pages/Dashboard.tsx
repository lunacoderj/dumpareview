import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { syncUserAccount, getUserAccountIds } from "@/lib/accountSync";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  QrCode,
  Plus,
  ExternalLink,
  Trash2,
  CheckCircle,
  BarChart3,
  Star,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { markBusinessForAudit } from "@/lib/auditAgent";

interface QRCode {
  id: string;
  name: string;
  google_review_link: string;
  messages: string[];
  current_message_index: number;
  successful_scans: number;
  status?: string;
  auto_refill_prompted?: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchQRCodes = async () => {
    if (!user) return;
    await syncUserAccount(user);
    const userIds = await getUserAccountIds(user);

    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === '22P02') {
        setDbError('DATABASE SCHEMA ERROR: The user_id column is set to UUID but needs to be TEXT. Please run the provided SQL in your Supabase Dashboard to fix this.');
      } else {
        toast.error("Failed to load QR codes: " + error.message);
      }
    } else {
      setQrCodes(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQRCodes();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("qr_codes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete QR code.");
    } else {
      toast.success("QR code deleted.");
      setQrCodes(qrCodes.filter(q => q.id !== id));
    }
  };

  const handleMarkForReview = async (qrId: string, name: string) => {
    setMarkingId(qrId);
    try {
      const count = await markBusinessForAudit(qrId);
      toast.success(`Marked ${count} pending scans for ${name}! Bypassing 24-hour wait.`);
    } catch {
      toast.error("Failed to mark business for review.");
    } finally {
      setMarkingId(null);
    }
  };

  const totalScans = qrCodes.reduce((sum, q) => sum + q.successful_scans, 0);
  const totalMessages = qrCodes.reduce((sum, q) => sum + q.messages.length, 0);
  const exhaustedQRs = qrCodes.filter(q => q.status === "exhausted" || q.auto_refill_prompted);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.displayName?.split(" ")[0] ?? "there"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Manage your QR codes, 100-message rotations, and on-demand audits.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/analytics")}
              variant="outline"
              className="h-11 px-5 border-primary text-primary hover:bg-primary/10"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button
              onClick={() => navigate("/generate")}
              className="h-11 px-5 hero-gradient text-white shadow-primary border-0 hover:opacity-90 font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create QR Code
            </Button>
          </div>
        </div>

        {/* Exhaustion Banner if any QR code finished 100 messages */}
        {exhaustedQRs.length > 0 && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                <strong>{exhaustedQRs.length} QR Code(s)</strong> have completed cycling through all 100 review messages!
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/qr/${exhaustedQRs[0].id}`)}
              className="hero-gradient text-white text-xs font-bold"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Review & Refill 100
            </Button>
          </div>
        )}

        {/* Schema Error Alert if present */}
        {dbError && (
          <div className="bg-red-500/10 border-2 border-red-500/40 text-red-500 p-6 rounded-2xl mb-8 space-y-4">
            <h3 className="font-bold text-lg">Action Required in Supabase Dashboard</h3>
            <p className="text-sm font-mono">{dbError}</p>
          </div>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 hero-gradient rounded-xl flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Active QR Codes</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{qrCodes.length}</p>
          </div>
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 teal-gradient rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Scans</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalScans}</p>
          </div>
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-warning rounded-xl flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Messages</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalMessages}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-lg">QR Codes & Locations</h2>
            </div>
            {qrCodes.length > 0 && (
              <span className="text-sm text-muted-foreground">{qrCodes.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Loading your QR codes...</p>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">No QR codes yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Create your first smart QR code to auto-generate 100 natural Google reviews.
              </p>
              <Button onClick={() => navigate("/generate")} className="hero-gradient text-white border-0 shadow-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Generate My First QR Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-12 font-semibold">Sl.</TableHead>
                    <TableHead className="font-semibold">QR Name & Status</TableHead>
                    <TableHead className="font-semibold">Google Review Link</TableHead>
                    <TableHead className="font-semibold text-center">Messages</TableHead>
                    <TableHead className="font-semibold text-center">Scans</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr, index) => (
                    <TableRow key={qr.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 hero-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                            <QrCode className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{qr.name}</span>
                            {(qr.status === "exhausted" || qr.auto_refill_prompted) && (
                              <span className="inline-block text-[10px] bg-amber-100 text-amber-700 px-2 py-0.2 rounded-full font-bold">
                                100 Messages Cycled
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={qr.google_review_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-sm max-w-48 truncate"
                        >
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{qr.google_review_link}</span>
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-secondary text-foreground text-xs font-semibold">
                          {qr.messages.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle className="h-4 w-4" />
                          {qr.successful_scans}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(qr.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={markingId === qr.id}
                            onClick={() => handleMarkForReview(qr.id, qr.name)}
                            className="h-8 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5"
                            title="Bypass 24h wait and queue all scans for audit"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            {markingId === qr.id ? "Marking..." : "Mark Review"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const url = `${window.location.origin}/scan/${qr.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Scan URL copied!");
                            }}
                            className="text-xs h-8"
                          >
                            Copy URL
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/qr/${qr.id}`)}
                            className="text-xs text-primary font-bold h-8"
                          >
                            <BarChart3 className="h-3.5 w-3.5 mr-1" />
                            Manage
                          </Button>
                          <button
                            onClick={() => handleDelete(qr.id)}
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
