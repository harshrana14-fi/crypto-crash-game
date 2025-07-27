// seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Player = require('./models/Player');
const GameRound = require('./models/GameRound');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/crashgame";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("🌱 Connected to MongoDB");

  // Clear existing data
  await Player.deleteMany({});
  await GameRound.deleteMany({});

  // Sample players
  const players = await Player.insertMany([
    { name: "Alice", wallet: { BTC: 0.005, ETH: 0.1 } },
    { name: "Bob", wallet: { BTC: 0.002, ETH: 0.05 } },
    { name: "Charlie", wallet: { BTC: 0.01, ETH: 0.2 } }
  ]);

  // Sample game round
  await GameRound.create({
    roundId: "round_1234",
    crashPoint: 3.24,
    startTime: new Date(),
    bets: [] // empty at first
  });

  console.log("✅ Seeded players and game round:");
  players.forEach(p => console.log(` - ${p.name} (${p._id})`));

  await mongoose.disconnect();
  console.log("🌱 Disconnected");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
