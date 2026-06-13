import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle, Search, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminAudit() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  
  const [disputeMsg, setDisputeMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/api/admin/audit');
      setUsers(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loadUserSubmissions = async (user: any) => {
    setSelectedUser(user);
    setSubsLoading(true);
    try {
      const data = await apiFetch(`/api/admin/audit/${user.user_id}/submissions`);
      setUserSubmissions(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching submissions", description: error.message, variant: "destructive" });
    } finally {
      setSubsLoading(false);
    }
  };

  const handleClearPayout = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/audit/${selectedUser.user_id}/clear`, { method: 'POST' });

      toast({ title: "Cleared for Payout", description: "User moved to Payout Proofs module." });
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (submissionId: string) => {
    if (!selectedUser || !disputeMsg) {
      toast({ title: "Missing info", description: "Please enter a dispute message.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/audit/${selectedUser.user_id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({
          submissionId,
          adminMsg: disputeMsg,
          currentStreak: selectedUser.current_streak
        })
      });

      toast({ title: "Dispute Raised", description: "User streak decremented. They will see the correction request." });
      setDisputeMsg("");
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Milestone Audit</h1>
        <p className="text-muted-foreground">Module C: Review users who hit 10-streak and clear for payout.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Ready for Audit</h2>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              No users pending audit.
            </Card>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <Card 
                  key={u.user_id} 
                  className={`cursor-pointer transition-colors ${selectedUser?.user_id === u.user_id ? 'border-primary ring-1 ring-primary' : 'hover:border-zinc-300'}`}
                  onClick={() => loadUserSubmissions(u)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{u.full_name || u.email}</h3>
                      <p className="text-xs text-muted-foreground">{u.phonepe_details || 'No payment info'}</p>
                    </div>
                    <div className="bg-primary/10 text-primary font-bold px-2 py-1 rounded">
                      {u.current_streak}/10
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Audit View */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="bg-zinc-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedUser.full_name || selectedUser.email}</CardTitle>
                    <CardDescription>Payment Details: <span className="font-medium text-foreground">{selectedUser.phonepe_details || 'NOT PROVIDED'}</span></CardDescription>
                  </div>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleClearPayout}
                    disabled={actionLoading || !selectedUser.phonepe_details}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Clear for Payout
                  </Button>
                </div>
                {!selectedUser.phonepe_details && (
                  <div className="mt-2 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> User must provide PhonePe details before payout.
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {subsLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {userSubmissions.map((sub, idx) => (
                      <div key={sub.id} className="p-4 flex flex-col md:flex-row gap-4 hover:bg-zinc-50/50">
                        <div className="md:w-32 flex-shrink-0 flex items-center justify-center bg-zinc-100 rounded border h-32 relative">
                           <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded">{10 - idx}</span>
                           {sub.screenshot_url ? (
                             <a href={sub.screenshot_url} target="_blank" rel="noreferrer" className="w-full h-full p-1">
                               <img src={sub.screenshot_url} className="w-full h-full object-contain mix-blend-multiply" alt="proof" />
                             </a>
                           ) : <FileText className="text-zinc-300" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-sm">{sub.campaigns?.company_name}</h4>
                          <p className="text-xs text-muted-foreground bg-white p-2 rounded border">"{sub.review_messages?.message_text}"</p>
                          <div className="flex gap-2 items-start mt-2">
                            <Textarea 
                              placeholder="If invalid, state reason..." 
                              className="h-9 text-xs resize-none" 
                              onChange={(e) => setDisputeMsg(e.target.value)}
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive h-9"
                              onClick={() => handleDispute(sub.id)}
                              disabled={actionLoading}
                            >
                              Dispute
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-12 text-muted-foreground border-dashed">
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p>Select a user to audit their 10-streak submissions.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
