import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Trade() {
  const [searchParams] = useSearchParams();
  const [symbols, setSymbols] = useState([]);
  const [symbol, setSymbol] = useState(searchParams.get("symbol") || "");
  const [quantity, setQuantity] = useState("");
  const [quote, setQuote] = useState(null);
  const [action, setAction] = useState("buy");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/trade/symbols").then((res) => setSymbols(res.data.symbols));
  }, []);

  useEffect(() => {
    if (!symbol) { setQuote(null); return; }
    const timer = setTimeout(() => {
      api.get(`/trade/quote/${symbol}`).then((res) => setQuote(res.data.quote)).catch(() => setQuote(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post(`/trade/${action}`, { symbol, quantity: parseInt(quantity, 10) });
      setResult(res.data);
      setQuantity("");
    } catch (err) {
      setError(err.response?.data?.error || "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = quote && quantity ? (quote.price * parseInt(quantity, 10) || 0) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Trade</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Execute buy and sell orders</p>
      </div>

      {/* Trade Form */}
      <form onSubmit={handleSubmit} className="dash-glass p-6 space-y-5">
        {/* Buy / Sell Toggle */}
        <div className="flex rounded-xl p-1" style={{ background: "var(--dash-receipt-bg)" }}>
          <button
            type="button"
            onClick={() => setAction("buy")}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={action === "buy" ? {
              background: "var(--dash-gradient-1)",
              color: "white",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
            } : { color: "var(--text-secondary)" }}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setAction("sell")}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={action === "sell" ? {
              background: "var(--dash-gradient-2)",
              color: "white",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
            } : { color: "var(--text-secondary)" }}
          >
            Sell
          </button>
        </div>

        {/* Symbol Select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Symbol
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl theme-input text-sm"
          >
            <option value="">Select a stock...</option>
            {symbols.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        {/* Quote Display */}
        {quote && (
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--dash-receipt-bg)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{
                  background: quote.change >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  color: quote.change >= 0 ? "var(--chart-green)" : "var(--chart-red)",
                }}
              >
                {quote.symbol.slice(0, 2)}
              </div>
              <div>
                <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>{quote.symbol}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: quote.change >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: quote.change >= 0 ? "var(--chart-green)" : "var(--chart-red)",
                    }}
                  >
                    {quote.change >= 0 ? "+" : ""}{quote.changePercent}%
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {quote.change >= 0 ? "+" : ""}{formatMoney(quote.change)}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{formatMoney(quote.price)}</span>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Quantity
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl theme-input text-sm"
            placeholder="Number of shares"
          />
        </div>

        {/* Estimated Total */}
        {estimatedTotal > 0 && (
          <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: "var(--dash-receipt-bg)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Estimated total</span>
            <span className="text-lg font-bold gradient-text" style={{ backgroundImage: action === "buy" ? "var(--dash-gradient-1)" : "var(--dash-gradient-2)" }}>
              {formatMoney(estimatedTotal)}
            </span>
          </div>
        )}

        {error && (
          <div className="dash-glass px-4 py-3 rounded-xl text-sm" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--chart-red)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !symbol || !quantity}
          className="w-full font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 text-white"
          style={{
            background: action === "buy" ? "var(--dash-gradient-1)" : "var(--dash-gradient-2)",
            boxShadow: action === "buy" ? "0 4px 20px rgba(16, 185, 129, 0.3)" : "0 4px 20px rgba(239, 68, 68, 0.3)",
          }}
        >
          {loading ? "Processing..." : `${action === "buy" ? "Buy" : "Sell"} ${symbol || "Stock"}`}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="dash-glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--chart-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--chart-green)" }}>Trade Executed</h3>
          </div>
          <div className="space-y-3">
            {[
              ["Action", result.transaction.type],
              ["Symbol", result.transaction.symbol],
              ["Quantity", result.transaction.quantity],
              ["Price Per Share", formatMoney(result.transaction.pricePerShare)],
              ["Total", formatMoney(result.transaction.totalAmount)],
              ["New Balance", formatMoney(result.balance)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid var(--dash-glass-border)" }}>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
            {result.profitLoss && (
              <div className="flex justify-between items-center py-1">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Profit/Loss</span>
                <span className="text-sm font-semibold" style={{ color: result.profitLoss.total >= 0 ? "var(--chart-green)" : "var(--chart-red)" }}>
                  {formatMoney(result.profitLoss.total)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
