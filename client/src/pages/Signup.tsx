import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { registerApi } from "@/api/auth.api";
import { setAuth } from "@/store/authSlice";
import FlowForgeLogo from "@/components/branding/FlowForgeLogo";
import usePageMeta from "@/hooks/usePageMeta";

const Signup = () => {
  usePageMeta("Sign up | FlowForge", "Create your FlowForge account and set up your workspace for projects, tasks, reporting, and automations.");
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect to dashboard if token exists (check only once on mount)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, []); // Empty deps - runs only on mount

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const name = `${firstName} ${lastName}`.trim();

    try {
      const res = await registerApi({
        name,
        email: email.trim(),
        password,
      });

      const { user, workspace, workspaces, accessToken, refreshToken } = res.data.data;
      
      // Store tokens
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      dispatch(setAuth({ user, workspace: workspace || user?.workspaceId || null, workspaces }));
      
      // Skip setup page if workspace is already set up
      const shouldSkipSetup = workspace?.setupCompleted;
      navigate(shouldSkipSetup ? "/dashboard" : "/workspace/setup", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-3 sm:px-4 py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-elevated"
      >
        <div className="mb-6 flex justify-center sm:mb-8">
          <FlowForgeLogo to="/" compact />
        </div>

        <h1 className="mb-1 sm:mb-2 text-center font-display text-xl sm:text-2xl font-bold text-foreground">Get started free</h1>
        <p className="mb-6 sm:mb-8 text-center text-xs sm:text-sm text-muted-foreground">Create your account in seconds</p>

        <button
          type="button"
          onClick={() => {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google-callback`);
            const scope = encodeURIComponent('profile email');
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
          }}
          className="w-full mb-4 rounded-full border border-input bg-background hover:bg-muted py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold text-foreground shadow-soft transition-all hover:shadow-elevated flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
          </div>
        </div>

        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="first" className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground">First name</label>
              <input
                id="first"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="John"
                className="w-full rounded-lg border border-input bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>
            <div>
              <label htmlFor="last" className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground">Last name</label>
              <input
                id="last"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Doe"
                className="w-full rounded-lg border border-input bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8+ characters"
                className="w-full rounded-lg border border-input bg-background px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-600">
              <p>{error}</p>
              {error.includes('pending workspace invitation') && (
                <p className="mt-2 text-xs">
                  Check your email for an invitation link from your workspace admin.
                </p>
              )}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full gradient-cta py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Get Started"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <a href="#" className="underline">Terms</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </form>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
