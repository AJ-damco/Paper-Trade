import { useState, useRef, useEffect } from "react";
import api from "../lib/api";

const AGENTS = {
  "stock-advisor": {
    label: "Stock Advisor",
    description: "Get trading ideas and stock analysis",
    placeholder: "e.g. What do you think about AAPL right now?",
    color: "emerald",
  },
  "portfolio-analyst": {
    label: "Portfolio Analyst",
    description: "Get insights on your portfolio composition",
    placeholder: "e.g. How diversified is my portfolio?",
    color: "blue",
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
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-gray-400 text-sm mt-1">Chat with AI agents for trading analysis</p>
      </div>

      {/* Agent Selector */}
      <div className="flex gap-3 mb-4">
        {Object.entries(AGENTS).map(([key, a]) => (
          <button
            key={key}
            onClick={() => handleSwitchAgent(key)}
            className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
              agent === key
                ? `border-${a.color}-600 bg-${a.color}-600/10`
                : "border-gray-800 bg-gray-900 hover:border-gray-700"
            }`}
          >
            <span
              className={`text-sm font-semibold ${
                agent === key ? (a.color === "emerald" ? "text-emerald-400" : "text-blue-400") : "text-gray-300"
              }`}
            >
              {a.label}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className={`text-4xl mb-3 ${cfg.color === "emerald" ? "text-emerald-400" : "text-blue-400"}`}>
                  {cfg.color === "emerald" ? (
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-400 font-medium">{cfg.label}</p>
                <p className="text-gray-600 text-sm mt-1">{cfg.description}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : msg.role === "error"
                    ? "bg-red-900/50 border border-red-700 text-red-300"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {msg.role === "assistant" && (
                  <p className={`text-xs font-medium mb-1 ${cfg.color === "emerald" ? "text-emerald-400" : "text-blue-400"}`}>
                    {AGENTS[msg.agent]?.label || "AI"}
                  </p>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cfg.placeholder}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
