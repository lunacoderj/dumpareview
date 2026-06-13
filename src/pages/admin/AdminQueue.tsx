import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminQueue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const data = await apiFetch('/api/admin/queue');
      setQueue(data || []);
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
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : queue.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Queue is empty</h2>
          <p className="text-muted-foreground">All pending reviews have been processed.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map(sub => (
            <Card key={sub.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Screenshot */}
                <div className="md:w-1/3 bg-zinc-100 border-r relative flex items-center justify-center min-h-[200px] p-4">
                  {sub.screenshot_url ? (
                    <a href={sub.screenshot_url} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img src={sub.screenshot_url} alt="Review Screenshot" className="max-h-[300px] object-contain rounded-md shadow-sm border" />
                    </a>
                  ) : (
                    <span className="text-sm text-zinc-500">No screenshot provided</span>
                  )}
                </div>

                {/* Details */}
                <div className="md:w-2/3 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{sub.campaigns?.company_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          By: <span className="font-medium text-foreground">{sub.user_profiles?.full_name || sub.user_profiles?.email}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        <span>12h Checked</span>
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border text-sm mb-6">
                      <span className="font-semibold text-xs text-zinc-500 uppercase tracking-wider block mb-2">Assigned Text</span>
                      <p className="text-foreground leading-relaxed">"{sub.review_messages?.message_text}"</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(sub)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(sub)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve Review
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
