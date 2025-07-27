// routes/player.js
const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const player = new Player({
      name,
      wallet: { BTC: 0.01, ETH: 0.1 } // Starting balance
    });
    await player.save();
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;