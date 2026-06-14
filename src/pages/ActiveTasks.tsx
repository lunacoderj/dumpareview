import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, Target, Store, QrCode, Copy, ExternalLink, UploadCloud, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { supabase } from "@/lib/supabase/client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ActiveTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [nameExistsError, setNameExistsError] = useState("");

  useEffect(() => {
    const fetchActiveCampaigns = async () => {
      if (!user) return;
      try {
        const availableCamps = await apiFetch('/api/campaigns/active');
        setCampaigns(availableCamps);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCampaigns();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  const getReviewUrl = (campaignId: string) => {
    return `${window.location.origin}/review/${campaignId}?u=${user?.uid || ''}`;
  };

  const openSubmitModal = async (camp: any) => {
    setSelectedCampaign(camp);
    setIsSubmitModalOpen(true);
    setImageFile(null);
    setReviewerName("");
    setNameExistsError("");
  };

  const downloadQRImage = async (camp: any) => {
    try {
      const qrCanvas = document.getElementById(`qr-hidden-${camp.id}`) as HTMLCanvasElement;
      if (!qrCanvas) return;

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/pwa-192.png";
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });

      let startY = 80;

      if (img.width) {
        ctx.drawImage(img, canvas.width / 2 - 180, startY - 25, 80, 80);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 42px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('DumpAReviews', canvas.width / 2 - 80, startY + 30);
      } else {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DumpAReviews', canvas.width / 2, startY + 30);
      }

      // Draw Website Name
      ctx.fillStyle = '#666666';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('dumpareviews.jaggu.me', canvas.width / 2, startY + 80);

      // Draw QR Code
      const qrSize = 400;
      ctx.drawImage(qrCanvas, canvas.width / 2 - qrSize / 2, startY + 150, qrSize, qrSize);

      // Draw Company Name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      
      const words = camp.company_name.split(' ');
      let line = '';
      let y = startY + 620;
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if(metrics.width > canvas.width - 80 && n > 0) {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = words[n] + ' ';
          y += 45;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), canvas.width / 2, y);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${camp.company_name}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "QR Code downloaded!" });
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: "Download failed", description: "Could not generate QR image.", variant: "destructive" });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      await extractText(file);
    }
  };

  const extractText = async (file: File) => {
    try {
      setUploading(true);
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const fullTextLower = text.toLowerCase();
      const companyNameLower = selectedCampaign?.company_name?.toLowerCase() || '';
      const companyWords = companyNameLower.split(/[^a-z0-9]+/).filter((w: string) => w.length > 2);
      
      let companyFound = false;
      if (fullTextLower.includes(companyNameLower)) {
        companyFound = true;
      } else if (companyWords.length > 0) {
        let matchCount = 0;
        companyWords.forEach((w: string) => {
          if (fullTextLower.includes(w)) matchCount++;
        });
        // Require at least 2 significant words to match, or all words if less than 2
        if (matchCount >= Math.min(2, companyWords.length)) {
          companyFound = true;
        }
      }

      if (!companyFound) {
        toast({ title: "Company Mismatch", description: "Could not detect the company name in the screenshot. Please upload the correct review image.", variant: "destructive" });
        setReviewerName("");
        setNameExistsError("");
        return;
      }

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let foundName = "";
      
      for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('posting publicly') || lowerLine.includes('local guide') || lowerLine.includes('reviews')) {
          if (i > 0) {
            foundName = lines[i-1];
            // Clean up leading isolated letters from profile avatars (like 'J Jagadhesh')
            foundName = foundName.replace(/^[A-Za-z]\s+/, '');
            break;
          }
        }
      }

      if (foundName) {
        setReviewerName(foundName);
        checkNameExists(foundName);
        toast({ title: "Name detected", description: `Detected name: ${foundName}` });
      } else {
        setReviewerName("");
        setNameExistsError("");
        toast({ title: "Name not auto-detected", description: "Could not automatically detect the name. Please type it exactly as it appears.", variant: "destructive" });
      }
    } catch (err) {
      console.error("OCR Error:", err);
      toast({ title: "Error scanning image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const checkNameExists = async (name: string) => {
    if (!selectedCampaign || !name.trim()) return;
    
    setNameCheckLoading(true);
    try {
      const formattedName = name.trim().toLowerCase();
      const res = await axios.get(`${BACKEND_URL}/api/public/check-email?campaign_id=${selectedCampaign.id}&email=${encodeURIComponent(formattedName)}`);
      if (res.data.exists) {
        setNameExistsError("This reviewer name has already been submitted for this company.");
      } else {
        setNameExistsError("");
      }
    } catch (e) {
      console.error("Error checking name", e);
      setNameExistsError("");
    } finally {
      setNameCheckLoading(false);
    }
  };

  const standardizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85); // Compress slightly and standardize to JPEG
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  const uploadScreenshot = async (file: File) => {
    const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'review-assets';
    
    // Convert to a standardized JPEG format before uploading
    const standardizedFile = await standardizeImage(file);
    const fileName = `user_review_${Date.now()}.jpg`;
    const filePath = `reviews/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, standardizedFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  const handleSubmitResponse = async () => {
    if (!imageFile || !selectedCampaign || !reviewerName.trim()) return;
    try {
      setUploading(true);
      const imageUrl = await uploadScreenshot(imageFile);
      const formattedName = reviewerName.trim().toLowerCase();
      
      await axios.post(`${BACKEND_URL}/api/public/submissions`, {
        campaign_id: selectedCampaign.id,
        screenshot_url: imageUrl,
        extracted_email: formattedName, // Storing name in the email column
        referrer_uid: user?.uid
      });
      
      toast({ title: "Successfully submitted response!" });
      setIsSubmitModalOpen(false);
    } catch (err: any) {
      let errorMsg = "An error occurred";
      const errData = err.response?.data?.error;
      if (typeof errData === 'string') {
        errorMsg = errData;
      } else if (errData && typeof errData === 'object' && errData.message) {
        errorMsg = errData.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast({ title: "Submission failed", description: errorMsg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight mb-1">Available Tasks</h1>
        <p className="text-sm text-muted-foreground">Select a business, share the QR or link to get reviews and earn rewards.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="mx-auto w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
            <Store className="h-5 w-5 text-zinc-400" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No tasks available</h2>
          <p className="text-sm text-muted-foreground">Check back later for new review opportunities.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {campaigns.map(camp => {
            const reviewUrl = getReviewUrl(camp.id);
            return (
              <Card key={camp.id} className="border-zinc-200 hover:shadow-md transition-shadow flex flex-col p-0 overflow-hidden">
                <CardHeader className="p-2 pb-1 bg-zinc-50 border-b">
                  <CardTitle className="text-xs font-semibold truncate" title={camp.company_name}>{camp.company_name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-2 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" /> Progress
                      </span>
                      <span className="font-medium text-foreground">
                        {camp.current_count}/{camp.target_count}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (camp.current_count / camp.target_count) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-1.5 bg-white rounded border shadow-sm">
                    <QRCodeCanvas value={reviewUrl} size={60} className="mb-1" />
                    <QRCodeCanvas id={`qr-hidden-${camp.id}`} value={reviewUrl} size={512} style={{ display: 'none' }} />
                    <div className="flex gap-1 w-full mt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-6 text-[9px] px-1" onClick={() => copyToClipboard(reviewUrl)}>
                        <Copy className="h-2.5 w-2.5 mr-1" /> Copy
                      </Button>
                      <Button size="sm" className="flex-1 h-6 text-[9px] px-1" onClick={() => window.open(reviewUrl, '_blank')}>
                        <ExternalLink className="h-2.5 w-2.5 mr-1" /> Open
                      </Button>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full h-6 text-[9px] mt-1" onClick={() => downloadQRImage(camp)}>
                      <Download className="h-2.5 w-2.5 mr-1" /> Download QR
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="p-1.5 pt-0">
                  <Button className="w-full h-7 text-[10px]" onClick={() => openSubmitModal(camp)}>
                    Submit
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Response Dialog */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Response</DialogTitle>
            <DialogDescription>
              Upload the review screenshot for {selectedCampaign?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription className="text-xs">
                Make sure the Reviewer's Name is clearly visible in the screenshot along with the comment!
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <label className="cursor-pointer w-full">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload screenshot</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </label>
            </div>
            
            {imageFile && (
              <div className="text-center text-sm font-medium text-blue-600">
                Selected: {imageFile.name}
              </div>
            )}

            {imageFile && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reviewer Name</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. Jagadhesh Bellane"
                  value={reviewerName}
                  onChange={(e) => {
                    setReviewerName(e.target.value);
                    if (e.target.value.trim().length > 2) {
                      checkNameExists(e.target.value);
                    } else {
                      setNameExistsError("");
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Verify and correct the name if OCR missed it. Must exactly match the review.</p>
              </div>
            )}

            {nameCheckLoading && (
              <div className="flex justify-center items-center py-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying name...
              </div>
            )}

            {reviewerName.trim().length > 2 && !nameCheckLoading && !nameExistsError && (
              <div className="bg-green-50 text-green-800 p-2 rounded text-sm text-center">
                Name Approved: <strong>{reviewerName}</strong>
              </div>
            )}

            {nameExistsError && !nameCheckLoading && (
              <div className="bg-red-50 text-red-800 p-2 rounded text-sm text-center border border-red-200">
                <strong>Duplicate found:</strong> {reviewerName}
                <p className="text-xs mt-1">{nameExistsError}</p>
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={!imageFile || uploading || reviewerName.trim().length < 3 || nameCheckLoading || !!nameExistsError}
              onClick={handleSubmitResponse}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Submit Response"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
