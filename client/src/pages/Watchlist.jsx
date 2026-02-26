import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWatchlist = () => {
    api.get("/watchlist")
      .then((res) => setWatchlist(res.data.watchlist))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWatchlist();
    api.get("/trade/symbols").then((res) => setSymbols(res.data.symbols));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError("");
    try {
      await api.post("/watchlist", { symbol: selected });
      setSelected("");
      fetchWatchlist();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add");
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
    } catch (err) {
      console.error(err);
    }
  };

  const watchedSymbols = new Set(watchlist.map((w) => w.symbol));
  const availableSymbols = symbols.filter((s) => !watchedSymbols.has(s));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Watchlist</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Track stocks you&apos;re interested in</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="dash-glass p-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Add Symbol
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-4 py-3 rounded-xl theme-input text-sm"
          >
            <option value="">Select a stock...</option>
            {availableSymbols.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selected}
          className="font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 text-white"
          style={{
            background: "var(--dash-gradient-1)",
            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)",
          }}
        >
          Add
        </button>
      </form>

      {error && (
        <div className="dash-glass px-4 py-3 rounded-xl text-sm" style={{ color: "var(--chart-red)" }}>
          {error}
        </div>
      )}

      {/* Watchlist */}
      <div className="dash-glass overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--dash-glass-border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Watching
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa" }}>
            {watchlist.length} stocks
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <div className="w-5 h-5 mx-auto rounded-full border-2 border-t-transparent animate-spin mb-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            Loading...
          </div>
        ) : watchlist.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "var(--text-muted)" }}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-sm">Your watchlist is empty</p>
            <p className="text-xs mt-1">Add some stocks to track above</p>
          </div>
        ) : (
          <div>
            {watchlist.map((item, i) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between transition-colors"
                style={{ borderBottom: i < watchlist.length - 1 ? "1px solid var(--dash-glass-border)" : "none" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--dash-receipt-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: `${COLORS[i % COLORS.length]}18`, color: COLORS[i % COLORS.length] }}
                  >
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {item.symbol}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price && (
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {formatMoney(item.price)}
                        </span>
                      )}
                      {item.changePercent !== undefined && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: item.changePercent >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: item.changePercent >= 0 ? "var(--chart-green)" : "var(--chart-red)",
                          }}
                        >
                          {item.changePercent >= 0 ? "+" : ""}{item.changePercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/trade?symbol=${item.symbol}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: "var(--accent)", background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    Trade
                  </Link>
                  <button
                    onClick={() => handleRemove(item.symbol)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: "var(--chart-red)", background: "rgba(239, 68, 68, 0.1)" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
