import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

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

export default function Stocks() {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [sortBy, setSortBy] = useState("symbol");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/trade/symbols").then(async (res) => {
      const symbols = res.data.symbols;
      const quotePromises = symbols.map((s) =>
        api.get(`/trade/quote/${s}`).then((r) => r.data.quote).catch(() => null)
      );
      const results = await Promise.all(quotePromises);
      setQuotes(results.filter(Boolean));
      setLoading(false);
    });
  }, []);

  const sectors = useMemo(() => {
    const s = new Set(quotes.map((q) => STOCK_META[q.symbol]?.sector).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [quotes]);

  const filtered = useMemo(() => {
    let list = [...quotes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          (STOCK_META[s.symbol]?.name || "").toLowerCase().includes(q)
      );
    }
    if (sectorFilter !== "All") {
      list = list.filter((s) => STOCK_META[s.symbol]?.sector === sectorFilter);
    }
    list.sort((a, b) => {
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "change") return b.changePercent - a.changePercent;
      return 0;
    });
    return list;
  }, [quotes, search, sectorFilter, sortBy]);

  const gainers = useMemo(() => [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3), [quotes]);
  const losers = useMemo(() => [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3), [quotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Stocks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Browse and discover stocks to trade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot inline-block w-2 h-2 rounded-full" style={{ background: "var(--chart-green)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {quotes.length} stocks
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 search-glass flex items-center px-4 py-3 gap-3">
          <svg className="w-5 h-5 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol or company name..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--text-muted)" }} className="hover:opacity-70">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="search-glass px-4 py-3 text-sm bg-transparent outline-none cursor-pointer"
            style={{ color: "var(--text-primary)" }}
          >
            {sectors.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Sectors" : s}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="search-glass px-4 py-3 text-sm bg-transparent outline-none cursor-pointer"
            style={{ color: "var(--text-primary)" }}
          >
            <option value="symbol">Sort: A-Z</option>
            <option value="price">Sort: Price</option>
            <option value="change">Sort: Change</option>
          </select>
        </div>
      </div>

      {/* Top Movers */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="dash-glass p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--chart-green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Top Gainers
            </h3>
            <div className="space-y-2.5">
              {gainers.map((q) => (
                <div key={q.symbol} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "var(--dash-receipt-bg)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(16, 185, 129, 0.12)", color: "var(--chart-green)" }}
                    >
                      {q.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{q.symbol}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{STOCK_META[q.symbol]?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatMoney(q.price)}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--chart-green)" }}>+{q.changePercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-glass p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--chart-red)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
              Top Losers
            </h3>
            <div className="space-y-2.5">
              {losers.map((q) => (
                <div key={q.symbol} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "var(--dash-receipt-bg)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--chart-red)" }}
                    >
                      {q.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{q.symbol}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{STOCK_META[q.symbol]?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatMoney(q.price)}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--chart-red)" }}>{q.changePercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dash-glass p-5 h-32 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-glass p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No stocks match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q) => {
            const meta = STOCK_META[q.symbol] || {};
            const sectorColor = SECTOR_COLORS[meta.sector] || "#64748b";
            const isUp = q.changePercent >= 0;
            return (
              <div
                key={q.symbol}
                className="dash-stat-card p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: `${sectorColor}18`, color: sectorColor }}
                    >
                      {q.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{q.symbol}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{meta.name || q.symbol}</p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${sectorColor}15`, color: sectorColor }}
                  >
                    {meta.sector || "Other"}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {formatMoney(q.price)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          background: isUp ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: isUp ? "var(--chart-green)" : "var(--chart-red)",
                        }}
                      >
                        {isUp ? "+" : ""}{q.changePercent}%
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {isUp ? "+" : ""}{formatMoney(q.change)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/trade?symbol=${q.symbol}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    style={{
                      background: "var(--accent)",
                      color: "white",
                    }}
                  >
                    Trade
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
