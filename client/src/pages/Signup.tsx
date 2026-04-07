import { useState } from "react";
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

      const { user, workspace, workspaces } = res.data.data;
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
