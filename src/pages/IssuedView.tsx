import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Copy, ExternalLink, Upload, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function IssuedView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign');

  const [loading, setLoading] = useState(true);
  const [assignedMessage, setAssignedMessage] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  
  // Submission state
  const [uploading, setUploading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    const initializeTask = async () => {
      if (!user || !campaignId) {
        navigate('/');
        return;
      }

      try {
        const data = await apiFetch(`/api/campaigns/${campaignId}/task`);
        if (data.submission) {
          setSubmission(data.submission);
        }
        setAssignedMessage(data.message);
        setCampaign(data.campaign);

      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    initializeTask();
  }, [user, campaignId]);

  const handleCopy = () => {
    if (assignedMessage) {
      navigator.clipboard.writeText(assignedMessage.message_text);
      toast({ title: "Copied!", description: "Text copied to clipboard." });
      window.open(campaign.google_review_link, '_blank');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !campaign || !assignedMessage) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      // 1. Upload to Storage
      const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
      const fileExt = file.name.split('.').pop();
      const fileName = `review_${user.uid}_${Date.now()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // 2. Create Submission
      const newSub = await apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: campaign.id,
          message_id: assignedMessage.id,
          screenshot_url: publicUrl
        })
      });

      setSubmission(newSub);
      toast({ title: "Submitted!", description: "12-hour timer has started." });

    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const trigger12HourCheck = async () => {
    if (!submission) return;
    try {
      await apiFetch(`/api/submissions/${submission.id}/trigger`, { method: 'POST' });
      
      toast({ title: "Check triggered", description: "Admin will now verify your review." });
      navigate('/payout');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!campaign || !assignedMessage) return <div className="p-8 text-center">Task unavailable.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {!submission ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Complete Task</h1>
            <p className="text-muted-foreground">Follow the steps below to submit your review.</p>
          </div>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Copy Text & Open Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-md border font-medium">
                {assignedMessage.message_text}
              </div>
              <Button onClick={handleCopy} className="w-full text-lg h-12">
                <Copy className="h-5 w-5 mr-2" />
                Copy & Open Google Maps
              </Button>
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" /> You have 20 minutes before this text is reassigned.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Upload Proof
              </CardTitle>
              <CardDescription>Take a screenshot of your published Google Review and upload it here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="proof-upload" className="block cursor-pointer">
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-12 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-400" />
                      <div className="text-center">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </>
                  )}
                </div>
              </Label>
              <Input 
                id="proof-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
            <CardHeader className="text-center pb-2">
              <Clock className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <CardTitle className="text-2xl text-amber-700 dark:text-amber-500">12-Hour Maturation</CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-600/80">
                Google removes fake reviews quickly. We wait 12 hours to ensure your review sticks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="bg-white/60 dark:bg-black/20 p-4 rounded-lg text-center font-medium">
                Submitted at: {new Date(submission.submitted_at).toLocaleString()}
              </div>
              
              <div className="text-center">
                {/* In a real app, calculate true 12h diff here. Using a bypass button for testing. */}
                <Button 
                  onClick={trigger12HourCheck} 
                  disabled={submission.twelve_hour_check_triggered}
                  className="w-full max-w-sm"
                >
                  {submission.twelve_hour_check_triggered ? "Admin is verifying..." : "Trigger Admin Check (Bypass 12h)"}
                </Button>
                {!submission.twelve_hour_check_triggered && (
                   <p className="text-xs text-muted-foreground mt-2 mt-4">Note: The "bypass" button is visible for demonstration purposes.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
