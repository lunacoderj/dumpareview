import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, ShieldAlert, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminQueue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchQueue = async () => {
    try {
      const data = await apiFetch('/api/admin/queue');
      // Sort: pending first, then others
      const sorted = (data || []).sort((a: any, b: any) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
      setQueue(sorted);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({ title: "Error fetching queue", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === queue.filter(s => s.status === 'pending').length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.filter(s => s.status === 'pending').map(s => s.id)));
    }
  };

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
        body: JSON.stringify({ sub, reason: "Manual rejection" })
      });
      toast({ title: "Rejected", description: "Submission rejected and message returned to pool." });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk-approve');
    try {
      await apiFetch(`/api/admin/queue/bulk-approve`, {
        method: 'POST',
        body: JSON.stringify({ submissionIds: Array.from(selectedIds) })
      });
      toast({ title: "Bulk Approved", description: `${selectedIds.size} submissions approved.` });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk-reject');
    try {
      await apiFetch(`/api/admin/queue/bulk-reject`, {
        method: 'POST',
        body: JSON.stringify({ submissionIds: Array.from(selectedIds), reason: "Bulk Rejected" })
      });
      toast({ title: "Bulk Rejected", description: `${selectedIds.size} submissions rejected.` });
      fetchQueue();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = queue.filter(s => s.status === 'pending').length;
  const isAllSelected = pendingCount > 0 && selectedIds.size === pendingCount;

  // Find duplicate image hashes
  const hashCounts = queue.reduce((acc, sub) => {
    if (sub.image_hash) {
      acc[sub.image_hash] = (acc[sub.image_hash] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Verification Queue</h1>
          <p className="text-muted-foreground">Module B: Review submissions and manage automated flags.</p>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <CheckSquare className="w-4 h-4 mr-2" />
              {isAllSelected ? "Deselect All" : "Select All"}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={selectedIds.size === 0 || actionLoading !== null}
              onClick={handleBulkReject}
            >
              {actionLoading === 'bulk-reject' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Bulk Reject ({selectedIds.size})
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              disabled={selectedIds.size === 0 || actionLoading !== null}
              onClick={handleBulkApprove}
            >
              {actionLoading === 'bulk-approve' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Bulk Approve ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 flex flex-col gap-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Queue is empty</h2>
          <p className="text-muted-foreground">All pending reviews have been processed.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {queue.map(sub => {
            const isDuplicate = sub.image_hash && hashCounts[sub.image_hash] > 1;
            
            return (
              <Card key={sub.id} className={`flex flex-col overflow-hidden hover:shadow-md transition-shadow relative ${selectedIds.has(sub.id) ? 'ring-2 ring-primary' : ''}`}>
                
                {sub.status === 'pending' && (
                  <div className="absolute top-2 left-2 z-10 bg-white dark:bg-zinc-900 rounded border shadow-sm p-1">
                    <Checkbox 
                      checked={selectedIds.has(sub.id)}
                      onCheckedChange={(checked) => handleSelect(sub.id, checked as boolean)}
                    />
                  </div>
                )}

                {/* Top Row: Thumbnail + Info + Status */}
                <div className="flex flex-col p-3 gap-3 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="w-20 h-20 shrink-0 overflow-hidden relative group rounded shadow-sm bg-white border">
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
                                <span className="text-white text-xs font-medium px-2 py-1 rounded bg-black/50">View</span>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Proof Screenshot</DialogTitle>
                              <DialogDescription>{sub.campaigns?.company_name}</DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center mt-4">
                              <img src={sub.screenshot_url} alt="Review Screenshot" className="max-w-full max-h-[80vh] object-contain rounded-md shadow-lg" />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs text-zinc-500 text-center flex items-center justify-center h-full">No Image</span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-1 min-w-0">
                      {sub.status === 'pending' && <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md w-max">PENDING</span>}
                      {sub.status === 'approved' && <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md w-max">APPROVED</span>}
                      {sub.status === 'rejected' && <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md w-max">REJECTED</span>}
                      
                      {sub.twelve_hour_check_triggered && sub.status === 'pending' && (
                        <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md w-max">
                          <Clock className="h-3 w-3" />
                          <span>12h+ OLD</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col pt-1 space-y-1">
                    <h3 className="font-semibold text-sm truncate" title={sub.campaigns?.company_name}>
                      {sub.campaigns?.company_name || 'Unknown Campaign'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      User: <span className="font-medium text-foreground">{sub.user_profiles?.full_name || sub.user_profiles?.email}</span>
                    </p>
                    {sub.extracted_email && (
                      <p className="text-xs text-muted-foreground truncate">
                        Google Email: <span className="font-medium text-foreground">{sub.extracted_email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Flags Section */}
                <div className="px-3 py-2 flex flex-col gap-1.5 border-b bg-white dark:bg-zinc-950">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Automated Checks</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.is_flagged ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-medium"><ShieldAlert className="w-3 h-3"/> Modded Exif</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-medium"><CheckCircle className="w-3 h-3"/> Clean Exif</span>
                    )}

                    {isDuplicate ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium"><AlertTriangle className="w-3 h-3"/> Duplicate Image</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-medium"><CheckCircle className="w-3 h-3"/> Unique Image</span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Text & Actions */}
                <div className="p-3 flex flex-col gap-3 flex-1 bg-white dark:bg-zinc-950">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-2 border text-xs flex-1 max-h-24 overflow-y-auto">
                    <p className="text-foreground whitespace-pre-wrap">
                      <span className="font-semibold text-muted-foreground block mb-1">Expected Text:</span>
                      {sub.review_messages?.message_text}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 mt-auto pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1"
                      onClick={() => handleReject(sub)}
                      disabled={!!actionLoading || sub.status !== 'pending'}
                    >
                      {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => handleApprove(sub)}
                      disabled={!!actionLoading || sub.status !== 'pending'}
                    >
                      {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
