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
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRef } from 'react';

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
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const initializeTask = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        if (!campaignId) {
          // Fetch all submissions history
          const history = await apiFetch('/api/user/submissions');
          setAllSubmissions(history || []);
        } else {
          // Fetch specific campaign task
          const data = await apiFetch(`/api/campaigns/${campaignId}/task`);
          if (data.submission) {
            setSubmission(data.submission);
          }
          setAssignedMessage(data.message);
          setCampaign(data.campaign);
        }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !campaign || !assignedMessage) return;
    const file = e.target.files[0];
    
    setSelectedFile(file);
    setCrop(undefined);
    setCompletedCrop(undefined);
    
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user || !campaign || !assignedMessage) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', selectedFile);
      formData.append('campaign_id', campaign.id);
      formData.append('message_id', assignedMessage.id);
      
      if (completedCrop && imgRef.current) {
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        
        const actualCrop = {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
        };
        formData.append('crop_coords', JSON.stringify(actualCrop));
      }

      const newSub = await apiFetch('/api/submissions', {
        method: 'POST',
        body: formData
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-4">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
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
                  <Skeleton className="h-8 w-full rounded flex-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaignId && !loading && allSubmissions.length === 0) {
    // If not specific campaign and no submissions, we handle below
  } else if (campaignId && (!campaign || !assignedMessage)) {
    return <div className="p-8 text-center">Task unavailable.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {!campaignId ? (
        <div className="space-y-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">My Requests</h1>
            <p className="text-muted-foreground">Here is a list of your submissions and their current statuses.</p>
          </div>
          {allSubmissions.length === 0 ? (
            <Card className="text-center p-8 text-muted-foreground">No submissions found.</Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {allSubmissions.map((sub: any) => (
                <Card key={sub.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  
                  {/* Top Row: Thumbnail + Info + Status */}
                  <div className="flex flex-row p-2 gap-2 border-b bg-zinc-50/50 dark:bg-zinc-900/50 items-start">
                    <div className="w-12 h-12 shrink-0 overflow-hidden relative group rounded shadow-sm bg-white border">
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
                                <span className="text-white text-[9px] font-medium px-1 rounded bg-black/50">View</span>
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
                        <span className="text-[8px] text-zinc-500 text-center flex items-center justify-center h-full">No img</span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1 flex flex-col justify-center pt-0.5">
                      <h3 className="font-semibold text-sm truncate leading-tight" title={sub.campaigns?.company_name}>
                        {sub.campaigns?.company_name || 'Unknown Campaign'}
                      </h3>
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 truncate leading-tight">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{new Date(sub.submitted_at).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                        sub.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        sub.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom Row: Text content */}
                  <div className="p-2 flex flex-col gap-2 flex-1">
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 border text-[10px] flex-1 flex flex-col justify-center gap-1">
                      <p className="text-foreground leading-tight line-clamp-2" title={sub.review_messages?.message_text}>
                        <span className="font-semibold text-muted-foreground">Text: </span>
                        "{sub.review_messages?.message_text}"
                      </p>
                      {sub.status === 'rejected' && sub.rejection_reason && (
                        <p className="text-red-600 dark:text-red-400 leading-tight line-clamp-1" title={sub.rejection_reason}>
                          <span className="font-semibold">Reason: </span>
                          {sub.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : !submission ? (
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
                {assignedMessage?.message_text}
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
              {!imgSrc ? (
                <>
                  <Label htmlFor="proof-upload" className="block cursor-pointer">
                    <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-12 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <Upload className="h-8 w-8 text-zinc-400" />
                      <div className="text-center">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
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
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-4">
                    <p className="text-sm text-center mb-4 font-medium">Please drag a box over your review name if visible. This speeds up verification.</p>
                    <div className="flex justify-center overflow-auto max-h-[500px]">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                      >
                        <img
                          ref={imgRef}
                          alt="Crop me"
                          src={imgSrc}
                          className="max-w-full"
                        />
                      </ReactCrop>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setImgSrc('')} disabled={uploading}>
                      Choose Another Image
                    </Button>
                    <Button className="flex-1" onClick={handleSubmit} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}
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
