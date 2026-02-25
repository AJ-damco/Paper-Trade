import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/portfolio")
      .then((res) => setPortfolio(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: "var(--text-muted)" }}>Loading portfolio...</div>
      </div>
    );
  }

  const pieData =
    portfolio?.positions?.map((p) => ({
      name: p.symbol,
      value: p.marketValue,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back, {user?.username}
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Here&apos;s your portfolio overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Portfolio Value"
          value={formatMoney(portfolio?.totalPortfolioValue || 0)}
          accent="emerald"
        />
        <StatCard
          label="Cash Balance"
          value={formatMoney(portfolio?.cashBalance || 0)}
          accent="blue"
        />
        <StatCard
          label="Invested"
          value={formatMoney(portfolio?.totalInvested || 0)}
          accent="amber"
        />
        <StatCard
          label="Total P&L"
          value={formatMoney(portfolio?.totalProfitLoss || 0)}
          accent={portfolio?.totalProfitLoss >= 0 ? "emerald" : "red"}
          sub={`${portfolio?.totalProfitLossPercent >= 0 ? "+" : ""}${portfolio?.totalProfitLossPercent || 0}%`}
        />
      </div>

      {/* Positions + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions table */}
        <div className="lg:col-span-2 theme-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Positions
            </h2>
            <Link to="/trade" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              Trade &rarr;
            </Link>
          </div>
          {portfolio?.positions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="px-6 py-3 font-medium text-left" style={{ color: "var(--text-muted)" }}>Symbol</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Qty</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Avg Cost</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Price</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>Market Value</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: "var(--text-muted)" }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((p) => (
                    <tr key={p.symbol} className="hover:opacity-80" style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td className="px-6 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{p.symbol}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>{p.quantity}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>{formatMoney(p.avgBuyPrice)}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>{formatMoney(p.currentPrice)}</td>
                      <td className="px-6 py-3 text-right" style={{ color: "var(--text-secondary)" }}>{formatMoney(p.marketValue)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${p.profitLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {formatMoney(p.profitLoss)} ({p.profitLossPercent >= 0 ? "+" : ""}{p.profitLossPercent}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
              No positions yet.{" "}
              <Link to="/trade" style={{ color: "var(--accent)" }}>
                Start trading
              </Link>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="theme-card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Allocation
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    background: theme === "dark" ? "#1e1e2a" : "#ffffff",
                    border: `1px solid ${theme === "dark" ? "#2a2a3a" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    color: theme === "dark" ? "#d1d5db" : "#334155",
                  }}
                  itemStyle={{ color: theme === "dark" ? "#d1d5db" : "#334155" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm" style={{ color: "var(--text-muted)" }}>
              No holdings to display
            </div>
          )}
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, sub }) {
  const accentColors = {
    emerald: "#10b981",
    blue: "#3b82f6",
    amber: "#f59e0b",
    red: "#ef4444",
  };
  const color = accentColors[accent] || "var(--text-primary)";
  return (
    <div className="theme-card p-5">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-sm mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}
