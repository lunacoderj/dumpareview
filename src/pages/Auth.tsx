import { useState } from "react";
import { Navigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { user, isAdmin, loading, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/tasks" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isReset) {
        await resetPassword(email);
        toast({ title: "Check your email", description: "Password reset link sent!" });
        setIsReset(false);
      } else if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCred.user);
        toast({ title: "Account created", description: "Please check your email to verify your account." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Successfully signed in." });
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Welcome!", description: "Successfully signed in with Google." });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-6xl font-bold tracking-tight mb-6">
            DumpA<span className="text-primary">Review</span>
          </h1>
          <p className="text-xl text-zinc-400 font-light leading-relaxed">
            Write reviews. Get paid. Join the gig economy platform where your opinion matters.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
        <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isReset ? "Reset Password" : isSignUp ? "Create an account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              {isReset 
                ? "Enter your email to reset your password" 
                : isSignUp 
                ? "Enter your details to get started" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!isReset && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsReset(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isReset ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              
              {!isReset && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                    Google
                  </Button>
                </>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            {isReset ? (
              <button
                type="button"
                onClick={() => setIsReset(false)}
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Back to login
              </button>
            ) : (
              <div className="text-sm text-zinc-500">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-primary hover:underline"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
