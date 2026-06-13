import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, Target, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ActiveTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSelectCampaign = (id: string) => {
    navigate(`/issued?campaign=${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Available Tasks</h1>
        <p className="text-muted-foreground">Select a business to review and earn rewards.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No tasks available</h2>
          <p className="text-muted-foreground">Check back later for new review opportunities.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <Card key={camp.id} className="border-zinc-200 hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{camp.company_name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="h-4 w-4" /> Goal Progress
                    </span>
                    <span className="font-medium text-foreground">
                      {camp.current_count} / {camp.target_count}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (camp.current_count / camp.target_count) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Button className="w-full justify-between group" onClick={() => handleSelectCampaign(camp.id)}>
                  Claim Task
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
