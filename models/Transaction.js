// models/Transaction.js
const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  playerId: String,
  usdAmount: Number,
  cryptoAmount: Number,
  currency: String,
  transactionType: String, // 'bet' or 'cashout'
  transactionHash: String,
  priceAtTime: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txSchema);
