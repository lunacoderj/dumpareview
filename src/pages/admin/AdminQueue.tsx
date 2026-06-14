import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminQueue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const data = await apiFetch('/api/admin/queue');
      // Sort: pending first, then others
      const sorted = (data || []).sort((a: any, b: any) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0; // maintain original sorting (by submitted_at desc)
      });
      setQueue(sorted);
    } catch (error: any) {
      toast({ title: "Error fetching queue", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (sub: any) => {
    setActionLoading(sub.id);
    try {
      await apiFetch(`/api/admin/queue/${sub.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ sub })
      });

      toast({ title: "Approved", description: "Submission approved." });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sub: any) => {
    setActionLoading(sub.id);
    try {
      await apiFetch(`/api/admin/queue/${sub.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ sub })
      });

      toast({ title: "Rejected", description: "Submission rejected and message returned to pool." });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Verification Queue</h1>
        <p className="text-muted-foreground">Module B: Review 12-hour mature submissions.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <Card key={i} className="flex flex-col overflow-hidden p-0">
              <div className="flex flex-row p-2 gap-2 border-b items-center">
                <Skeleton className="w-12 h-12 rounded shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
                <Skeleton className="w-12 h-4 rounded shrink-0" />
              </div>
              <div className="p-2 flex flex-col gap-2 flex-1">
                <Skeleton className="h-8 w-full rounded" />
                <div className="flex justify-end gap-1.5 mt-auto">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-6 w-14" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Queue is empty</h2>
          <p className="text-muted-foreground">All pending reviews have been processed.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {queue.map(sub => (
            <Card key={sub.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Top Row: Thumbnail + Info + Status */}
              <div className="flex flex-col sm:flex-row p-2 gap-2 border-b bg-zinc-50/50 dark:bg-zinc-900/50 items-start sm:items-center">
                <div className="w-16 h-16 shrink-0 overflow-hidden relative group rounded shadow-sm bg-white border">
                  {sub.screenshot_url ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full h-full cursor-pointer relative">
                          <img 
                            src={sub.screenshot_url} 
                            alt="Screenshot" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium px-1 rounded bg-black/50">View</span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Proof Screenshot</DialogTitle>
                          <DialogDescription>{sub.campaigns?.company_name}</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center mt-4">
                          <img src={sub.screenshot_url} alt="Review Screenshot" className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg" />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-[10px] text-zinc-500 text-center flex items-center justify-center h-full">No img</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center pt-0.5">
                  <h3 className="font-semibold text-sm leading-tight break-words" title={sub.campaigns?.company_name}>
                    {sub.campaigns?.company_name || 'Unknown Campaign'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 break-all leading-tight">
                    By: <span className="font-medium text-foreground">{sub.user_profiles?.full_name || sub.user_profiles?.email}</span>
                  </p>
                </div>

                <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-1 mt-2 sm:mt-0">
                  {sub.status === 'pending' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">PENDING</span>
                  )}
                  {sub.status === 'approved' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">APPROVED</span>
                  )}
                  {sub.status === 'rejected' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">REJECTED</span>
                  )}
                  {sub.twelve_hour_check_triggered && sub.status === 'pending' && (
                    <div className="flex items-center gap-0.5 text-[9px] font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      <Clock className="h-2.5 w-2.5" />
                      <span>12h+</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Text & Actions */}
              <div className="p-2 flex flex-col gap-2 flex-1">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 border text-[11px] flex-1 max-h-24 overflow-y-auto">
                  <p className="text-foreground leading-snug break-words" title={sub.review_messages?.message_text}>
                    <span className="font-semibold text-muted-foreground">Text: </span>
                    "{sub.review_messages?.message_text}"
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-1.5 mt-auto">
                  <Button 
                    variant="outline" 
                    className="h-6 text-[10px] px-2 py-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(sub)}
                    disabled={!!actionLoading || sub.status !== 'pending'}
                  >
                    {actionLoading === sub.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    Reject
                  </Button>
                  <Button 
                    className="h-6 text-[10px] px-2 py-0 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(sub)}
                    disabled={!!actionLoading || sub.status !== 'pending'}
                  >
                    {actionLoading === sub.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
