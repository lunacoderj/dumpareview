import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, ShieldCheck, MailWarning, Award, Wallet } from "lucide-react";

export default function UserProfile() {
  const { user, userProfile, isEmailVerified, resendVerification, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [phonepe, setPhonepe] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (userProfile?.phonepe_details) {
      setPhonepe(userProfile.phonepe_details);
    }
  }, [userProfile]);

  const handleSavePhonePe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ phonepe_details: phonepe })
      });
      
      toast({ title: "Saved", description: "Payment details updated successfully." });
      await refreshProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async () => {
    setSendingEmail(true);
    try {
      await resendVerification();
      toast({ title: "Email sent", description: "Check your inbox for the verification link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  if (!user || !userProfile) return <div className="p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Wallet</h1>
        <p className="text-muted-foreground">Manage your account and track lifetime progress.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Security / Verification */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Account Security</CardTitle>
            <CardDescription>Email verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-100 p-2 rounded-full">
                {isEmailVerified ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <MailWarning className="h-5 w-5 text-amber-500" />}
              </div>
              <div>
                <p className="font-medium text-sm">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {isEmailVerified ? "Verified" : "Unverified - Restricted Access"}
                </p>
              </div>
            </div>
            
            {!isEmailVerified && (
              <Button variant="outline" size="sm" onClick={handleResend} disabled={sendingEmail} className="w-full">
                {sendingEmail ? "Sending..." : "Resend Verification Email"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Payment Method
            </CardTitle>
            <CardDescription>Required to claim tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePhonePe} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phonepe">PhonePe Number or UPI ID</Label>
                <Input 
                  id="phonepe" 
                  value={phonepe} 
                  onChange={e => setPhonepe(e.target.value)} 
                  placeholder="e.g. 9876543210 or user@ybl"
                  required 
                />
              </div>
              <Button type="submit" disabled={saving || phonepe === userProfile.phonepe_details}>
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-4 rounded-full shadow-sm">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{userProfile.lifetime_reviews}</h3>
                  <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Lifetime Reviews</p>
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Current Streak</span>
                  <span className="font-bold text-primary">{userProfile.current_streak} / 10</span>
                </div>
                <div className="w-full bg-black/5 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(userProfile.current_streak / 10) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  ₹50 payout at 10 streak
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
