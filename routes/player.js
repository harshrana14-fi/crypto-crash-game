// routes/player.js
const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/', async (req, res) => {
  const players = await Player.find({}, 'name _id');
  res.json(players);
});

module.exports = router;
