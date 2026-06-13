import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function UserRoute({ children, requireVerified = true, requirePhonePe = true }: { children: React.ReactNode, requireVerified?: boolean, requirePhonePe?: boolean }) {
  const { user, loading, isAdmin, isEmailVerified, hasPhonePeDetails } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requireVerified && !isEmailVerified) {
    return <Navigate to="/profile" replace />;
  }

  if (requirePhonePe && !hasPhonePeDetails) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
