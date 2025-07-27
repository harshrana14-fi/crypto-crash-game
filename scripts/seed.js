// scripts/seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI; 'mongodb://localhost:27017/cryptoCrash';

const mockPlayers = [
  {
    name: 'Alice',
    wallet: { BTC: 0.002, ETH: 0.1 }
  },
  {
    name: 'Bob',
    wallet: { BTC: 0.001, ETH: 0.05 }
  },
  {
    name: 'Charlie',
    wallet: { BTC: 0.0005, ETH: 0.02 }
  },
  {
    name: 'Dave',
    wallet: { BTC: 0.0015, ETH: 0.08 }
  }
];

async function seedPlayers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Player.deleteMany(); // Clear old data
    const inserted = await Player.insertMany(mockPlayers);

    console.log(`🌱 Seeded ${inserted.length} players:`);
    inserted.forEach(p => {
      console.log(`- ${p.name} (${p._id}): BTC=${p.wallet.BTC}, ETH=${p.wallet.ETH}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedPlayers();
