// routes/wallet.js
const express = require('express');
const router = express.Router();
const { getWallet } = require('../controllers/walletController');

router.get('/:playerId', getWallet); // GET /api/wallet/:playerId

module.exports = router;
