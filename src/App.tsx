import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GenerateQR from "./pages/GenerateQR";
import ScanRedirect from "./pages/ScanRedirect";
import Analytics from "./pages/Analytics";
import QRDetail from "./pages/QRDetail";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </div>
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
            {/* Public scan page — minimal branding, no standard navbar/footer */}
            <Route path="/scan/:id" element={<ScanRedirect />} />
            
            {/* Auth page */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Public marketing & legal pages */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
            <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
            <Route path="/cookies" element={<AppLayout><CookiePolicy /></AppLayout>} />

            {/* Authenticated user routes */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/generate"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <GenerateQR />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/qr/:id"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <QRDetail />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            
            {/* 404 Route */}
            <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
