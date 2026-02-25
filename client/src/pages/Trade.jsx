import { useState, useEffect } from "react";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Trade() {
  const [symbols, setSymbols] = useState([]);
  const [symbol, setSymbol] = useState("");
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
    if (!symbol) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/trade/quote/${symbol}`)
        .then((res) => setQuote(res.data.quote))
        .catch(() => setQuote(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post(`/trade/${action}`, {
        symbol,
        quantity: parseInt(quantity, 10),
      });
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
      <h1 className="text-2xl font-bold text-white">Trade</h1>

      {/* Trade Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5"
      >
        {/* Buy / Sell Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAction("buy")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              action === "buy"
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setAction("sell")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              action === "sell"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Symbol Select */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select a stock...</option>
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Quote Display */}
        {quote && (
          <div className="bg-gray-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-white font-semibold text-lg">{quote.symbol}</span>
              <span className={`ml-3 text-sm ${quote.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {quote.change >= 0 ? "+" : ""}{quote.change} ({quote.changePercent}%)
              </span>
            </div>
            <span className="text-white text-xl font-bold">{formatMoney(quote.price)}</span>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Number of shares"
          />
        </div>

        {/* Estimated Total */}
        {estimatedTotal > 0 && (
          <div className="text-right text-gray-400 text-sm">
            Estimated total: <span className="text-white font-medium">{formatMoney(estimatedTotal)}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !symbol || !quantity}
          className={`w-full font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-white ${
            action === "buy"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Processing..."
            : `${action === "buy" ? "Buy" : "Sell"} ${symbol || "Stock"}`}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-emerald-400 mb-3">Trade Executed</h3>
          <div className="space-y-2 text-sm">
            <Row label="Action" value={result.transaction.type} />
            <Row label="Symbol" value={result.transaction.symbol} />
            <Row label="Quantity" value={result.transaction.quantity} />
            <Row label="Price Per Share" value={formatMoney(result.transaction.pricePerShare)} />
            <Row label="Total" value={formatMoney(result.transaction.totalAmount)} />
            <Row label="New Balance" value={formatMoney(result.balance)} />
            {result.profitLoss && (
              <Row
                label="Profit/Loss"
                value={formatMoney(result.profitLoss.total)}
                valueClass={result.profitLoss.total >= 0 ? "text-emerald-400" : "text-red-400"}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = "text-white" }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
