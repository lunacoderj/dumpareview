import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PayoutStatus() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // States
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [payoutStatus, setPayoutStatus] = useState<'none' | 'processing' | 'dispute' | 'completed'>('none');
  const [latestPayout, setLatestPayout] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user || !userProfile) return;

      try {
        const data = await apiFetch('/api/user/status');
        
        setPayoutStatus(data.status);
        if (data.status === 'dispute' && data.dispute) {
          setActiveDispute(data.dispute);
        } else if ((data.status === 'processing' || data.status === 'completed') && data.payout) {
          setLatestPayout(data.payout);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, userProfile]);

  const resolveDispute = async () => {
    if (!activeDispute) return;
    setLoading(true);
    await apiFetch(`/api/disputes/${activeDispute.id}/resolve`, { method: 'POST' });
    setActiveDispute(null);
    setPayoutStatus('none');
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Payout Status</h1>
        <p className="text-muted-foreground">Track your rewards and fix any rejected reviews.</p>
      </div>

      {payoutStatus === 'none' && (
        <Card className="text-center p-12 border-dashed">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Keep going!</h2>
            <p className="text-muted-foreground">
              You currently have a streak of {userProfile?.current_streak}/10. 
              Complete 10 verified reviews to trigger a ₹50 payout.
            </p>
          </CardContent>
        </Card>
      )}

      {payoutStatus === 'processing' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="text-center pb-2">
            <Clock className="h-12 w-12 text-amber-500 mx-auto mb-2 animate-pulse" />
            <CardTitle className="text-xl text-amber-700">Processing Payout...</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-amber-600 pb-6">
            <p>Admin is verifying your 10 reviews or dispatching your PhonePe payment.</p>
            <p className="text-sm mt-2 opacity-80">Usually takes 2-4 hours.</p>
          </CardContent>
        </Card>
      )}

      {payoutStatus === 'dispute' && activeDispute && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Action Required: Correction
            </CardTitle>
            <CardDescription className="text-destructive/80">
              An admin flagged a problem with your review for {activeDispute.submissions?.campaigns?.company_name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-black/20 p-4 rounded border border-destructive/20 text-sm">
              <span className="font-semibold block mb-1">Admin Note:</span>
              "{activeDispute.admin_message}"
            </div>
            <p className="text-sm text-muted-foreground">
              Your streak was reduced by 1. Please fix the issue on Google and do another task to rebuild your streak.
            </p>
            <Button onClick={resolveDispute} className="w-full" variant="destructive">
              I Understand (Dismiss)
            </Button>
          </CardContent>
        </Card>
      )}

      {payoutStatus === 'completed' && latestPayout && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center pb-2">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-2xl text-green-700">Payment Sent!</CardTitle>
            <CardDescription className="text-green-600">
              ₹{latestPayout.amount} was sent to your PhonePe.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            {latestPayout.receipt_url && (
              <a href={latestPayout.receipt_url} target="_blank" rel="noreferrer" className="block max-w-[200px] border-4 border-white shadow-md rounded overflow-hidden">
                <img src={latestPayout.receipt_url} alt="Receipt" className="w-full h-auto" />
              </a>
            )}
            <p className="text-xs text-green-600/60 mt-4">Date: {new Date(latestPayout.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
