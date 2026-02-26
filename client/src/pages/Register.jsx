import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import EmojiCharacters from "../components/EmojiCharacters";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [scared, setScared] = useState(false);
  const scaredTimer = useRef(null);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const triggerScared = useCallback(() => {
    setScared(true);
    clearTimeout(scaredTimer.current);
    scaredTimer.current = setTimeout(() => setScared(false), 600);
  }, []);

  const handlePasswordKeyDown = useCallback(
    (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        triggerScared();
      }
    },
    [triggerScared]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex auth-bg">
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

      <div className="auth-blob" />

      {/* Left half - Characters */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center">
          <EmojiCharacters peeking={!passwordFocused} scared={scared} passwordFilled={password.length > 0 && passwordFocused} />
          <div className="mt-8">
            <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Join PaperTrade!
            </h2>
            <p className="mt-2 text-lg" style={{ color: "var(--text-secondary)" }}>
              Start your trading journey today
            </p>
          </div>
        </div>
      </div>

      {/* Right half - Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile characters */}
          <div className="lg:hidden flex justify-center mb-6">
            <EmojiCharacters peeking={!passwordFocused} scared={scared} passwordFilled={password.length > 0 && passwordFocused} />
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                PaperTrade
              </h1>
              <p className="mt-1" style={{ color: "var(--text-muted)" }}>
                Create your account
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
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl theme-input"
                  placeholder="johndoe"
                />
              </div>

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
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={handlePasswordKeyDown}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl theme-input"
                  placeholder="At least 6 characters"
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
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
