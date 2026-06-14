import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PublicReview() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const referrerUid = searchParams.get('u');

  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [taskData, setTaskData] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [isCopied, setIsCopied] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    fetchTask();
  }, [campaignId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/public/campaigns/${campaignId}/task`);
      setTaskData(data);
    } catch (err: any) {
      let errorMsg = "Error fetching task.";
      const errData = err.response?.data?.error;
      if (typeof errData === 'string') {
        errorMsg = errData;
      } else if (errData && typeof errData === 'object' && errData.message) {
        errorMsg = errData.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    if (!taskData?.message) return;
    try {
      await navigator.clipboard.writeText(taskData.message.message_text);
      setIsCopied(true);
      toast({ title: "Message copied!" });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setSelectedFile(file);
    setCrop(undefined);
    setCompletedCrop(undefined);
    
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !referrerUid) {
        toast({ title: "Missing information", description: "Referrer UID or file is missing.", variant: "destructive" });
        return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', selectedFile);
      formData.append('campaign_id', campaignId || '');
      formData.append('referrer_uid', referrerUid);
      if (taskData?.message?.id) {
          formData.append('message_id', taskData.message.id);
      }
      
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

      await axios.post(`${BACKEND_URL}/api/public/submissions`, formData);

      setSubmitted(true);
      toast({ title: "Submitted successfully!", description: "Your review has been uploaded for verification." });

    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (error) return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;


  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">{taskData?.campaign?.company_name} - Google Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-muted p-4 rounded-lg relative">
            <h3 className="text-sm font-semibold mb-2">Review Message:</h3>
            <p className="pr-10 text-sm">{taskData?.message?.message_text}</p>
            <Button 
              size="icon" 
              variant="outline" 
              className="absolute top-2 right-2"
              onClick={copyMessage}
            >
              {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-center">
            <Button 
              className="w-full text-lg py-6" 
              onClick={() => window.open(taskData?.campaign?.google_review_link, '_blank')}
            >
              Open Google Review Page
            </Button>
            <p className="text-xs text-muted-foreground mt-2 mb-8">
              Please paste the message above in the review.
            </p>
          </div>
          
          <hr className="my-6 border-zinc-200 dark:border-zinc-800" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Step 2: Submit Proof</h3>
            <p className="text-sm text-center text-muted-foreground">Take a screenshot of your published Google Review and upload it here.</p>
            
            {submitted ? (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your review screenshot has been submitted for verification. You can close this window.
                </AlertDescription>
              </Alert>
            ) : !imgSrc ? (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
