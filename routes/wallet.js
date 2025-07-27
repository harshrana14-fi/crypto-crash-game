// routes/wallet.js
const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const getPrice = require('../services/cryptoAPI');

router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get current prices for USD equivalent
    const btcPrice = await getPrice('BTC');
    const ethPrice = await getPrice('ETH');

    const response = {
      crypto: {
        BTC: player.wallet.BTC || 0,
        ETH: player.wallet.ETH || 0
      },
      usdEquivalent: {
        BTC: ((player.wallet.BTC || 0) * btcPrice).toFixed(2),
        ETH: ((player.wallet.ETH || 0) * ethPrice).toFixed(2)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;