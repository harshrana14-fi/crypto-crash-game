// models/GameRound.js
const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  roundId: String,
  crashPoint: Number,
  startTime: Date,
  endTime: Date,
  bets: [
    {
      playerId: String,
      usdAmount: Number,
      cryptoAmount: Number,
      currency: String,
      cashedOut: Boolean,
      multiplierAtCashout: Number
    }
  ],
  provablyFair: {
    seed: String,
    salt: String
  }
});


module.exports = mongoose.model('GameRound', gameRoundSchema);
