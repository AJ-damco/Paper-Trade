const express = require("express");
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const { getQuote, isValidSymbol } = require("../lib/stockPrices");

const router = express.Router();

router.use(authenticate);

// GET /api/watchlist - Get user's watchlist with current prices
router.get("/", async (req, res) => {
  try {
    const items = await prisma.watchlist.findMany({
      where: { userId: req.userId },
      orderBy: { addedAt: "desc" },
    });

    const watchlist = items.map((item) => {
      const quote = getQuote(item.stockSymbol);
      return {
        id: item.id,
        symbol: item.stockSymbol,
        addedAt: item.addedAt,
        ...(quote && { price: quote.price, change: quote.change, changePercent: quote.changePercent }),
      };
    });

    res.json({ watchlist });
  } catch (err) {
    console.error("Get watchlist error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/watchlist - Add a symbol to watchlist
router.post("/", async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    if (!isValidSymbol(symbol)) {
      return res.status(404).json({ error: "Unknown stock symbol" });
    }

    const existing = await prisma.watchlist.findUnique({
      where: { userId_stockSymbol: { userId: req.userId, stockSymbol: symbol.toUpperCase() } },
    });

    if (existing) {
      return res.status(409).json({ error: "Symbol already in watchlist" });
    }

    const item = await prisma.watchlist.create({
      data: {
        userId: req.userId,
        stockSymbol: symbol.toUpperCase(),
      },
    });

    res.status(201).json({
      item: {
        id: item.id,
        symbol: item.stockSymbol,
        addedAt: item.addedAt,
      },
    });
  } catch (err) {
    console.error("Add to watchlist error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/watchlist/:symbol - Remove a symbol from watchlist
router.delete("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    const item = await prisma.watchlist.findUnique({
      where: { userId_stockSymbol: { userId: req.userId, stockSymbol: symbol.toUpperCase() } },
    });

    if (!item) {
      return res.status(404).json({ error: "Symbol not in watchlist" });
    }

    await prisma.watchlist.delete({ where: { id: item.id } });

    res.json({ message: `${symbol.toUpperCase()} removed from watchlist` });
  } catch (err) {
    console.error("Remove from watchlist error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
