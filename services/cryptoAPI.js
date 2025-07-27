// services/cryptoAPI.js
const axios = require('axios');

const cache = {};

// CoinGecko ID mapping
const symbolToId = {
  BTC: 'bitcoin',
  ETH: 'ethereum'
};

module.exports = async function getPrice(symbol) {
  const coinId = symbolToId[symbol];
  if (!coinId) throw new Error(`Unsupported currency: ${symbol}`);

  const now = Date.now();
  const cached = cache[symbol];

  if (cached && now - cached.timestamp < 10000) {
    return cached.price;
  }

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    const price = res.data[coinId]?.usd;

    if (!price) throw new Error("Invalid price data");

    cache[symbol] = { price, timestamp: now };
    return price;
  } catch (err) {
    if (cached) {
      console.warn(`⚠️ Failed to fetch ${symbol} price, using cached`);
      return cached.price;
    }
    console.error("❌ getPrice error:", err.message);
    throw new Error(`Failed to fetch price for ${symbol}`);
  }
};
