// routes/game.js
const express = require('express');
const router = express.Router();
const { placeBet, cashOut } = require('../controllers/gameController');

router.post('/bet', placeBet);        // POST /api/game/bet
router.post('/cashout', cashOut);     // POST /api/game/cashout

module.exports = router;
