const getPrice = require('../services/cryptoAPI');
const Player = require('../models/Player');

// ✅ Mapping of currency symbols to CoinGecko IDs
const coinGeckoIds = {
  BTC: 'bitcoin',
  ETH: 'ethereum'
};

exports.getWallet = async (req, res) => {
  try {
    const playerId = req.params.id;

    // ✅ Find the player by ID
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const usdEquivalent = {};
    const crypto = {};

    // ✅ Loop through player's wallet currencies
    for (const symbol of Object.keys(player.wallet)) {
      const coinId = coinGeckoIds[symbol]; // BTC → bitcoin
      if (!coinId) {
        console.warn(`⚠️ Unsupported symbol: ${symbol}`);
        continue;
      }

      const price = await getPrice(coinId);
      crypto[symbol] = player.wallet[symbol];
      usdEquivalent[symbol] = +(player.wallet[symbol] * price).toFixed(2);
    }

    // ✅ Return both crypto and USD value
    res.json({ crypto, usdEquivalent });

  } catch (err) {
    console.error("❌ Wallet fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};
