const express = require("express");
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const { getPrice } = require("../lib/stockPrices");

const router = express.Router();

router.use(authenticate);

// GET /api/portfolio - Get portfolio summary with current values
router.get("/", async (req, res) => {
  try {
    const [user, holdings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { balance: true },
      }),
      prisma.holding.findMany({
        where: { userId: req.userId },
        orderBy: { stockSymbol: "asc" },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let totalInvested = 0;
    let totalMarketValue = 0;

    const positions = holdings.map((h) => {
      const currentPrice = getPrice(h.stockSymbol) || h.avgBuyPrice;
      const marketValue = parseFloat((currentPrice * h.quantity).toFixed(2));
      const costBasis = parseFloat((h.avgBuyPrice * h.quantity).toFixed(2));
      const profitLoss = parseFloat((marketValue - costBasis).toFixed(2));
      const profitLossPercent = parseFloat(((profitLoss / costBasis) * 100).toFixed(2));

      totalInvested += costBasis;
      totalMarketValue += marketValue;

      return {
        symbol: h.stockSymbol,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice,
        costBasis,
        marketValue,
        profitLoss,
        profitLossPercent,
      };
    });

    const totalProfitLoss = parseFloat((totalMarketValue - totalInvested).toFixed(2));
    const totalProfitLossPercent = totalInvested > 0
      ? parseFloat(((totalProfitLoss / totalInvested) * 100).toFixed(2))
      : 0;

    res.json({
      cashBalance: user.balance,
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalMarketValue: parseFloat(totalMarketValue.toFixed(2)),
      totalProfitLoss,
      totalProfitLossPercent,
      totalPortfolioValue: parseFloat((user.balance + totalMarketValue).toFixed(2)),
      positions,
    });
  } catch (err) {
    console.error("Portfolio error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/portfolio/holdings - Get raw holdings list
router.get("/holdings", async (req, res) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: { userId: req.userId },
      orderBy: { stockSymbol: "asc" },
    });

    res.json({ holdings });
  } catch (err) {
    console.error("Holdings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
