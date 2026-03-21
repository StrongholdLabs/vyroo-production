import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import * as Sentry from "@sentry/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";
import { CommandPalette } from "@/components/CommandPalette";
import { lazy, Suspense } from "react";

// Lazy-load all pages for optimal code splitting
const Index = lazy(() => import("./pages/Index.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const Connectors = lazy(() => import("./pages/Connectors.tsx"));
const Skills = lazy(() => import("./pages/Skills.tsx"));
const Plugins = lazy(() => import("./pages/Plugins.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Agents = lazy(() => import("./pages/Agents.tsx"));
const AgentConfig = lazy(() => import("./pages/AgentConfig.tsx"));
const AgentRun = lazy(() => import("./pages/AgentRun.tsx"));
const WorkflowEditor = lazy(() => import("./pages/WorkflowEditor.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));
const Features = lazy(() => import("./pages/Features.tsx"));
const SharedConversation = lazy(() => import("./pages/SharedConversation.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

// Use HashRouter in Electron (file:// protocol doesn't support pushState)
const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
const Router = isElectron ? HashRouter : BrowserRouter;

const SentryFallback = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6 text-center">
    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
    <p className="text-sm text-neutral-400 mb-6 max-w-md">
      An unexpected error occurred. Our team has been notified and is looking into it.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
    >
      Reload
    </button>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryFallback />}>
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard/:conversationId?"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skills"
                element={
                  <ProtectedRoute>
                    <Skills />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connectors"
                element={
                  <ProtectedRoute>
                    <Connectors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins"
                element={
                  <ProtectedRoute>
                    <Plugins />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <ProtectedRoute>
                    <Agents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/configure/:templateId"
                element={
                  <ProtectedRoute>
                    <AgentConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/run/:runId"
                element={
                  <ProtectedRoute>
                    <AgentRun />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/workflow/:workflowId?"
                element={
                  <ProtectedRoute>
                    <WorkflowEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/share/:shareId" element={<SharedConversation />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CookieConsent />
            <CommandPalette />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  </Sentry.ErrorBoundary>
);

export default App;
