import { useState, useRef, useEffect } from "react";
import api from "../lib/api";

const AGENTS = {
  "stock-advisor": {
    label: "Stock Advisor",
    description: "Get trading ideas and stock analysis",
    placeholder: "e.g. What do you think about AAPL right now?",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #3b82f6)",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  "portfolio-analyst": {
    label: "Portfolio Analyst",
    description: "Get insights on your portfolio composition",
    placeholder: "e.g. How diversified is my portfolio?",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    icon: "M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z",
  },
};

export default function AIInsights() {
  const [agent, setAgent] = useState("stock-advisor");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.post(`/ai/${agent}`, { message: userMsg });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, agent: res.data.agent }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "error", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAgent = (newAgent) => {
    setAgent(newAgent);
    setMessages([]);
  };

  const cfg = AGENTS[agent];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>AI Insights</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Chat with AI agents for trading analysis</p>
      </div>

      {/* Agent Selector */}
      <div className="flex gap-3 mb-4">
        {Object.entries(AGENTS).map(([key, a]) => {
          const isActive = agent === key;
          return (
            <button
              key={key}
              onClick={() => handleSwitchAgent(key)}
              className="flex-1 p-4 rounded-xl text-left transition-all"
              style={isActive ? {
                background: "var(--dash-glass-bg)",
                backdropFilter: "blur(24px)",
                border: `1px solid ${a.color}40`,
                boxShadow: `0 0 24px ${a.color}15`,
              } : {
                background: "var(--dash-glass-bg)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--dash-glass-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: isActive ? a.gradient : `${a.color}15` }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: isActive ? "white" : a.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                  </svg>
                </div>
                <span className="text-sm font-semibold" style={{ color: isActive ? a.color : "var(--text-secondary)" }}>
                  {a.label}
                </span>
              </div>
              <p className="text-xs ml-8" style={{ color: "var(--text-muted)" }}>{a.description}</p>
            </button>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="flex-1 dash-glass flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: cfg.gradient }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{cfg.label}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? { background: cfg.gradient, color: "white", boxShadow: `0 4px 16px ${cfg.color}30` }
                    : msg.role === "error"
                    ? { background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--chart-red)" }
                    : { background: "var(--dash-receipt-bg)", color: "var(--text-primary)", border: "1px solid var(--dash-glass-border)" }
                }
              >
                {msg.role === "assistant" && (
                  <p className="text-xs font-semibold mb-1.5" style={{ color: cfg.color }}>
                    {AGENTS[msg.agent]?.label || "AI"}
                  </p>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-5 py-3" style={{ background: "var(--dash-receipt-bg)", border: "1px solid var(--dash-glass-border)" }}>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: cfg.color, animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: cfg.color, animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: cfg.color, animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4" style={{ borderTop: "1px solid var(--dash-glass-border)" }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cfg.placeholder}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl theme-input disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 text-white"
              style={{ background: cfg.gradient, boxShadow: `0 4px 16px ${cfg.color}25` }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
