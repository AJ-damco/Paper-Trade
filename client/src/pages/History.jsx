import { useState, useEffect } from "react";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const FILTERS = ["ALL", "BUY", "SELL"];

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter !== "ALL") params.type = filter;
    api.get("/trade/history", { params })
      .then((res) => { setTransactions(res.data.transactions); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Transaction History
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            All your past trades
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa" }}
        >
          {total} transactions
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={isActive ? {
                background: f === "SELL" ? "var(--dash-gradient-2)" : "var(--dash-gradient-1)",
                color: "white",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
              } : {
                background: "var(--dash-glass-bg)",
                backdropFilter: "blur(12px)",
                color: "var(--text-secondary)",
                border: "1px solid var(--dash-glass-border)",
              }}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="dash-glass overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <div className="w-5 h-5 mx-auto rounded-full border-2 border-t-transparent animate-spin mb-2" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "var(--text-muted)" }}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--dash-glass-border)" }}>
                  {["Date", "Type", "Symbol", "Qty", "Price", "Total"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 font-medium text-xs uppercase tracking-wider ${i >= 3 ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className="transition-colors"
                    style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--dash-glass-border)" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--dash-receipt-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-6 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(tx.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: tx.type === "BUY" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: tx.type === "BUY" ? "var(--chart-green)" : "var(--chart-red)",
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={tx.type === "BUY" ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                        </svg>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{tx.stockSymbol}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right" style={{ color: "var(--text-secondary)" }}>{tx.quantity}</td>
                    <td className="px-6 py-3.5 text-right" style={{ color: "var(--text-secondary)" }}>{formatMoney(tx.pricePerShare)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatMoney(tx.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
