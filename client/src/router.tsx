/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './components/ui/Spinner.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import InvitePage from './pages/auth/InvitePage.jsx';
import AcceptInvitePage from './pages/auth/AcceptInvitePage.jsx';
import Dashboard from './pages/app/Dashboard.jsx';
import Calendar from './pages/app/Calendar.jsx';
import Projects from './pages/app/Projects.jsx';
import ProjectSetup from './pages/app/ProjectSetup.jsx';
import Reports from './pages/app/Reports.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import Settings from './pages/app/Settings.jsx';
import Landing from './pages/landing.jsx';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <FullScreenSpinner />;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
}

function InviteTokenRedirect({ fallback = '/auth' }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return <Navigate to={fallback} replace />;
  }

  return <Navigate to={`/invite/setup?token=${encodeURIComponent(token)}`} replace />;
}

function PublicAuthEntry() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <Navigate to={`/invite/setup?token=${encodeURIComponent(token)}`} replace />;
  }

  return (
    <PublicOnly>
      <AuthPage />
    </PublicOnly>
  );
}

function RequireWorkspaceSetup({ children }) {
  const { user, workspace, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const currentPath = location.pathname;
  const isSetupRoute = currentPath === '/workspace/setup' || currentPath === '/projects/setup';

  if (loading) {
    return <FullScreenSpinner />;
  }

  const shouldPromptForSetup = Boolean(
    user &&
    workspace &&
    user.role === 'owner' &&
    !workspace.setupCompleted
  );
  const isSetupComplete = Boolean(workspace?.setupCompleted);

  if (shouldPromptForSetup && !isSetupRoute) {
    return <Navigate to="/workspace/setup" replace />;
  }

  if ((!shouldPromptForSetup || isSetupComplete) && isSetupRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RequireOwner({ children }) {
  const { user, workspace, loading } = useSelector((state) => state.auth);
  const activeWorkspaceId = workspace?._id || user?.workspaceId || null;
  const workspaces = useSelector((state) => state.auth.workspaces);
  const activeWorkspaceEntry = workspaces?.find(
    (entry) => String(entry.workspace?._id || '') === String(activeWorkspaceId || '')
  );
  const currentRole = activeWorkspaceEntry?.role || user?.role || 'member';

  if (loading) {
    return <FullScreenSpinner />;
  }

  if (currentRole !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RequireManager({ children }) {
  const { user, workspace, loading } = useSelector((state) => state.auth);
  const activeWorkspaceId = workspace?._id || user?.workspaceId || null;
  const workspaces = useSelector((state) => state.auth.workspaces);
  const activeWorkspaceEntry = workspaces?.find(
    (entry) => String(entry.workspace?._id || '') === String(activeWorkspaceId || '')
  );
  const currentRole = activeWorkspaceEntry?.role || user?.role || 'member';

  if (loading) {
    return <FullScreenSpinner />;
  }

  if (!['owner', 'admin'].includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth',
    element: <PublicAuthEntry />,
  },
  {
    path: '/login',
    element: <Navigate to="/auth" replace />,
  },
  {
    path: '/signup',
    element: <PublicAuthEntry />,
  },
  {
    path: '/invite',
    element: <InvitePage />,
  },
  {
    path: '/auth/invite',
    element: <InvitePage />,
  },
  {
    path: '/accept-invite',
    element: <InviteTokenRedirect fallback="/invite" />,
  },
  {
    path: '/invite/accept',
    element: <InviteTokenRedirect fallback="/invite" />,
  },
  {
    path: '/invite/setup',
    element: <AcceptInvitePage />,
  },
  {
    path: '/auth/invite/setup',
    element: <AcceptInvitePage />,
  },
  {
    path: '/accept-invite/setup',
    element: <AcceptInvitePage />,
  },
  {
    path: '/auth/invite/accept',
    element: <InviteTokenRedirect fallback="/auth" />,
  },
  {
    path: '/workspace/setup',
    element: (
      <Protected>
        <RequireWorkspaceSetup>
          <ProjectSetup />
        </RequireWorkspaceSetup>
      </Protected>
    ),
  },
  {
    path: '/projects/setup',
    element: <Navigate to="/workspace/setup" replace />,
  },
  {
    element: (
      <Protected>
        <RequireWorkspaceSetup>
          <AppLayout />
        </RequireWorkspaceSetup>
      </Protected>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/:id', element: <Projects /> },
      { path: '/calendar', element: <Calendar /> },
      { path: '/reports', element: <RequireManager><Reports /></RequireManager> },
      { path: '/profile', element: <Navigate to="/settings" replace /> },
      { path: '/billing', element: <RequireOwner><SubscriptionPage /></RequireOwner> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  {
    path: '/app',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/app/*',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
