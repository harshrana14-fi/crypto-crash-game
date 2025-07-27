
// routes/game.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/bet', gameController.placeBet);
router.post('/cashout', gameController.cashOut);

module.exports = router;