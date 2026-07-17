import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Target, CheckCircle2, Edit, Trash2, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
type Campaign = {
  id: string;
  company_name: string;
  google_review_link: string;
  target_count: number;
  current_count: number;
  is_active: boolean;
  review_messages?: { id: string; status?: string; message_text?: string }[];
};

export default function AdminCampaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [targetCount, setTargetCount] = useState("10");
  const [bulkMessages, setBulkMessages] = useState("");
  const [existingMessages, setExistingMessages] = useState<any[]>([]);
  const [originalMessages, setOriginalMessages] = useState<Record<string, string>>({});
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null);

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

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // Update Campaign
        await apiFetch(`/api/admin/campaigns/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            company_name: companyName,
            google_review_link: reviewLink,
            target_count: parseInt(targetCount),
          })
        });

        // Add more messages if any
        const messages = bulkMessages.split('\n').map(m => m.trim()).filter(m => m.length > 0);
        if (messages.length > 0) {
          await apiFetch(`/api/admin/campaigns/${editingId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ messages })
          });
        }
        toast({ title: "Success", description: "Campaign updated." });
      } else {
        // Create Campaign
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

        const messages = bulkMessages.split('\n').map(m => m.trim()).filter(m => m.length > 0);
        if (messages.length > 0) {
          await apiFetch(`/api/admin/campaigns/${campaign.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ messages })
          });
        }
        toast({ title: "Success", description: "Campaign and messages created." });
      }

      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCompanyName("");
    setReviewLink("");
    setTargetCount("10");
    setBulkMessages("");
    setExistingMessages([]);
    setOriginalMessages({});
    setQuickAddText("");
  }

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

  const performDeleteMessage = async (msgId: string) => {
    try {
      await apiFetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' });
      setExistingMessages(prev => prev.filter(m => m.id !== msgId));
      fetchCampaigns();
      toast({ title: "Deleted", description: "Message deleted successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteMsgId(null);
    }
  };

  const handleUpdateMessage = async (msgId: string, newText: string) => {
    if (!newText.trim()) {
      toast({ title: "Message cannot be empty", variant: "destructive" });
      return;
    }
    setSavingMsgId(msgId);
    try {
      await apiFetch(`/api/admin/messages/${msgId}`, { 
        method: 'PUT',
        body: JSON.stringify({ message_text: newText.trim() })
      });
      setOriginalMessages(prev => ({ ...prev, [msgId]: newText.trim() }));
      toast({ title: "Updated", description: "Message updated successfully." });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingMsgId(null);
    }
  };

  const handleRevertMessage = (msgId: string) => {
    const original = originalMessages[msgId];
    setExistingMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, message_text: original } : m))
    );
  };

  const handleQuickAddMessages = async () => {
    if (!editingId) return;
    const messages = quickAddText.split('\n').map(m => m.trim()).filter(m => m.length > 0);
    if (messages.length === 0) return;
    setQuickAddLoading(true);
    try {
      await apiFetch(`/api/admin/campaigns/${editingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ messages })
      });
      toast({ title: "Added", description: `${messages.length} message(s) added.` });
      setQuickAddText("");
      // Refetch to pull in new messages with their IDs
      const data = await apiFetch('/api/admin/campaigns');
      setCampaigns(data || []);
      const updated = (data || []).find((c: any) => c.id === editingId);
      const msgs = updated?.review_messages || [];
      setExistingMessages(msgs);
      setOriginalMessages(Object.fromEntries(msgs.map((m: any) => [m.id, m.message_text || ""])));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    try {
      await apiFetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      toast({ title: "Deleted", description: "Campaign deleted successfully." });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (camp: Campaign) => {
    setEditingId(camp.id);
    setCompanyName(camp.company_name);
    setReviewLink(camp.google_review_link);
    setTargetCount(camp.target_count.toString());
    setBulkMessages(""); // Provide empty bulk messages, adding them appends
    const msgs = camp.review_messages || [];
    setExistingMessages(msgs);
    setOriginalMessages(Object.fromEntries(msgs.map((m: any) => [m.id, m.message_text || ""])));
    setQuickAddText("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Campaign Hub</h1>
        <p className="text-muted-foreground">Module A: Create and manage review campaigns.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Campaign" : "New Campaign"}</CardTitle>
            <CardDescription>{editingId ? "Update existing campaign details" : "Launch a new review drive"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
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
                <Label>{editingId ? "Add More Bulk Messages (Optional)" : "Bulk Messages (one per line)"}</Label>
                <Textarea 
                  rows={4} 
                  placeholder="The food was great...&#10;Loved the ambiance...&#10;Fast service!"
                  value={bulkMessages} 
                  onChange={e => setBulkMessages(e.target.value)} 
                  required={!editingId}
                />
              </div>

              {editingId && (
                <div className="space-y-3 mt-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Existing Messages ({existingMessages.length})</Label>
                  </div>

                  {/* Quick add inline */}
                  <div className="space-y-2 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Add more messages (one per line)
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="New message 1&#10;New message 2"
                      value={quickAddText}
                      onChange={e => setQuickAddText(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleQuickAddMessages}
                      disabled={quickAddLoading || !quickAddText.trim()}
                      className="w-full"
                    >
                      {quickAddLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Add Messages
                    </Button>
                  </div>

                  {existingMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Add some above.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {existingMessages.map((msg, i) => {
                        const originalText = originalMessages[msg.id] ?? "";
                        const currentText = msg.message_text || "";
                        const isDirty = currentText !== originalText;
                        const isSaving = savingMsgId === msg.id;
                        return (
                          <div
                            key={msg.id}
                            className={`rounded-md border p-2 transition-colors ${
                              isDirty
                                ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                                : "border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <div className="flex gap-2 items-start">
                              <span className="text-xs text-muted-foreground pt-2 min-w-[20px] text-right">
                                {i + 1}.
                              </span>
                              <Textarea
                                className="flex-1 min-h-[40px] py-2 text-sm resize-none"
                                value={currentText}
                                onChange={(e) => {
                                  const newMsgs = [...existingMessages];
                                  newMsgs[i].message_text = e.target.value;
                                  setExistingMessages(newMsgs);
                                }}
                              />
                              <div className="flex flex-col gap-1">
                                {isDirty && (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleUpdateMessage(msg.id, currentText)}
                                      title="Save changes"
                                      disabled={isSaving}
                                      className="h-7 w-7 p-0"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Save className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRevertMessage(msg.id)}
                                      title="Discard changes"
                                      disabled={isSaving}
                                      className="h-7 w-7 p-0"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteMsgId(msg.id)}
                                  title="Delete message"
                                  className="h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
                  {editingId ? "Update Campaign" : "Create Campaign"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </Button>
                )}
              </div>
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

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(camp)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(camp.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
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
