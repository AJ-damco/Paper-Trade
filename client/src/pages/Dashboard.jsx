import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatCompact(n) {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      notation: "compact", maximumFractionDigits: 1,
    }).format(n);
  }
  return formatMoney(n);
}

// Generate simulated weekly chart data from positions
function generateWeeklyData(positions) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const dayOfWeek = today.getDay();

  return days.map((day, i) => {
    const seed = (i + 1) * 17 + (positions?.length || 0) * 7;
    const totalInvested = positions?.reduce((sum, p) => sum + p.costBasis, 0) || 10000;
    const maxSwing = totalInvested * 0.03;
    const value = Math.sin(seed) * maxSwing + Math.cos(seed * 0.7) * maxSwing * 0.5;
    const isFuture = i > ((dayOfWeek + 6) % 7);
    return { day, value: isFuture ? 0 : parseFloat(value.toFixed(2)), isFuture };
  });
}

function getDateRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

function RoundedBar(props) {
  const { x, y, width, height, value, index } = props;
  if (!height || height === 0) return null;
  const h = Math.abs(height);
  const radius = Math.min(6, width / 2, h / 2);
  const isPositive = value >= 0;
  // Recharts passes negative height for negative-value bars.
  // y points to the bottom of the bar; shift up so rect starts at zero line.
  const barY = height < 0 ? y + height : y;
  return (
    <g>
      <defs>
        <linearGradient id={`bar-grad-${index}-${isPositive ? "green" : "red"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? "#34d399" : "#f87171"} stopOpacity={0.9} />
          <stop offset="100%" stopColor={isPositive ? "#059669" : "#dc2626"} stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <rect
        x={x} y={barY} width={width} height={h}
        rx={radius} ry={radius}
        fill={`url(#bar-grad-${index}-${isPositive ? "green" : "red"})`}
        style={{ filter: `drop-shadow(0 0 6px ${isPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"})` }}
      />
    </g>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const isPositive = val >= 0;
  return (
    <div style={{
      background: "rgba(22, 22, 30, 0.9)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
      padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
      <p style={{ color: isPositive ? "#34d399" : "#f87171", fontSize: "16px", fontWeight: 700 }}>
        {isPositive ? "+" : ""}{formatMoney(val)}
      </p>
    </div>
  );
}

const STOCK_META = {
  AAPL: "Apple", GOOGL: "Alphabet", MSFT: "Microsoft", AMZN: "Amazon",
  TSLA: "Tesla", META: "Meta", NVDA: "NVIDIA", NFLX: "Netflix",
  JPM: "JPMorgan", V: "Visa", DIS: "Disney", BA: "Boeing",
  INTC: "Intel", AMD: "AMD", PYPL: "PayPal", UBER: "Uber",
  COIN: "Coinbase", SQ: "Block", SNAP: "Snap", PLTR: "Palantir",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Stock search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allSymbols, setAllSymbols] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/portfolio"),
      api.get("/trade/history?limit=6"),
      api.get("/trade/symbols"),
    ])
      .then(([portfolioRes, historyRes, symbolsRes]) => {
        setPortfolio(portfolioRes.data);
        setTransactions(historyRes.data.transactions || []);
        setAllSymbols(symbolsRes.data.symbols || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = allSymbols
      .filter((s) => s.toLowerCase().includes(q) || (STOCK_META[s] || "").toLowerCase().includes(q))
      .slice(0, 5);

    // Fetch quotes for matches
    Promise.all(
      matches.map((s) => api.get(`/trade/quote/${s}`).then((r) => r.data.quote).catch(() => null))
    ).then((results) => setSearchResults(results.filter(Boolean)));
  }, [searchQuery, allSymbols]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          Loading portfolio...
        </div>
      </div>
    );
  }

  const weeklyData = generateWeeklyData(portfolio?.positions);
  const dateRange = getDateRange();
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.value, 0);
  const pieData = portfolio?.positions?.map((p) => ({ name: p.symbol, value: p.marketValue })) || [];

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Welcome back, {user?.username}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Here&apos;s your portfolio overview
          </p>
        </div>

        {/* Stock Search */}
        <div className="relative w-full sm:w-80">
          <div className="search-glass flex items-center px-4 py-2.5 gap-3">
            <svg className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search stocks..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ color: "var(--text-muted)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-2 dash-glass p-2 z-30 space-y-1"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}
            >
              {searchResults.map((q) => (
                <button
                  key={q.symbol}
                  onClick={() => {
                    navigate(`/trade?symbol=${q.symbol}`);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl transition-colors text-left"
                  style={{ color: "var(--text-primary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--dash-receipt-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "rgba(16,185,129,0.1)", color: "var(--accent)" }}
                    >
                      {q.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{q.symbol}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{STOCK_META[q.symbol] || q.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatMoney(q.price)}</p>
                    <p className="text-xs" style={{ color: q.changePercent >= 0 ? "var(--chart-green)" : "var(--chart-red)" }}>
                      {q.changePercent >= 0 ? "+" : ""}{q.changePercent}%
                    </p>
                  </div>
                </button>
              ))}
              <Link
                to="/stocks"
                className="block text-center text-xs font-medium py-2 rounded-lg transition-colors"
                style={{ color: "var(--accent)" }}
              >
                View all stocks &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main content: Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Performance Chart */}
        <div className="lg:col-span-2 dash-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Weekly Performance
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{dateRange}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-green)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Gain</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-red)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Loss</span>
              </div>
              <div
                className="ml-2 px-3 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: weeklyTotal >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: weeklyTotal >= 0 ? "var(--chart-green)" : "var(--chart-red)",
                }}
              >
                {weeklyTotal >= 0 ? "+" : ""}{formatCompact(weeklyTotal)}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} barCategoryGap="35%" margin={{ top: 10, right: 10, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={8} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickFormatter={(v) => {
                  const abs = Math.abs(v);
                  if (abs >= 1000) return `${v < 0 ? "-" : ""}$${(abs / 1000).toFixed(1)}k`;
                  return `$${v.toFixed(0)}`;
                }}
                width={55}
                domain={[
                  (dataMin) => { const pad = Math.abs(dataMin) * 0.15; return Math.floor(dataMin - pad); },
                  (dataMax) => { const pad = Math.abs(dataMax) * 0.15; return Math.ceil(dataMax + pad); },
                ]}
              />
              <ReferenceLine y={0} stroke="var(--chart-dashed)" strokeDasharray="6 4" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="value" shape={<RoundedBar />} maxBarSize={36} barSize={32}>
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "var(--chart-green)" : "var(--chart-red)"} opacity={entry.isFuture ? 0.2 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="dash-glass p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
            <Link to="/history" className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ color: "var(--accent)", background: "rgba(16, 185, 129, 0.1)" }}>
              View all
            </Link>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: "320px" }}>
            {transactions.length > 0 ? transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--dash-receipt-bg)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                    background: tx.type === "BUY" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: tx.type === "BUY" ? "var(--chart-green)" : "var(--chart-red)",
                  }}>
                    {tx.type === "BUY" ? "B" : "S"}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tx.stockSymbol}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{tx.quantity} shares @ {formatMoney(tx.pricePerShare)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: tx.type === "BUY" ? "var(--chart-red)" : "var(--chart-green)" }}>
                    {tx.type === "BUY" ? "-" : "+"}{formatMoney(tx.totalAmount)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-sm py-12" style={{ color: "var(--text-muted)" }}>
                No transactions yet.{" "}
                <Link to="/trade" style={{ color: "var(--accent)" }} className="ml-1">Start trading</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Full Statistics / Portfolio */}
        <div className="dash-stat-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Full Statistics</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
              {portfolio?.positions?.length || 0} Holdings
            </span>
          </div>
          <div className="flex items-center -space-x-2 mb-4">
            {(portfolio?.positions || []).slice(0, 6).map((p, i) => (
              <div key={p.symbol} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2"
                style={{ background: COLORS[i % COLORS.length], borderColor: "var(--bg-card)", color: "#fff", zIndex: 10 - i }}>
                {p.symbol.slice(0, 2)}
              </div>
            ))}
            {(portfolio?.positions?.length || 0) > 6 && (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2"
                style={{ background: "var(--dash-glass-bg)", borderColor: "var(--bg-card)", color: "var(--text-muted)" }}>
                +{portfolio.positions.length - 6}
              </div>
            )}
          </div>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={18} outerRadius={30} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name}
                  </div>
                ))}
                {pieData.length > 4 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{pieData.length - 4} more</span>}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No holdings yet</p>
          )}
        </div>

        {/* Cash Card */}
        <div className="dash-stat-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Cash</h3>
            <div className="flex text-xs rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <span className="px-2.5 py-1 font-medium" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent)" }}>Balance</span>
              <span className="px-2.5 py-1" style={{ color: "var(--text-muted)" }}>Goal</span>
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Starting balance</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>$100,000.00</p>
          </div>
          <div className="mb-4">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current cash</p>
            <p className="text-2xl font-bold gradient-text" style={{ backgroundImage: "var(--dash-gradient-1)" }}>
              {formatMoney(portfolio?.cashBalance || 0)}
            </p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--dash-receipt-bg)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, ((portfolio?.cashBalance || 0) / 100000) * 100)}%`, background: "var(--dash-gradient-1)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            {((portfolio?.cashBalance || 0) / 100000 * 100).toFixed(1)}% of initial balance
          </p>
        </div>

        {/* Account Card */}
        <div className="dash-stat-card p-6 relative overflow-hidden"
          style={{ background: theme === "dark" ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08))" : "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))" }}>
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent 70%)" }} />
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Account</h3>
            <svg className="w-6 h-6" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div className="relative">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
            <p className="text-xs font-mono tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>Paper Trading Account</p>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Portfolio Value</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{formatMoney(portfolio?.totalPortfolioValue || 0)}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                background: (portfolio?.totalProfitLoss || 0) >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: (portfolio?.totalProfitLoss || 0) >= 0 ? "var(--chart-green)" : "var(--chart-red)",
              }}>
                {(portfolio?.totalProfitLoss || 0) >= 0 ? "+" : ""}{portfolio?.totalProfitLossPercent || 0}%
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>all time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="dash-glass overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--dash-glass-border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Positions</h2>
          <Link to="/trade" className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}>
            Trade
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        {portfolio?.positions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--dash-glass-border)" }}>
                  {["Symbol", "Qty", "Avg Cost", "Price", "Market Value", "P&L"].map((h, i) => (
                    <th key={h} className={`px-6 py-3 font-medium text-xs uppercase tracking-wider ${i === 0 ? "text-left" : "text-right"}`} style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p, i) => (
                  <tr key={p.symbol} className="transition-colors"
                    style={{ borderBottom: i < portfolio.positions.length - 1 ? "1px solid var(--dash-glass-border)" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--dash-receipt-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: `${COLORS[i % COLORS.length]}22`, color: COLORS[i % COLORS.length] }}>
                          {p.symbol.slice(0, 2)}
                        </div>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right" style={{ color: "var(--text-secondary)" }}>{p.quantity}</td>
                    <td className="px-6 py-3.5 text-right" style={{ color: "var(--text-secondary)" }}>{formatMoney(p.avgBuyPrice)}</td>
                    <td className="px-6 py-3.5 text-right font-medium" style={{ color: "var(--text-primary)" }}>{formatMoney(p.currentPrice)}</td>
                    <td className="px-6 py-3.5 text-right font-medium" style={{ color: "var(--text-primary)" }}>{formatMoney(p.marketValue)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="font-semibold" style={{ color: p.profitLoss >= 0 ? "var(--chart-green)" : "var(--chart-red)" }}>
                        {p.profitLoss >= 0 ? "+" : ""}{formatMoney(p.profitLoss)}
                      </span>
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-medium" style={{
                        background: p.profitLoss >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: p.profitLoss >= 0 ? "var(--chart-green)" : "var(--chart-red)",
                      }}>
                        {p.profitLossPercent >= 0 ? "+" : ""}{p.profitLossPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4m8-8v16" />
            </svg>
            <p>No positions yet.</p>
            <Link to="/trade" className="inline-block mt-2 text-sm font-medium" style={{ color: "var(--accent)" }}>Start trading &rarr;</Link>
          </div>
        )}
      </div>
    </div>
  );
}
