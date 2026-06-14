import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";
import ActiveTasks from "./ActiveTasks";
import WallOfFameSection from "@/components/WallOfFameSection";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { requestNotificationPermission, setupForegroundMessageListener } from "@/lib/notifications";
import { toast } from "sonner";

export default function Home() {
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (user && !isAdmin) {
      requestNotificationPermission();

      let unsubscribe: (() => void) | undefined;
      setupForegroundMessageListener((payload) => {
        const title = payload?.notification?.title || "Notification";
        const body = payload?.notification?.body || "You have a new message.";
        toast.info(title, {
          description: body,
        });
      }).then(unsub => {
        unsubscribe = unsub;
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, isAdmin]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!user) {
    return <Landing />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1">
        <ActiveTasks />
      </div>
      <div className="border-t border-border/40 bg-secondary/10">
        <WallOfFameSection />
      </div>
    </div>
  );
}
