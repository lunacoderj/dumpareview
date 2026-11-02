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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  QrCode,
  Clock,
  MessageSquare,
  ShieldCheck,
  X,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { run24HourAuditAgent } from "@/lib/auditAgent";
import { toast } from "sonner";

interface QRCode {
  id: string;
  name: string;
  successful_scans: number;
  messages: string[];
  created_at: string;
}

interface ScanEvent {
  id: string;
  qr_code_id: string;
  message_used: string | null;
  message_index: number | null;
  verification_status?: string;
  verified_at?: string;
  verification_batch_id?: string;
  agent_notes?: string;
  scanned_at: string;
  qr_name?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    await syncUserAccount(user);
    const userIds = await getUserAccountIds(user);
    const [{ data: qrs }, { data: events }] = await Promise.all([
      supabase
        .from("qr_codes")
        .select("id, name, successful_scans, messages, created_at")
        .in("user_id", userIds)
        .order("successful_scans", { ascending: false }),
      supabase
        .from("scan_events")
        .select("id, qr_code_id, message_used, message_index, verification_status, verified_at, verification_batch_id, agent_notes, scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(200),
    ]);

    const qrList = qrs ?? [];
    setQrCodes(qrList);

    // Enrich events with QR name
    const qrMap = Object.fromEntries(qrList.map((q) => [q.id, q.name]));
    const enriched = (events ?? []).map((e) => ({
      ...e,
      qr_name: qrMap[e.qr_code_id] ?? "Unknown",
    }));
    setScanEvents(enriched);
    setLoading(false);
  };

  const handleTriggerManualAudit = async () => {
    if (!user) return;
    setRunningAudit(true);
    toast.info("24-Hour Agent is scanning eligible records (24h+ maturation)...");

    try {
      const summary = await run24HourAuditAgent(user.uid);
      if (summary.totalEligible === 0) {
        toast.info("No scans >= 24 hours old ready for audit. Recent scans are maturing in the 24h window.");
      } else {
        toast.success(
          `Audit complete! Audited ${summary.totalEligible} scans: ${summary.successCount} verified on Google, ${summary.failCount} not found.`
        );
      }
      await fetchData();
    } catch {
      toast.error("Failed to run 24-hour audit agent.");
    } finally {
      setRunningAudit(false);
    }
  };

  const totalScans = qrCodes.reduce((s, q) => s + q.successful_scans, 0);
  const totalMessages = qrCodes.reduce((s, q) => s + q.messages.length, 0);
  const verifiedSuccess = scanEvents.filter((e) => e.verification_status === "verified_success").length;
  const verifiedFail = scanEvents.filter((e) => e.verification_status === "verified_fail").length;
  const maturingScans = scanEvents.filter(
    (e) => (!e.verification_status || e.verification_status === "pending") && differenceInHours(new Date(), new Date(e.scanned_at)) < 24
  ).length;

  const conversionRate = totalScans > 0 ? Math.round((verifiedSuccess / totalScans) * 100) : 0;

  const chartData = qrCodes
    .filter((q) => q.successful_scans > 0)
    .slice(0, 10)
    .map((q) => ({
      name: q.name.length > 14 ? q.name.slice(0, 14) + "…" : q.name,
      scans: q.successful_scans,
    }));

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-primary" />
                Review Performance & 24h Audit
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Detailed scan conversions and automated 24-hour verification agent results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleTriggerManualAudit}
              disabled={runningAudit}
              className="hero-gradient text-white font-bold h-10 px-4 shadow-sm text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${runningAudit ? "animate-spin" : ""}`} />
              {runningAudit ? "Auditing 24h Scans..." : "Run 24h Audit Now"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="stat-card rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 hero-gradient rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Scans</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalScans}</p>
              </div>

              <div className="stat-card rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Google Verified</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{verifiedSuccess}</p>
                <p className="text-xs text-muted-foreground mt-1">Confirmed by 24h Agent</p>
              </div>

              <div className="stat-card rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Maturing in 24h</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{maturingScans}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaits next daily cycle</p>
              </div>

              <div className="stat-card rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 teal-gradient rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Conversion Rate</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Verified reviews / scans</p>
              </div>
            </div>

            {/* Top Scanned QR Codes Chart */}
            {chartData.length > 0 && (
              <div className="stat-card rounded-2xl mb-8 p-6">
                <h2 className="font-bold text-foreground text-lg mb-1">Top QR Codes by Scans</h2>
                <p className="text-xs text-muted-foreground mb-6">Scan volume across your business locations.</p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Analysis & 24-Hour Agent Audit Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    24-Hour Review Verification Audit Log
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automated agent verifies reviews on Google once daily (00:00 UTC) after a 24-hour maturation window.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full font-medium">
                  {scanEvents.length} recorded scans
                </span>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-14 font-semibold text-center">#</TableHead>
                      <TableHead className="font-semibold">Review Message Text</TableHead>
                      <TableHead className="font-semibold w-40">Scan Timestamp</TableHead>
                      <TableHead className="font-semibold w-36">Maturation Age</TableHead>
                      <TableHead className="font-semibold text-center w-52">
                        24-Hour Agent Audit Result
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No scan events recorded yet. Share your QR codes to begin collecting and verifying reviews!
                        </TableCell>
                      </TableRow>
                    ) : (
                      scanEvents.map((event, idx) => {
                        const hoursAgo = differenceInHours(new Date(), new Date(event.scanned_at));
                        const isMatured = hoursAgo >= 24;

                        return (
                          <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold text-center text-muted-foreground">
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground max-w-lg leading-relaxed italic">
                                  "{event.message_used ?? "No message assigned"}"
                                </p>
                                <span className="text-[11px] text-muted-foreground block">
                                  Location: <strong className="text-foreground/80">{event.qr_name}</strong>
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(event.scanned_at), "MMM d, yyyy · h:mm a")}
                            </TableCell>

                            <TableCell>
                              {isMatured ? (
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  Mature ({hoursAgo}h old)
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                  {hoursAgo}/24h (Defers to next cycle)
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              {event.verification_status === "verified_success" ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1 shadow-sm">
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                  Successful (Verified by Agent)
                                </Badge>
                              ) : event.verification_status === "verified_fail" ? (
                                <Badge variant="destructive" className="font-bold text-xs px-3 py-1">
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Fail (Not on Google)
                                </Badge>
                              ) : isMatured ? (
                                <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5 text-blue-700 bg-blue-50">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Eligible for Next 24h Batch
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-medium text-[11px] px-2 py-0.5 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Awaiting 24h Window
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
