// drop-index.js
const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crashgame');

  console.log('🧹 Connected. Dropping index "playerId_1" from players collection...');
  try {
    await mongoose.connection.db.collection('players').dropIndex('playerId_1');
    console.log('✅ Index dropped successfully!');
  } catch (err) {
    console.error('⚠️ Error dropping index:', err.message);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
};

run();
