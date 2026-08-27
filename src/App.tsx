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
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { Loader2, AlertTriangle } from "lucide-react";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30_000,
    },
  },
});

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorObj,
    refetch: refetchProfile,
  } = useUserProfile();
  const {
    data: orgs = [],
    isLoading: orgsLoading,
    isError: orgsError,
    error: orgsErrorObj,
    refetch: refetchOrgs,
  } = useMyOrgs();

  if (profileLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  // A failed fetch (network blip, cold-started backend, expired session refresh)
  // must NEVER be treated as "no profile / no orgs" — that misread is what sends
  // an already-onboarded user back into the onboarding wizard and, from there,
  // risks creating a duplicate organization. Surface a retry screen instead.
  if (profileError || orgsError) {
    console.error('OnboardingGuard: failed to load profile/orgs', profileErrorObj || orgsErrorObj);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <AlertTriangle className="h-8 w-8" style={{ color: 'var(--pb-gold)' }} />
          <p style={{ color: 'var(--pb-text)' }}>
            Couldn't load your workspace. This is usually a temporary connection issue.
          </p>
          <button
            onClick={() => { refetchProfile(); refetchOrgs(); }}
            className="px-4 py-2 rounded-md font-medium"
            style={{ background: 'var(--pb-gold)', color: 'var(--pb-text)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only reached once both queries have SUCCEEDED — this is genuinely new-user state.
  // Send to onboarding if: no profile, onboarding not completed, or no orgs yet
  if (!profile || !profile.onboarding_completed || orgs.length === 0) {
    if (window.location.pathname === '/onboarding') return <>{children}</>;
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();
  useInactivityTimeout(!!session);

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
      <BrowserRouter>
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
