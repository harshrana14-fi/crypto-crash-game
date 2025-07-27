const mongoose = require('mongoose');
require('dotenv').config();

const Player = require('../models/Player');
const GameRound = require('../models/GameRound'); // ✅ ADD THIS LINE

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 🌱 Auto seed sample players if none exist
    const existing = await Player.countDocuments();
    if (existing === 0) {
      console.log('🌱 No players found, creating default players...');
      await Player.insertMany([
        { name: 'Alice', wallet: { BTC: 0.005, ETH: 0.1 } },
        { name: 'Bob', wallet: { BTC: 0.007, ETH: 0.05 } },
        { name: 'Charlie', wallet: { BTC: 0.01, ETH: 0.02 } }
      ]);
      console.log('✅ Sample players created!');
    }

    // ✅ Create 1 default test game round if none exists
    const roundExists = await GameRound.findOne({ roundId: 'round_1' });
    if (!roundExists) {
      await GameRound.create({
        roundId: 'round_1',
        crashPoint: 3.25,
        bets: []
      });
      console.log('🎲 Test GameRound created with roundId: round_1');
    }

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

connectDB();

module.exports = mongoose;
