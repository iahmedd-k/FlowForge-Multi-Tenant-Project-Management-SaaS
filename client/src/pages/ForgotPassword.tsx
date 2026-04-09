import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { forgotPasswordApi } from "@/api/auth.api";
import FlowForgeLogo from "@/components/branding/FlowForgeLogo";
import usePageMeta from "@/hooks/usePageMeta";

const ForgotPassword = () => {
  usePageMeta("Forgot Password | FlowForge", "Reset your FlowForge password. Enter your email to receive a password reset link.");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error("Email is required");
      }

      await forgotPasswordApi({ email: normalizedEmail });
      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to process password reset request. Please try again.");
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

        <h1 className="mb-1 sm:mb-2 text-center font-display text-xl sm:text-2xl font-bold text-foreground">Reset your password</h1>
        <p className="mb-6 sm:mb-8 text-center text-xs sm:text-sm text-muted-foreground">
          {success 
            ? "Check your email for password reset instructions"
            : "Enter your email and we'll send you a link to reset your password"
          }
        </p>

        {!success ? (
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
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-medium">Email sent successfully</p>
            <p className="mt-1 text-xs">If an account exists with this email, you'll receive a password reset link shortly.</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
