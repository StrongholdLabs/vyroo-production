import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

// Use HashRouter in Electron (file:// protocol doesn't support pushState)
const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
const Router = isElectron ? HashRouter : BrowserRouter;

const App = () => (
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
              <Route path="/pricing" element={<Pricing />} />
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
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
