import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { QrCode, Chrome } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully signed in!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(175_60%_50%_/_0.3),_transparent_60%)]" />
        <div className="relative z-10 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm mb-8 animate-float">
            <QrCode className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Collect More<br />Google Reviews
          </h2>
          <p className="text-white/75 text-lg max-w-sm mx-auto leading-relaxed">
            Generate smart QR codes with pre-written messages. Make it effortless for customers to leave reviews.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[["100+", "Messages"], ["∞", "Scans"], ["0", "Setup Time"]].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-5 border border-white/20">
                <div className="text-2xl font-bold text-white">{val}</div>
                <div className="text-white/65 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-gradient shadow-primary">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-2xl text-gradient">QReview Pro</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to manage your QR codes and reviews</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-700 border border-border shadow-sm"
              variant="outline"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
              ) : (
                <Chrome className="h-5 w-5 mr-3 text-[#4285F4]" />
              )}
              Continue with Google
            </Button>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                Your Google account is used only for authentication.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={handleGoogleSignIn}
              className="text-primary font-medium hover:underline"
            >
              Sign up with Google
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
