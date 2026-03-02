import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import StripeWave from "../components/StripeWave";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex auth-bg relative overflow-hidden">
      {/* Stripe-style animated beam background */}
      <StripeWave isDark={theme === "dark"} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-xl glass-card hover:scale-105 transition-transform"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-primary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-primary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Left half - Title */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center px-8">
          <h1 className="interstellar-title">
            Paper<br />Trade
          </h1>
          <p className="mt-6 text-lg font-light tracking-wide" style={{ color: "var(--text-secondary)" }}>
            Your portfolio is waiting for you
          </p>
        </div>
      </div>

      {/* Right half - Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile title */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="interstellar-title" style={{ fontSize: "3rem" }}>
              Paper Trade
            </h1>
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <p style={{ color: "var(--text-muted)" }}>
                Sign in to your account
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl theme-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl theme-input"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/25"
                style={{ background: "var(--accent)" }}
                onMouseOver={(e) => (e.target.style.background = "var(--accent-hover)")}
                onMouseOut={(e) => (e.target.style.background = "var(--accent)")}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
