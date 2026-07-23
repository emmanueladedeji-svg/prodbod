import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMyOrgs } from "@/hooks/useProdbodOrgs";
import { Loader2 } from "lucide-react";

import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import ProductProfile from "./pages/ProductProfile";
import Vision from "./pages/Vision";
import BusinessObjectives from "./pages/BusinessObjectives";
import Strategies from "./pages/Strategies";
import ProductObjectives from "./pages/ProductObjectives";
import Features from "./pages/Features";
import Tasks from "./pages/Tasks";
import FeedbackPage from "./pages/Feedback";
import Releases from "./pages/Releases";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProductWorkspace from "./pages/ProductWorkspace";

const queryClient = new QueryClient();

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: orgs = [], isLoading: orgsLoading } = useMyOrgs();

  if (profileLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  // Needs onboarding if: no profile yet, OR onboarding not explicitly completed.
  // If they've completed onboarding but have no orgs, they'll see an empty state in the app 
  // rather than being forced to create a NEW organization.
  if (!profileLoading && !orgsLoading) {
    if (!profile || !profile.onboarding_completed) {
      // If we are already on onboarding page, don't redirect
      if (window.location.pathname === '/onboarding') return <>{children}</>;
      return <Navigate to="/onboarding" replace />;
    }
  }
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      {/* Onboarding — shown before workspace is set up */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* App — only after onboarding is complete */}
      <Route
        path="/*"
        element={
          <OnboardingGuard>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/people" element={<People />} />
                <Route path="/product-profile" element={<ProductProfile />} />
                <Route path="/vision" element={<Vision />} />
                <Route path="/business-objectives" element={<BusinessObjectives />} />
                <Route path="/strategies" element={<Strategies />} />
                <Route path="/product-objectives" element={<ProductObjectives />} />
                <Route path="/features" element={<Features />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/settings" element={<Settings />} />
                {/* Product workspace routes */}
                <Route path="/products/:productId" element={<ProductWorkspace />} />
                <Route path="/products/:productId/:listId" element={<ProductWorkspace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </OnboardingGuard>
        }
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite" element={<AcceptInvite />} />
            {/* Protected routes */}
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
