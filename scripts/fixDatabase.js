// scripts/fixDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-crash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const gameRoundSchema = new mongoose.Schema({
  roundId: { type: String, required: true, unique: true },
  crashPoint: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ['betting', 'ongoing', 'crashed'], 
    default: 'betting',
    required: true 
  },
  bets: [
    {
      playerId: { type: String, required: true },
      usdAmount: { type: Number, required: true },
      cryptoAmount: { type: Number, required: true },
      currency: { type: String, required: true },
      cashedOut: { type: Boolean, default: false },
      multiplierAtCashout: { type: Number }
    }
  ],
  provablyFair: {
    seed: { type: String, required: true },
    salt: { type: String, required: true }
  }
}, {
  timestamps: true
});

const GameRound = mongoose.model('GameRound', gameRoundSchema);

async function fixDatabase() {
  try {
    console.log('🔧 Starting database cleanup...');

    // Find rounds with undefined status
    const brokenRounds = await GameRound.find({ 
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: undefined }
      ]
    });

    console.log(`Found ${brokenRounds.length} rounds with undefined status`);

    // Fix each broken round
    for (const round of brokenRounds) {
      let newStatus = 'crashed'; // Default to crashed for old rounds
      
      // If the round is recent (within last hour), might still be active
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (round.startTime > oneHourAgo && !round.endTime) {
        newStatus = 'betting'; // Assume recent rounds without end time are betting
      }

      await GameRound.updateOne(
        { _id: round._id },
        { 
          status: newStatus,
          bets: round.bets || [] // Ensure bets array exists
        }
      );

      console.log(`✅ Fixed round ${round.roundId}: status set to ${newStatus}`);
    }

    // Clean up any rounds without required fields
    const roundsToClean = await GameRound.find({
      $or: [
        { bets: { $exists: false } },
        { bets: null }
      ]
    });

    for (const round of roundsToClean) {
      await GameRound.updateOne(
        { _id: round._id },
        { bets: [] }
      );
      console.log(`✅ Fixed bets array for round ${round.roundId}`);
    }

    // Show current database state
    const allRounds = await GameRound.find().sort({ startTime: -1 }).limit(5);
    console.log('\n📊 Recent rounds in database:');
    allRounds.forEach(round => {
      console.log(`   ${round.roundId}: ${round.status} (${round.bets?.length || 0} bets)`);
    });

    console.log('\n✅ Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

fixDatabase();