import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { format } from "date-fns";

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
  scanned_at: string;
  qr_name?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [{ data: qrs }, { data: events }] = await Promise.all([
      supabase
        .from("qr_codes")
        .select("id, name, successful_scans, messages, created_at")
        .eq("user_id", user!.id)
        .order("successful_scans", { ascending: false }),
      supabase
        .from("scan_events")
        .select("id, qr_code_id, message_used, message_index, scanned_at")
        .order("scanned_at", { ascending: false })
        .limit(100),
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

  const totalScans = qrCodes.reduce((s, q) => s + q.successful_scans, 0);
  const totalMessages = qrCodes.reduce((s, q) => s + q.messages.length, 0);

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
        <div className="flex items-center gap-4 mb-8">
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
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track performance across all your QR codes.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 hero-gradient rounded-xl flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total QR Codes</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{qrCodes.length}</p>
          </div>
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 teal-gradient rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Successful Scans</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalScans}</p>
          </div>
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-warning rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Messages</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalMessages}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Bar chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-8">
                <h2 className="font-semibold text-foreground text-lg mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Scans per QR Code
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 13,
                      }}
                      cursor={{ fill: "hsl(var(--secondary))" }}
                    />
                    <Bar
                      dataKey="scans"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      name="Scans"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-QR breakdown table */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-border">
                <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  QR Code Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">QR Name</TableHead>
                      <TableHead className="font-semibold text-center">Messages</TableHead>
                      <TableHead className="font-semibold text-center">Successful Scans</TableHead>
                      <TableHead className="font-semibold text-center">Messages Used</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qrCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No QR codes yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      qrCodes.map((qr) => {
                        const usedPercent =
                          qr.messages.length > 0
                            ? Math.min(100, Math.round((qr.successful_scans / qr.messages.length) * 100))
                            : 0;
                        return (
                          <TableRow key={qr.id} className="hover:bg-secondary/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 hero-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                                  <QrCode className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-medium text-foreground">{qr.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                                {qr.messages.length}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 text-success-foreground font-semibold">
                                <CheckCircle className="h-4 w-4" />
                                {qr.successful_scans}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${usedPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{usedPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(qr.created_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Recent scan events */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Scan Events
                </h2>
                <span className="text-sm text-muted-foreground">
                  Last {scanEvents.length} events
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">QR Code</TableHead>
                      <TableHead className="font-semibold">Message Used</TableHead>
                      <TableHead className="font-semibold text-center">Msg #</TableHead>
                      <TableHead className="font-semibold">Scanned At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No scan events yet. Share your QR codes to start collecting reviews!
                        </TableCell>
                      </TableRow>
                    ) : (
                      scanEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-secondary/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 hero-gradient rounded-md flex items-center justify-center flex-shrink-0">
                                <QrCode className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="font-medium text-foreground text-sm">
                                {event.qr_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-foreground max-w-xs truncate">
                              {event.message_used ?? "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                              {event.message_index !== null ? event.message_index + 1 : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(event.scanned_at), "MMM d, yyyy · h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))
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
