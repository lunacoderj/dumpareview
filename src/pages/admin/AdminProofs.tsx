import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Receipt, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminProofs() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      const data = await apiFetch('/api/admin/proofs');
      setPayouts(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching payouts", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleFileUpload = async (payoutId: string, file: File) => {
    setUploadingId(payoutId);
    try {
      // 1. Upload to Supabase Storage
      const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
      const fileExt = file.name.split('.').pop();
      const fileName = `receipt_${payoutId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // 3. Update payout record
      await apiFetch(`/api/admin/proofs/${payoutId}`, {
        method: 'POST',
        body: JSON.stringify({ publicUrl })
      });

      toast({ title: "Success", description: "Receipt uploaded and payout marked as completed." });
      fetchPayouts();
      
      // Note: Here is where we would trigger the Resend email API in Phase 4.
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Payout Proofs</h1>
        <p className="text-muted-foreground">Module D: Upload payment receipts for cleared users.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : payouts.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No pending payouts</h2>
          <p className="text-muted-foreground">All cleared users have been paid.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payouts.map(p => (
            <Card key={p.id} className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{p.user_profiles?.full_name || p.user_profiles?.email}</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2.5 py-0.5 rounded text-lg border border-green-200">
                    ₹{p.amount}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-3 border text-sm">
                  <span className="text-muted-foreground block text-xs uppercase font-medium mb-1">PhonePe Details</span>
                  <span className="font-mono text-foreground font-semibold">{p.user_profiles?.phonepe_details}</span>
                </div>

                <div className="pt-2">
                  <Label htmlFor={`file-${p.id}`} className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 hover:bg-zinc-50 transition-colors">
                      {uploadingId === p.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">Upload Receipt</span>
                        </>
                      )}
                    </div>
                  </Label>
                  <Input 
                    id={`file-${p.id}`} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(p.id, e.target.files[0]);
                      }
                    }}
                    disabled={!!uploadingId}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
