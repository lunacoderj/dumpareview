import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';

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
            <p className="text-xs text-muted-foreground mt-2">
              Please paste the message above in the review.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
