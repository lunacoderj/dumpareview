import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Target, CheckCircle2 } from "lucide-react";
import { Database } from "@/lib/supabase/types";

type Campaign = Database['public']['Tables']['campaigns']['Row'];

export default function AdminCampaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [targetCount, setTargetCount] = useState("10");
  const [bulkMessages, setBulkMessages] = useState("");

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch('/api/admin/campaigns');
      setCampaigns(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching campaigns", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create Campaign
      const campaign = await apiFetch('/api/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          company_name: companyName,
          google_review_link: reviewLink,
          target_count: parseInt(targetCount),
          current_count: 0,
          is_active: true
        })
      });

      // 2. Parse and Insert Messages
      const messages = bulkMessages
        .split('\n')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      if (messages.length > 0) {
        await apiFetch(`/api/admin/campaigns/${campaign.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ messages })
        });
      }

      toast({ title: "Success", description: "Campaign and messages created." });
      setCompanyName("");
      setReviewLink("");
      setTargetCount("10");
      setBulkMessages("");
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/admin/campaigns/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Campaign Hub</h1>
        <p className="text-muted-foreground">Module A: Create and manage review campaigns.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <Card className="lg:col-span-1 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>New Campaign</CardTitle>
            <CardDescription>Launch a new review drive</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Google Review Link</Label>
                <Input type="url" value={reviewLink} onChange={e => setReviewLink(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Target Count</Label>
                <Input type="number" min="1" value={targetCount} onChange={e => setTargetCount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Bulk Messages (one per line)</Label>
                <Textarea 
                  rows={6} 
                  placeholder="The food was great...&#10;Loved the ambiance...&#10;Fast service!"
                  value={bulkMessages} 
                  onChange={e => setBulkMessages(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Campaign List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Active Campaigns</h2>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              No campaigns found.
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {campaigns.map(camp => (
                <Card key={camp.id} className={`border-zinc-200 dark:border-zinc-800 ${!camp.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{camp.company_name}</h3>
                        <a href={camp.google_review_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[200px]">
                          {camp.google_review_link}
                        </a>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${camp.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>
                        {camp.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Target: {camp.target_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{camp.current_count} Completed</span>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button variant={camp.is_active ? "outline" : "default"} size="sm" onClick={() => toggleActive(camp.id, camp.is_active)}>
                        {camp.is_active ? 'Pause' : 'Activate'}
                      </Button>
                    </div>
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
