import { useState, useEffect } from "react";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWatchlist = () => {
    api
      .get("/watchlist")
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
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Watchlist</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="theme-card p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Add Symbol
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg theme-input"
          >
            <option value="">Select a stock...</option>
            {availableSymbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selected}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          Add
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Watchlist */}
      <div className="theme-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : watchlist.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Your watchlist is empty. Add some stocks to track.
          </div>
        ) : (
          <div>
            {watchlist.map((item, i) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                style={{
                  borderBottom: i < watchlist.length - 1 ? "1px solid var(--border-light)" : "none",
                }}
              >
                <div>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.symbol}
                  </span>
                  {item.price && (
                    <span className="ml-4" style={{ color: "var(--text-secondary)" }}>
                      {formatMoney(item.price)}
                    </span>
                  )}
                  {item.changePercent !== undefined && (
                    <span className={`ml-2 text-sm ${item.changePercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {item.changePercent >= 0 ? "+" : ""}
                      {item.changePercent}%
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.symbol)}
                  className="text-sm transition-colors hover:text-red-400"
                  style={{ color: "var(--text-muted)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
