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
      <h1 className="text-2xl font-bold text-white">Watchlist</h1>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex gap-3 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Add Symbol</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select a stock...</option>
            {availableSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
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
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Watchlist */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : watchlist.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Your watchlist is empty. Add some stocks to track.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30"
              >
                <div>
                  <span className="text-white font-semibold">{item.symbol}</span>
                  {item.price && (
                    <span className="ml-4 text-gray-300">{formatMoney(item.price)}</span>
                  )}
                  {item.changePercent !== undefined && (
                    <span
                      className={`ml-2 text-sm ${item.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {item.changePercent >= 0 ? "+" : ""}
                      {item.changePercent}%
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.symbol)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm"
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
