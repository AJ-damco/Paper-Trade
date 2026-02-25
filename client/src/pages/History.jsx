import { useState, useEffect } from "react";
import api from "../lib/api";

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter !== "ALL") params.type = filter;
    api
      .get("/trade/history", { params })
      .then((res) => {
        setTransactions(res.data.transactions);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Transaction History
        </h1>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {total} transactions
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "BUY", "SELL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-emerald-600 text-white" : ""
            }`}
            style={filter !== f ? { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : {}}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="theme-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="px-6 py-3 font-medium text-left" style={{ color: "var(--text-muted)" }}>Date</th>
                  <th className="px-6 py-3 font-medium text-left" style={{ color: "var(--text-muted)" }}>Type</th>
                  <th className="px-6 py-3 font-medium text-left" style={{ color: "var(--text-muted)" }}>Symbol</th>
                  <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Qty</th>
                  <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Price</th>
                  <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:opacity-80" style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td className="px-6 py-3" style={{ color: "var(--text-muted)" }}>{formatDate(tx.createdAt)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          tx.type === "BUY"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{tx.stockSymbol}</td>
                    <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>{tx.quantity}</td>
                    <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                      {formatMoney(tx.pricePerShare)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium" style={{ color: "var(--text-primary)" }}>
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
