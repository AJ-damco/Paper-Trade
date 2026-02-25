const express = require("express");
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const { getPrice, getQuote, isValidSymbol, getAllSymbols } = require("../lib/stockPrices");

const router = express.Router();

router.use(authenticate);

// GET /api/trade/quote/:symbol - Get current price for a stock
router.get("/quote/:symbol", (req, res) => {
  const { symbol } = req.params;

  if (!isValidSymbol(symbol)) {
    return res.status(404).json({ error: "Unknown stock symbol" });
  }

  const quote = getQuote(symbol);
  res.json({ quote });
});

// GET /api/trade/symbols - List all available symbols
router.get("/symbols", (req, res) => {
  const symbols = getAllSymbols();
  res.json({ symbols });
});

// POST /api/trade/buy - Buy shares of a stock
router.post("/buy", async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity) {
      return res.status(400).json({ error: "Symbol and quantity are required" });
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    if (!isValidSymbol(symbol)) {
      return res.status(404).json({ error: "Unknown stock symbol" });
    }

    const price = getPrice(symbol);
    const totalCost = parseFloat((price * qty).toFixed(2));

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.balance < totalCost) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: totalCost,
        available: user.balance,
      });
    }

    // Execute trade in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: req.userId },
        data: { balance: { decrement: totalCost } },
        select: { balance: true },
      });

      // Upsert holding (create or add to existing position)
      const existing = await tx.holding.findUnique({
        where: { userId_stockSymbol: { userId: req.userId, stockSymbol: symbol.toUpperCase() } },
      });

      let holding;
      if (existing) {
        const newQuantity = existing.quantity + qty;
        const newAvgPrice = parseFloat(
          ((existing.avgBuyPrice * existing.quantity + price * qty) / newQuantity).toFixed(2)
        );
        holding = await tx.holding.update({
          where: { id: existing.id },
          data: { quantity: newQuantity, avgBuyPrice: newAvgPrice },
        });
      } else {
        holding = await tx.holding.create({
          data: {
            userId: req.userId,
            stockSymbol: symbol.toUpperCase(),
            quantity: qty,
            avgBuyPrice: price,
          },
        });
      }

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: req.userId,
          stockSymbol: symbol.toUpperCase(),
          type: "BUY",
          quantity: qty,
          pricePerShare: price,
          totalAmount: totalCost,
        },
      });

      return { updatedUser, holding, transaction };
    });

    res.status(201).json({
      message: `Bought ${qty} shares of ${symbol.toUpperCase()} at $${price}`,
      transaction: {
        id: result.transaction.id,
        type: "BUY",
        symbol: symbol.toUpperCase(),
        quantity: qty,
        pricePerShare: price,
        totalAmount: totalCost,
        createdAt: result.transaction.createdAt,
      },
      holding: {
        symbol: result.holding.stockSymbol,
        quantity: result.holding.quantity,
        avgBuyPrice: result.holding.avgBuyPrice,
      },
      balance: result.updatedUser.balance,
    });
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/trade/sell - Sell shares of a stock
router.post("/sell", async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity) {
      return res.status(400).json({ error: "Symbol and quantity are required" });
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    if (!isValidSymbol(symbol)) {
      return res.status(404).json({ error: "Unknown stock symbol" });
    }

    const holding = await prisma.holding.findUnique({
      where: { userId_stockSymbol: { userId: req.userId, stockSymbol: symbol.toUpperCase() } },
    });

    if (!holding || holding.quantity < qty) {
      return res.status(400).json({
        error: "Insufficient shares",
        available: holding ? holding.quantity : 0,
        requested: qty,
      });
    }

    const price = getPrice(symbol);
    const totalProceeds = parseFloat((price * qty).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // Credit balance
      const updatedUser = await tx.user.update({
        where: { id: req.userId },
        data: { balance: { increment: totalProceeds } },
        select: { balance: true },
      });

      // Update or remove holding
      let updatedHolding = null;
      const remainingQty = holding.quantity - qty;

      if (remainingQty === 0) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        updatedHolding = await tx.holding.update({
          where: { id: holding.id },
          data: { quantity: remainingQty },
        });
      }

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: req.userId,
          stockSymbol: symbol.toUpperCase(),
          type: "SELL",
          quantity: qty,
          pricePerShare: price,
          totalAmount: totalProceeds,
        },
      });

      return { updatedUser, updatedHolding, transaction };
    });

    const profitPerShare = parseFloat((price - holding.avgBuyPrice).toFixed(2));
    const totalProfit = parseFloat((profitPerShare * qty).toFixed(2));

    res.json({
      message: `Sold ${qty} shares of ${symbol.toUpperCase()} at $${price}`,
      transaction: {
        id: result.transaction.id,
        type: "SELL",
        symbol: symbol.toUpperCase(),
        quantity: qty,
        pricePerShare: price,
        totalAmount: totalProceeds,
        createdAt: result.transaction.createdAt,
      },
      profitLoss: {
        perShare: profitPerShare,
        total: totalProfit,
      },
      balance: result.updatedUser.balance,
    });
  } catch (err) {
    console.error("Sell error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/trade/history - Get transaction history
router.get("/history", async (req, res) => {
  try {
    const { symbol, type, limit = 50, offset = 0 } = req.query;

    const where = { userId: req.userId };
    if (symbol) where.stockSymbol = symbol.toUpperCase();
    if (type) where.type = type.toUpperCase();

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
