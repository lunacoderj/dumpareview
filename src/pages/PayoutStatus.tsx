import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

export default function PayoutStatus() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // States
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [payoutStatus, setPayoutStatus] = useState<'none' | 'processing' | 'dispute' | 'completed'>('none');
  const [latestPayout, setLatestPayout] = useState<any>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const { toast } = useToast();

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

  const handleUserReceiptUpload = async (file: File) => {
    if (!latestPayout) return;
    setUploadingReceipt(true);
    try {
      const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
      const fileExt = file.name.split('.').pop();
      const fileName = `user_receipt_${latestPayout.id}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      await apiFetch(`/api/user/payouts/${latestPayout.id}/receipt`, {
        method: 'POST',
        body: JSON.stringify({ receipt_url: publicUrl })
      });

      setLatestPayout({ ...latestPayout, user_receipt_url: publicUrl });
      toast({ title: "Success", description: "Received screenshot uploaded successfully." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-muted-foreground mb-2">Sent by Admin</span>
                {latestPayout.receipt_url ? (
                  <a href={latestPayout.receipt_url} target="_blank" rel="noreferrer" className="block max-w-[200px] border-4 border-white shadow-md rounded overflow-hidden">
                    <img src={latestPayout.receipt_url} alt="Admin Receipt" className="w-full h-auto" />
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground">Not available</div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-muted-foreground mb-2">Received Screenshot (You)</span>
                {latestPayout.user_receipt_url ? (
                  <a href={latestPayout.user_receipt_url} target="_blank" rel="noreferrer" className="block max-w-[200px] border-4 border-white shadow-md rounded overflow-hidden">
                    <img src={latestPayout.user_receipt_url} alt="Your Receipt" className="w-full h-auto" />
                  </a>
                ) : (
                  <div className="w-full max-w-[250px]">
                    <Label htmlFor="user-receipt-upload" className="cursor-pointer block">
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 hover:bg-zinc-50 transition-colors">
                        {uploadingReceipt ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">Upload Screenshot</span>
                          </>
                        )}
                      </div>
                    </Label>
                    <Input 
                      id="user-receipt-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUserReceiptUpload(e.target.files[0]);
                        }
                      }}
                      disabled={uploadingReceipt}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-green-600/60 mt-6">Date: {new Date(latestPayout.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
