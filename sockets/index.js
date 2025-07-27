const generateCrashPoint = require('../utils/fairCrash');
const getMultiplier = require('../services/gameLogic');
const GameRound = require('../models/GameRound');
const { v4: uuidv4 } = require('uuid');

module.exports = function (io) {
  let currentRoundId = '';
  let crashPoint = 0;
  let multiplier = 1.0;
  let interval;

  async function startRound() {
    try {
      const roundId = uuidv4();
      const seed = 'secretseed';
      const salt = Date.now().toString();
      crashPoint = generateCrashPoint(seed, salt);
      currentRoundId = roundId;

      // ✅ Emit betting phase 10 seconds before start
      io.emit('bettingPhase', { roundId, countdown: 10 });
      console.log(`🕒 Betting phase started for round ${roundId}`);

      setTimeout(async () => {
        // ✅ Save new round
        const newRound = new GameRound({
          roundId,
          crashPoint,
          startTime: new Date(),
          bets: [],
          provablyFair: { seed, salt }
        });

        await newRound.save();

        console.log(`🚀 Round Started: ${roundId}, Crash @ ${crashPoint.toFixed(2)}x`);
        io.emit('roundStart', {
          roundId,
          crashPoint,
          provablyFair: { seed, salt }
        });

        const startTime = Date.now();
        multiplier = 1.0;

        interval = setInterval(async () => {
          const elapsed = (Date.now() - startTime) / 1000;
          multiplier = getMultiplier(elapsed);
          io.emit('multiplierUpdate', { multiplier });

          if (multiplier >= crashPoint) {
            clearInterval(interval);

            await GameRound.findOneAndUpdate(
              { roundId },
              { endTime: new Date() }
            );

            console.log(`💥 Round crashed at ${crashPoint.toFixed(2)}x`);
            io.emit('roundEnd', { crashPoint });

            // Wait 10s, then start new round
            setTimeout(startRound, 10000);
          }
        }, 100);
      }, 10000); // 10 second delay = betting phase
    } catch (err) {
      console.error("❌ Round error:", err);
    }
  }

  io.on('connection', (socket) => {
    console.log("👤 New client connected");

    socket.on('cashout', ({ playerId }) => {
      io.emit('playerCashout', {
        playerId,
        multiplier
      });
    });

    socket.on('disconnect', () => {
      console.log("👋 Client disconnected");
    });
  });

  startRound();
};
