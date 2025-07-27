// scripts/seedPlayers.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-crash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
  timestamps: true
});

const Player = mongoose.model('Player', playerSchema);

async function seedPlayers() {
  try {
    console.log('🌱 Seeding players...');

    // Clear existing players
    await Player.deleteMany({});
    console.log('🗑️ Cleared existing players');

    // Create players with specific IDs that match the frontend
    const alice = new Player({
      _id: '6885fa4a75debd33e2dd7000',
      name: 'Alice',
      wallet: {
        BTC: 0.1,     // ~$11,858 at current BTC price
        ETH: 2.0      // ~$6,000 at current ETH price
      }
    });

    const bob = new Player({
      _id: '6885fa4a75debd33e2dd7001', 
      name: 'Bob',
      wallet: {
        BTC: 0.05,    // ~$5,929 at current BTC price
        ETH: 1.0      // ~$3,000 at current ETH price
      }
    });

    await alice.save();
    await bob.save();

    console.log('✅ Players seeded successfully:');
    console.log(`   👩 Alice (${alice._id}): ${alice.wallet.BTC} BTC, ${alice.wallet.ETH} ETH`);
    console.log(`   👨 Bob (${bob._id}): ${bob.wallet.BTC} BTC, ${bob.wallet.ETH} ETH`);

    // Verify the players were created
    const players = await Player.find();
    console.log(`\n📊 Total players in database: ${players.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedPlayers();