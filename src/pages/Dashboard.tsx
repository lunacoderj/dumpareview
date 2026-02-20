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
import { QrCode, Plus, ExternalLink, Trash2, CheckCircle, BarChart3, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface QRCode {
  id: string;
  name: string;
  google_review_link: string;
  messages: string[];
  current_message_index: number;
  successful_scans: number;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQRCodes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load QR codes.");
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

  const totalScans = qrCodes.reduce((sum, q) => sum + q.successful_scans, 0);
  const totalMessages = qrCodes.reduce((sum, q) => sum + q.messages.length, 0);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] ?? "there"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Manage your QR codes and track review performance.</p>
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
              className="hero-gradient text-white border-0 shadow-primary hover:opacity-90 h-11 px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              New QR Code
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 hero-gradient rounded-xl flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">QR Codes</span>
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
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Messages</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalMessages}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-lg">QR Code History</h2>
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
            <div className="p-16 text-center">
              <div className="h-16 w-16 hero-gradient rounded-3xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No QR codes yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                Create your first QR code to start collecting Google reviews from your customers.
              </p>
              <Button
                onClick={() => navigate("/generate")}
                className="hero-gradient text-white border-0 shadow-primary hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First QR Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-12 font-semibold">Sl.</TableHead>
                    <TableHead className="font-semibold">QR Name</TableHead>
                    <TableHead className="font-semibold">Google Review Link</TableHead>
                    <TableHead className="font-semibold text-center">Messages</TableHead>
                    <TableHead className="font-semibold text-center">Scans</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr, index) => (
                    <TableRow key={qr.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 hero-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                            <QrCode className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium text-foreground">{qr.name}</span>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(qr.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const url = `${window.location.origin}/scan/${qr.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Scan URL copied!");
                            }}
                            className="text-xs"
                          >
                            Copy URL
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
