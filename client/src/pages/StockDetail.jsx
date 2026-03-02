import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../lib/api";

const STOCK_META = {
  AAPL: { name: "Apple Inc.", sector: "Technology" },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology" },
  MSFT: { name: "Microsoft Corp.", sector: "Technology" },
  AMZN: { name: "Amazon.com Inc.", sector: "Consumer" },
  TSLA: { name: "Tesla Inc.", sector: "Automotive" },
  META: { name: "Meta Platforms", sector: "Technology" },
  NVDA: { name: "NVIDIA Corp.", sector: "Technology" },
  NFLX: { name: "Netflix Inc.", sector: "Entertainment" },
  JPM: { name: "JPMorgan Chase", sector: "Finance" },
  V: { name: "Visa Inc.", sector: "Finance" },
  DIS: { name: "Walt Disney Co.", sector: "Entertainment" },
  BA: { name: "Boeing Co.", sector: "Industrial" },
  INTC: { name: "Intel Corp.", sector: "Technology" },
  AMD: { name: "AMD Inc.", sector: "Technology" },
  PYPL: { name: "PayPal Holdings", sector: "Finance" },
  UBER: { name: "Uber Technologies", sector: "Technology" },
  COIN: { name: "Coinbase Global", sector: "Finance" },
  SQ: { name: "Block Inc.", sector: "Finance" },
  SNAP: { name: "Snap Inc.", sector: "Technology" },
  PLTR: { name: "Palantir Tech.", sector: "Technology" },
};

const SECTOR_COLORS = {
  Technology: "#3b82f6",
  Finance: "#10b981",
  Consumer: "#f59e0b",
  Entertainment: "#ec4899",
  Automotive: "#ef4444",
  Industrial: "#8b5cf6",
};

const RANGES = [
  { label: "1W", days: 5 },
  { label: "1M", days: 22 },
  { label: "3M", days: 66 },
];

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function generateHistoricalData(currentPrice, symbol, days) {
  const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const startPrice = currentPrice * (1 + Math.sin(seed * 0.3) * 0.08);
  const data = [];
  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const progress = i / days;
    const s = seed + i * 11;
    const noise = (Math.sin(s * 3.7) * 0.006 + Math.cos(s * 1.3) * 0.004) * currentPrice;
    const trendPrice = startPrice + (currentPrice - startPrice) * progress;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(Math.max(trendPrice + noise, 1).toFixed(2)),
    });
  }
  data[data.length - 1].price = currentPrice;
  return data;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs shadow-lg"
      style={{
        background: "var(--dash-glass-bg)",
        border: "1px solid var(--dash-glass-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="mb-0.5" style={{ color: "var(--text-muted)" }}>{payload[0]?.payload?.date}</p>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{formatMoney(payload[0]?.value)}</p>
    </div>
  );
}

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const sym = symbol?.toUpperCase() ?? "";
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("1M");
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/trade/quote/${sym}`)
      .then((res) => { setQuote(res.data.quote); setLoading(false); })
      .catch(() => { setError("Stock not found"); setLoading(false); });
  }, [sym]);

  const days = useMemo(() => RANGES.find((r) => r.label === range)?.days ?? 22, [range]);
  const chartData = useMemo(() => {
    if (!quote) return [];
    return generateHistoricalData(quote.price, sym, days);
  }, [quote, sym, days]);

  const meta = STOCK_META[sym] || {};
  const sectorColor = SECTOR_COLORS[meta.sector] || "#64748b";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={() => navigate("/stocks")} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          ← Back to Stocks
        </button>
      </div>
    );
  }

  const isUp = quote ? quote.changePercent >= 0 : true;
  const chartColor = isUp ? "var(--chart-green)" : "var(--chart-red)";

  // Simulated 52W stats based on symbol seed
  const seed = sym.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const high52w = quote ? (quote.price * (1.18 + Math.abs(Math.sin(seed)) * 0.12)).toFixed(2) : 0;
  const low52w = quote ? (quote.price * (0.65 + Math.abs(Math.cos(seed)) * 0.10)).toFixed(2) : 0;
  const volume = Math.floor((5 + Math.abs(Math.sin(seed * 2)) * 15) * 1e6);
  const mktCap = quote ? ((quote.price * (1 + Math.abs(Math.cos(seed))) * 1e9) / 1e9).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate("/stocks")}
        className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
        style={{ color: "var(--text-muted)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Stocks
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="dash-glass h-28 shimmer rounded-2xl" />
          <div className="dash-glass h-72 shimmer rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dash-glass h-16 shimmer rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stock header */}
          <div className="dash-glass p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold"
                  style={{
                    background: `${sectorColor}18`,
                    color: sectorColor,
                    fontSize: sym.length <= 3 ? "13px" : "11px",
                  }}
                >
                  {sym}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className="text-2xl font-bold font-mono tracking-widest"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sym}
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${sectorColor}15`, color: sectorColor }}
                    >
                      {meta.sector || "Other"}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{meta.name || sym}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {formatMoney(quote.price)}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span
                      className="text-sm font-semibold px-2.5 py-0.5 rounded-lg"
                      style={{
                        background: isUp ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isUp ? "var(--chart-green)" : "var(--chart-red)",
                      }}
                    >
                      {isUp ? "+" : ""}{quote.changePercent}%
                    </span>
                    <span className="text-sm" style={{ color: isUp ? "var(--chart-green)" : "var(--chart-red)" }}>
                      {isUp ? "+" : ""}{formatMoney(quote.change)}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/trade?symbol=${sym}`}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Trade
                </Link>
              </div>
            </div>
          </div>

          {/* Price chart */}
          <div className="dash-glass p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Price Chart</h2>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRange(r.label)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={
                      range === r.label
                        ? { background: "var(--accent)", color: "white" }
                        : { background: "var(--dash-receipt-bg)", color: "var(--text-muted)" }
                    }
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${sym}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(Math.floor(chartData.length / 6), 1)}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#grad-${sym})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "52W High", value: formatMoney(parseFloat(high52w)) },
              { label: "52W Low", value: formatMoney(parseFloat(low52w)) },
              { label: "Volume", value: `${(volume / 1e6).toFixed(1)}M` },
              { label: "Market Cap", value: `$${mktCap}B` },
            ].map((stat) => (
              <div key={stat.label} className="dash-glass p-4">
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
