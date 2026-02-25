import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Dashboard() {
  const { user } = useAuth();
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
        <div className="text-gray-400">Loading portfolio...</div>
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
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.username}
        </h1>
        <p className="text-gray-400 mt-1">Here&apos;s your portfolio overview</p>
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
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Positions</h2>
            <Link
              to="/trade"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Trade &rarr;
            </Link>
          </div>
          {portfolio?.positions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-800">
                    <th className="px-6 py-3 font-medium">Symbol</th>
                    <th className="px-6 py-3 font-medium text-right">Qty</th>
                    <th className="px-6 py-3 font-medium text-right">Avg Cost</th>
                    <th className="px-6 py-3 font-medium text-right">Price</th>
                    <th className="px-6 py-3 font-medium text-right">Market Value</th>
                    <th className="px-6 py-3 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((p) => (
                    <tr key={p.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-3 font-medium text-white">{p.symbol}</td>
                      <td className="px-6 py-3 text-right text-gray-300">{p.quantity}</td>
                      <td className="px-6 py-3 text-right text-gray-300">{formatMoney(p.avgBuyPrice)}</td>
                      <td className="px-6 py-3 text-right text-gray-300">{formatMoney(p.currentPrice)}</td>
                      <td className="px-6 py-3 text-right text-gray-300">{formatMoney(p.marketValue)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${p.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatMoney(p.profitLoss)} ({p.profitLossPercent >= 0 ? "+" : ""}{p.profitLossPercent}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No positions yet.{" "}
              <Link to="/trade" className="text-emerald-400 hover:text-emerald-300">
                Start trading
              </Link>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Allocation</h2>
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
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  itemStyle={{ color: "#d1d5db" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
              No holdings to display
            </div>
          )}
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
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
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentColors[accent] || "text-white"}`}>
        {value}
      </p>
      {sub && <p className={`text-sm mt-0.5 ${accentColors[accent] || "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}
