// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('./config/db');
const gameRoutes = require('./routes/game');
const walletRoutes = require('./routes/wallet');
const playerRoutes = require('./routes/player');
const generateCrashPoint = require('./utils/fairCrash');
const GameRound = require('./models/GameRound');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/players', playerRoutes);
app.use(express.static('public')); // WebSocket test client

// WebSocket setup
io.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected');
  });
});

// Game round management
let currentMultiplier = 1.0;
let gameInProgress = false;
let multiplierInterval;

function startNewRound() {
  const seed = crypto.randomBytes(16).toString('hex');
  const salt = `round-${Date.now()}`;
  const fairness = generateCrashPoint(seed, salt); // { crashPoint, seed, salt, hash }
  const crashPoint = fairness.crashPoint;
  const startTime = new Date();

  const newRound = new GameRound({
    roundId: salt,
    crashPoint,
    startTime,
    status: 'betting',
    provablyFair: {
      seed: fairness.seed,
      salt: fairness.salt
    }
  });

  newRound.save().catch(err => console.error('DB Save Error:', err));

  currentMultiplier = 1.0;
  gameInProgress = false;

  // Notify clients: betting phase started
  console.log(`🟡 Betting phase started for ${salt}`);
  io.emit('bettingPhaseStarted', {
    roundId: salt,
    startTime,
    countdown: 10
  });

  // Wait 10 seconds, then start actual round
  setTimeout(() => {
    gameInProgress = true;

    GameRound.findOneAndUpdate(
      { roundId: salt },
      { status: 'ongoing' }
    ).exec();

    console.log(`🎮 Round started ${salt} - crash at ${crashPoint}x`);
    io.emit('roundStarted', {
      roundId: salt,
      crashPoint,
      startTime: new Date()
    });

    multiplierInterval = setInterval(() => {
      currentMultiplier += 0.05;
      io.emit('multiplierUpdate', { multiplier: currentMultiplier.toFixed(2) });

      if (currentMultiplier >= crashPoint) {
        clearInterval(multiplierInterval);
        gameInProgress = false;

        GameRound.findOneAndUpdate(
          { roundId: salt },
          { status: 'crashed', endTime: new Date() }
        ).exec();

        io.emit('roundCrashed', {
          roundId: salt,
          crashPoint: crashPoint.toFixed(2),
          seed: fairness.seed,
          salt: fairness.salt,
          hash: fairness.hash
        });

        setTimeout(startNewRound, 10000); // 10s before next round
      }
    }, 100); // Update every 100ms
  }, 10000); // 10s betting phase
}


// Start the first round after 3s
setTimeout(startNewRound, 3000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
