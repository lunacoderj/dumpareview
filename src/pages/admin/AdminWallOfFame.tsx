import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

type WallOfFameEntry = {
  id: string;
  image_url: string;
  received_image_url?: string;
  description: string;
  amount: number | null;
  created_at: string;
};

export default function AdminWallOfFame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [imageUrl, setImageUrl] = useState("");
  const [receivedImageUrl, setReceivedImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [uploadingSent, setUploadingSent] = useState(false);
  const [uploadingReceived, setUploadingReceived] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/public/wall-of-fame");
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: "Error loading entries",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleFileUpload = async (file: File, type: 'sent' | 'received') => {
    const setUploading = type === 'sent' ? setUploadingSent : setUploadingReceived;
    const setUrl = type === 'sent' ? setImageUrl : setReceivedImageUrl;
    
    setUploading(true);
    try {
      const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET;
      const fileExt = file.name.split('.').pop();
      const fileName = `wall_of_fame_${type}_${Date.now()}.${fileExt}`;
      const filePath = `wall_of_fame/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUrl(publicUrl);
      toast({ title: "Success", description: "Image uploaded successfully." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !description) {
      toast({ title: "Validation Error", description: "Image URL and description are required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/api/admin/wall-of-fame", {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
          received_image_url: receivedImageUrl || null,
          description,
          amount: amount ? Number(amount) : null
        })
      });
      
      toast({ title: "Success", description: "Entry added to Wall of Fame" });
      setImageUrl("");
      setReceivedImageUrl("");
      setDescription("");
      setAmount("");
      loadEntries();
    } catch (err: any) {
      toast({
        title: "Error adding entry",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await apiFetch(`/api/admin/wall-of-fame/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Entry removed successfully" });
      loadEntries();
    } catch (err: any) {
      toast({
        title: "Error deleting entry",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Wall of Fame Admin</h1>
          <p className="text-muted-foreground mt-1">Manage payment proof images shown on the landing page</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Entry Form */}
        <Card className="lg:col-span-1 h-fit bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add New Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Sent Screenshot URL (From Admin)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="imageUrl" 
                    placeholder="https://..." 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], 'sent');
                        }
                      }}
                      disabled={uploadingSent}
                    />
                    <Button type="button" variant="outline" disabled={uploadingSent} className="w-[100px]">
                      {uploadingSent ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Upload</>}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedImageUrl">Received Screenshot URL (From User)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="receivedImageUrl" 
                    placeholder="https://..." 
                    value={receivedImageUrl}
                    onChange={(e) => setReceivedImageUrl(e.target.value)}
                  />
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], 'received');
                        }
                      }}
                      disabled={uploadingReceived}
                    />
                    <Button type="button" variant="outline" disabled={uploadingReceived} className="w-[100px]">
                      {uploadingReceived ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" /> Upload</>}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount Paid (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="e.g. 50" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the payout..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding..." : "Add to Wall of Fame"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : entries.length === 0 ? (
            <Card className="border-dashed bg-secondary/20">
              <CardContent className="py-12 text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No entries found. Add your first payment proof!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden border-border/50 bg-card/50 flex flex-col group">
                  <div className="flex w-full bg-secondary overflow-hidden relative">
                    <div className={`aspect-video relative ${entry.received_image_url ? 'w-1/2 border-r border-border/50' : 'w-full'}`}>
                      <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-br z-10">Sent</div>
                      <img src={entry.image_url} alt="Sent Proof" className="w-full h-full object-cover" />
                    </div>
                    {entry.received_image_url && (
                      <div className="aspect-video relative w-1/2">
                        <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-br z-10">Received</div>
                        <img src={entry.received_image_url} alt="Received Proof" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">{entry.description}</p>
                      {entry.amount && <span className="font-bold text-green-500 whitespace-nowrap ml-2">₹{entry.amount}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
