// Simulated stock prices for paper trading.
// Replace this module with a real market data provider (e.g. Alpha Vantage, Finnhub) in production.

const BASE_PRICES = {
  AAPL: 189.84,
  GOOGL: 141.80,
  MSFT: 415.60,
  AMZN: 186.50,
  TSLA: 248.42,
  META: 505.75,
  NVDA: 875.35,
  NFLX: 628.20,
  JPM: 198.45,
  V: 279.30,
  DIS: 112.50,
  BA: 185.60,
  INTC: 31.20,
  AMD: 164.80,
  PYPL: 63.45,
  UBER: 78.90,
  COIN: 225.60,
  SQ: 82.15,
  SNAP: 11.40,
  PLTR: 24.80,
};

// Add slight randomness to simulate price movement (+-2%)
function getPrice(symbol) {
  const base = BASE_PRICES[symbol.toUpperCase()];
  if (!base) return null;

  const variance = base * 0.02;
  const offset = (Math.random() * 2 - 1) * variance;
  return parseFloat((base + offset).toFixed(2));
}

function getQuote(symbol) {
  const price = getPrice(symbol);
  if (!price) return null;

  const base = BASE_PRICES[symbol.toUpperCase()];
  const change = parseFloat((price - base).toFixed(2));
  const changePercent = parseFloat(((change / base) * 100).toFixed(2));

  return {
    symbol: symbol.toUpperCase(),
    price,
    change,
    changePercent,
    timestamp: new Date().toISOString(),
  };
}

function isValidSymbol(symbol) {
  return symbol && BASE_PRICES[symbol.toUpperCase()] !== undefined;
}

function getAllSymbols() {
  return Object.keys(BASE_PRICES);
}

module.exports = { getPrice, getQuote, isValidSymbol, getAllSymbols };
