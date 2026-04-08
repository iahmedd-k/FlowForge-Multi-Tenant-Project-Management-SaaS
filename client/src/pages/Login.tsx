import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginApi } from "@/api/auth.api";
import { setAuth } from "@/store/authSlice";
import FlowForgeLogo from "@/components/branding/FlowForgeLogo";
import usePageMeta from "@/hooks/usePageMeta";

const Login = () => {
  usePageMeta("Log in | FlowForge", "Access your FlowForge workspace to manage tasks, projects, reports, and team collaboration.");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect to dashboard if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi({ email: email.trim(), password });
      const { user, workspace, workspaces, accessToken } = res.data.data;

      // Store token for API requests
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }

      dispatch(setAuth({ user, workspace: workspace || user?.workspaceId || null, workspaces }));

      const shouldSetup = user?.role === "owner" && workspace && !workspace.setupCompleted;
      navigate(shouldSetup ? "/workspace/setup" : "/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to log in right now.");
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

        <h1 className="mb-1 sm:mb-2 text-center font-display text-xl sm:text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mb-6 sm:mb-8 text-center text-xs sm:text-sm text-muted-foreground">Log in to your account</p>

        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs sm:text-sm font-medium text-foreground">Email</label>
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
                placeholder="********"
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="rounded border-input" /> <span>Remember me</span>
            </label>
            <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full gradient-cta py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
