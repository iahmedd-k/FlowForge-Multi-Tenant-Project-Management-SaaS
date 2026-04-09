import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/Dashboard Components/layout/AppLayout.jsx";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import GoogleCallback from "./pages/auth/GoogleCallback.tsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Projects from "./pages/Dashboard/Projects.jsx";
import Calendar from "./pages/Dashboard/Calendar.jsx";
import Reports from "./pages/Dashboard/Reports.jsx";
import Billing from "./pages/Dashboard/Billing.jsx";
import Settings from "./pages/Dashboard/Settings.jsx";
import ProjectSetup from "./pages/Dashboard/ProjectSetup.jsx";
import TeamInvite from "./pages/Dashboard/TeamInvite.tsx";
import InvitePage from "./pages/Dashboard/InvitePage.jsx";
import AcceptInvitePage from "./pages/Dashboard/AcceptInvitePage.jsx";
import ProductPage from "./pages/ProductPage.tsx";
import AIPage from "./pages/AIPage.tsx";
import SolutionPage from "./pages/SolutionPage.tsx";
import ResourcePage from "./pages/ResourcePage.tsx";
import FeaturesPage from "./pages/FeaturesPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import HelpCenterPage from "./pages/HelpCenterPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import EnterprisePage from "./pages/EnterprisePage.tsx";
import DocsPage from "./pages/DocsPage.tsx";
import GenericPage from "./pages/GenericPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { getMeApi } from "./api/auth.api";
import { setAuth, clearAuth } from "./store/authSlice";

const queryClient = new QueryClient();
const LEGACY_REDIRECTS = [
  { path: "/auth", to: "/login" },
  { path: "/auth/invite", to: "/invite" },
  { path: "/auth/invite/setup", to: "/invite/setup" },
];

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 border-4 border-[#e0e0e0] border-t-[#0073ea] rounded-full animate-spin"></div>
      <p className="text-sm text-[#6c7898]">Loading...</p>
    </div>
  </div>
);

const getActiveRole = (authState: any) => {
  const { user, workspace, workspaces } = authState;
  const activeWorkspaceId = workspace?._id || user?.workspaceId || null;
  const activeWorkspaceEntry = workspaces?.find(
    (entry: any) => String(entry.workspace?._id || "") === String(activeWorkspaceId || "")
  );
  return activeWorkspaceEntry?.role || user?.role || "member";
};

const getPostLoginPath = (authState: any) => {
  const { user, workspace } = authState;
  const role = getActiveRole(authState);
  const shouldSetup = Boolean(
    user &&
    workspace &&
    role === "owner" &&
    !workspace.setupCompleted
  );

  return shouldSetup ? "/workspace/setup" : "/dashboard";
};

const ProtectedDashboardRoutes = () => {
  const authState = useSelector((state: any) => state.auth);
  const { user, loading } = authState;

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoutes = () => {
  const authState = useSelector((state: any) => state.auth);
  const { user, loading } = authState;

  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to={getPostLoginPath(authState)} replace />;
  }

  return <Outlet />;
};

const RequireOwner = () => {
  const authState = useSelector((state: any) => state.auth);
  const { loading } = authState;

  if (loading) {
    return <FullScreenLoader />;
  }

  if (getActiveRole(authState) !== "owner") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const RequireManager = () => {
  const authState = useSelector((state: any) => state.auth);
  const { loading } = authState;
  const currentRole = getActiveRole(authState);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!["owner", "admin"].includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const RequireInitialSetup = () => {
  const authState = useSelector((state: any) => state.auth);
  const { user, workspace, loading } = authState;
  const location = useLocation();
  const currentRole = getActiveRole(authState);
  const isDuringSetup = Boolean(
    user &&
    workspace &&
    currentRole === "owner" &&
    !workspace.setupCompleted
  );

  if (loading) {
    return <FullScreenLoader />;
  }

  // Only allow access to team-invite during initial setup
  if (!isDuringSetup && location.pathname === "/workspace/team-invite") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const RequireWorkspaceSetup = () => {
  const authState = useSelector((state: any) => state.auth);
  const { user, workspace, loading } = authState;
  const location = useLocation();
  const currentRole = getActiveRole(authState);
  
  // Show setup page if:
  // - User is logged in AND
  // - (Workspace is null OR workspace setup is not completed) AND
  // - Current role is owner
  const shouldAllowSetup = Boolean(
    user &&
    (workspace === null || !workspace.setupCompleted) &&
    currentRole === "owner"
  );

  if (loading) {
    return <FullScreenLoader />;
  }

  if (shouldAllowSetup && location.pathname !== "/workspace/setup") {
    return <Navigate to="/workspace/setup" replace />;
  }

  if (!shouldAllowSetup && location.pathname === "/workspace/setup") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: any) => state.auth);

  useEffect(() => {
    // Initialize auth only once when component mounts (check if we have a token but no user in Redux)
    const hasToken = localStorage.getItem('accessToken');
    const shouldInitialize = hasToken && !user && loading;

    if (shouldInitialize) {
      const initializeAuth = async () => {
        try {
          const response = await getMeApi();
          if (response.data?.data && response.data.data.user) {
            dispatch(setAuth(response.data.data));
          } else {
            localStorage.removeItem('accessToken');
            dispatch(clearAuth());
          }
        } catch (error) {
          // Token is invalid or expired, clear auth
          localStorage.removeItem('accessToken');
          dispatch(clearAuth());
        }
      };

      initializeAuth();
    } else if (!hasToken && loading) {
      // No token, clear auth state
      dispatch(clearAuth());
    }
  }, []); // Empty dependency - runs only once on mount

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2a44',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppInitializer>
          <Routes>
            {/* Legacy redirects */}
            {LEGACY_REDIRECTS.map(({ path, to }) => (
              <Route key={path} path={path} element={<Navigate to={to} replace />} />
            ))}

            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route element={<PublicOnlyRoutes />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="/auth/google-callback" element={<GoogleCallback />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/invite/setup" element={<AcceptInvitePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/ai/:slug" element={<AIPage />} />
            <Route path="/solutions/:slug" element={<SolutionPage />} />
            <Route path="/resources/:slug" element={<ResourcePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/api-docs" element={<DocsPage />} />
            <Route path="/guides" element={<DocsPage />} />
            <Route path="/press" element={<GenericPage />} />
            <Route path="/privacy" element={<GenericPage />} />
            <Route path="/terms" element={<GenericPage />} />
            <Route path="/cookies" element={<GenericPage />} />

            {/* Protected app routes */}
            <Route element={<ProtectedDashboardRoutes />}>
              <Route element={<RequireWorkspaceSetup />}>
                <Route element={<RequireOwner />}>
                  <Route path="/workspace/setup" element={<ProjectSetup />} />
                </Route>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:projectId" element={<Projects />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/profile" element={<Navigate to="/settings" replace />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/automations" element={<Navigate to="/dashboard?automations=1" replace />} />
                  <Route element={<RequireManager />}>
                    <Route path="/reports" element={<Reports />} />
                  </Route>
                  <Route element={<RequireOwner />}>
                    <Route path="/billing" element={<Billing />} />
                  </Route>
                </Route>
              </Route>
              <Route element={<RequireInitialSetup />}>
                <Route element={<RequireManager />}>
                  <Route path="/workspace/team-invite" element={<TeamInvite />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
