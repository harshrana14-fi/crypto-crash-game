// models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  wallet: {
    BTC: {
      type: Number,
      default: 0
    },
    ETH: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Player', playerSchema);
