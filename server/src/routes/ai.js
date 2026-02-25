const express = require("express");
const prisma = require("../lib/prisma");
const anthropic = require("../lib/anthropic");
const authenticate = require("../middleware/auth");
const { getQuote, getAllSymbols } = require("../lib/stockPrices");

const router = express.Router();

router.use(authenticate);

const STOCK_ADVISOR_SYSTEM = `You are a Stock Advisor AI for a paper trading simulator called PaperTrade.
Your role is to provide educational stock analysis and trading ideas.

Guidelines:
- Provide analysis based on the simulated stock data provided
- Explain your reasoning clearly for educational purposes
- Suggest potential trades with entry points and rationale
- Discuss risk factors and considerations
- Keep responses concise (2-3 paragraphs max)
- Always remind users this is simulated/educational, not real financial advice
- Be conversational and helpful`;

const PORTFOLIO_ANALYST_SYSTEM = `You are a Portfolio Analyst AI for a paper trading simulator called PaperTrade.
Your role is to analyze the user's portfolio and provide insights.

Guidelines:
- Analyze the portfolio composition, diversification, and risk exposure
- Identify concentration risks or imbalances
- Suggest potential improvements or rebalancing strategies
- Comment on profit/loss performance
- Keep responses concise (2-3 paragraphs max)
- Always remind users this is simulated/educational, not real financial advice
- Be conversational and helpful`;

// Helper to build market context string
function getMarketSnapshot() {
  const symbols = getAllSymbols();
  const quotes = symbols.map((s) => {
    const q = getQuote(s);
    return `${q.symbol}: $${q.price} (${q.change >= 0 ? "+" : ""}${q.changePercent}%)`;
  });
  return `Current market prices:\n${quotes.join("\n")}`;
}

// Helper to build portfolio context string
async function getPortfolioContext(userId) {
  const [user, holdings, recentTx] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    prisma.holding.findMany({ where: { userId }, orderBy: { stockSymbol: "asc" } }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!holdings.length) {
    return `Cash balance: $${user.balance.toFixed(2)}\nNo current holdings.\nNo recent transactions.`;
  }

  const positions = holdings.map((h) => {
    const price = getQuote(h.stockSymbol)?.price || h.avgBuyPrice;
    const pnl = ((price - h.avgBuyPrice) * h.quantity).toFixed(2);
    return `${h.stockSymbol}: ${h.quantity} shares @ avg $${h.avgBuyPrice} (current $${price}, P&L: $${pnl})`;
  });

  const txLines = recentTx.map(
    (tx) => `${tx.type} ${tx.quantity}x ${tx.stockSymbol} @ $${tx.pricePerShare} on ${tx.createdAt.toISOString().split("T")[0]}`
  );

  return [
    `Cash balance: $${user.balance.toFixed(2)}`,
    `\nPositions:\n${positions.join("\n")}`,
    txLines.length ? `\nRecent transactions:\n${txLines.join("\n")}` : "",
  ].join("\n");
}

// POST /api/ai/stock-advisor - Chat with Stock Advisor
router.post("/stock-advisor", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const marketData = getMarketSnapshot();
    const portfolioData = await getPortfolioContext(req.userId);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `${STOCK_ADVISOR_SYSTEM}\n\n--- MARKET DATA ---\n${marketData}\n\n--- USER PORTFOLIO ---\n${portfolioData}`,
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content[0]?.text || "I couldn't generate a response.";
    res.json({ reply, agent: "stock-advisor" });
  } catch (err) {
    console.error("Stock Advisor error:", err);
    if (err.status === 401) {
      return res.status(503).json({ error: "AI service not configured. Please set a valid ANTHROPIC_API_KEY." });
    }
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

// POST /api/ai/portfolio-analyst - Chat with Portfolio Analyst
router.post("/portfolio-analyst", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const marketData = getMarketSnapshot();
    const portfolioData = await getPortfolioContext(req.userId);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `${PORTFOLIO_ANALYST_SYSTEM}\n\n--- MARKET DATA ---\n${marketData}\n\n--- USER PORTFOLIO ---\n${portfolioData}`,
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content[0]?.text || "I couldn't generate a response.";
    res.json({ reply, agent: "portfolio-analyst" });
  } catch (err) {
    console.error("Portfolio Analyst error:", err);
    if (err.status === 401) {
      return res.status(503).json({ error: "AI service not configured. Please set a valid ANTHROPIC_API_KEY." });
    }
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
});

module.exports = router;
