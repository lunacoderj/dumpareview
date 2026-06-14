import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/AdminRoute";
import { UserRoute } from "@/components/UserRoute";
import Navbar from "@/components/Navbar";

// Auth
import Auth from "./pages/Auth";

// User Pages
import ActiveTasks from "./pages/ActiveTasks";
import IssuedView from "./pages/IssuedView";
import PayoutStatus from "./pages/PayoutStatus";
import UserProfile from "./pages/UserProfile";

// Admin Pages
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminQueue from "./pages/admin/AdminQueue";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminProofs from "./pages/admin/AdminProofs";

import Home from "./pages/Home";
import Landing from "./pages/Landing";
import PublicReview from "./pages/PublicReview";
import NotFound from "./pages/NotFound";
import AdminWallOfFame from "./pages/admin/AdminWallOfFame";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Root Route handles both Landing and User Dashboard */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            
            {/* Public Review Route (No Auth Required) */}
            <Route path="/review/:campaignId" element={<AppLayout><PublicReview /></AppLayout>} />
            
            {/* User Routes */}
            <Route path="/tasks" element={<AppLayout><UserRoute><Home /></UserRoute></AppLayout>} />
            <Route path="/issued" element={<AppLayout><UserRoute><IssuedView /></UserRoute></AppLayout>} />
            <Route path="/payout" element={<AppLayout><UserRoute><PayoutStatus /></UserRoute></AppLayout>} />
            
            {/* Profile doesn't require verification or PhonePe to be set yet */}
            <Route path="/profile" element={<AppLayout><UserRoute requirePhonePe={false} requireVerified={false}><UserProfile /></UserRoute></AppLayout>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AppLayout><AdminRoute><AdminCampaigns /></AdminRoute></AppLayout>} />
            <Route path="/admin/queue" element={<AppLayout><AdminRoute><AdminQueue /></AdminRoute></AppLayout>} />
            <Route path="/admin/audit" element={<AppLayout><AdminRoute><AdminAudit /></AdminRoute></AppLayout>} />
            <Route path="/admin/proofs" element={<AppLayout><AdminRoute><AdminProofs /></AdminRoute></AppLayout>} />
            <Route path="/admin/wall-of-fame" element={<AppLayout><AdminRoute><AdminWallOfFame /></AdminRoute></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><AdminRoute><AdminUsers /></AdminRoute></AppLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
