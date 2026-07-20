import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GenerateQR from "./pages/GenerateQR";
import ScanRedirect from "./pages/ScanRedirect";
import Analytics from "./pages/Analytics";
import QRDetail from "./pages/QRDetail";
import NotFound from "./pages/NotFound";

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
            {/* Public scan page — no navbar */}
            <Route path="/scan/:id" element={<ScanRedirect />} />
            {/* Auth page — no navbar */}
            <Route path="/auth" element={<Auth />} />
            {/* Pages with navbar */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
