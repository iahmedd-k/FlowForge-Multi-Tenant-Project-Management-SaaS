import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth } from '@/store/authSlice';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code) {
          const errorParam = searchParams.get('error');
          if (errorParam === 'access_denied') {
            setError('You cancelled the Google sign-in. Please try again.');
          } else {
            setError('No authorization code received from Google.');
          }
          setLoading(false);
          return;
        }

        // Exchange code for tokens via your backend
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${backendUrl}/auth/google/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with Google');
        }

        const data = await response.json();
        const { user, workspace, workspaces, accessToken } = data.data;

        // Store token
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }

        // Dispatch auth state
        dispatch(setAuth({ user, workspace: workspace || user?.workspaceId || null, workspaces }));

        // Redirect - show setup for new users (if no workspace or not yet set up)
        const shouldSkipSetup = workspace?.setupCompleted;
        navigate(shouldSkipSetup ? '/dashboard' : '/workspace/setup', { replace: true });
      } catch (err: any) {
        console.error('Google auth callback error:', err);
        setError(err.message || 'Failed to authenticate. Please try again.');
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-lg font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallback;
