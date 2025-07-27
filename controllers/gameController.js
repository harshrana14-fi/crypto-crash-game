const Player = require('../models/Player');
const GameRound = require('../models/GameRound');
const Transaction = require('../models/Transaction');
const getPrice = require('../services/cryptoAPI');
const mockTxHash = require('../utils/mockTxHash');

exports.placeBet = async (req, res) => {
  try {
    const { playerId, usdAmount, currency, roundId } = req.body;

    if (!playerId || !usdAmount || usdAmount <= 0 || !currency || !roundId) {
      return res.status(400).json({ error: "Missing or invalid bet details" });
    }

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: "Player not found" });

    // ✅ Use currency like "BTC" or "ETH" directly
    const price = await getPrice(currency);
    const cryptoAmount = +(usdAmount / price).toFixed(8);

    if (isNaN(cryptoAmount)) return res.status(400).json({ error: "Invalid crypto amount calculated" });

    if (typeof player.wallet[currency] !== 'number') player.wallet[currency] = 0;
    if (player.wallet[currency] < cryptoAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const round = await GameRound.findOne({ roundId });
    if (!round) return res.status(404).json({ error: "Round not found" });

    // Deduct crypto and save
    player.wallet[currency] = +(player.wallet[currency] - cryptoAmount).toFixed(8);
    await player.save();

    // Record transaction
    const tx = new Transaction({
      playerId,
      usdAmount,
      cryptoAmount,
      currency,
      transactionType: 'bet',
      transactionHash: mockTxHash(),
      priceAtTime: price
    });
    await tx.save();

    // Add to game round
    round.bets.push({
      playerId,
      usdAmount,
      cryptoAmount,
      currency,
      cashedOut: false,
      multiplierAtCashout: null
    });
    await round.save();

    res.json({ message: "Bet placed", cryptoAmount });

  } catch (err) {
    console.error("❌ Server Error (placeBet):", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.cashOut = async (req, res) => {
  try {
    const { playerId, roundId, currentMultiplier } = req.body;

    if (!playerId || !roundId || !currentMultiplier) {
      return res.status(400).json({ error: "Missing cashout details" });
    }

    const round = await GameRound.findOne({ roundId });
    if (!round) {
      console.error("❌ roundId received:", roundId);
      const latest = await GameRound.find().sort({ startTime: -1 }).limit(1);
      console.log("🧪 Latest round in DB:", latest[0]?.roundId);
      return res.status(404).json({ error: "Round not found" });
    }

    const bet = round.bets.find(b => b.playerId === playerId && !b.cashedOut);
    if (!bet) return res.status(400).json({ error: "No active bet found for player" });

    const price = await getPrice(bet.currency);
    const cryptoPayout = +(bet.cryptoAmount * currentMultiplier).toFixed(8);
    const usdPayout = +(cryptoPayout * price).toFixed(2);

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: "Player not found" });

    if (typeof player.wallet[bet.currency] !== 'number') player.wallet[bet.currency] = 0;
    player.wallet[bet.currency] = +(player.wallet[bet.currency] + cryptoPayout).toFixed(8);
    await player.save();

    // Update bet
    bet.cashedOut = true;
    bet.multiplierAtCashout = currentMultiplier;
    await round.save();

    // Save cashout transaction
    const tx = new Transaction({
      playerId,
      usdAmount: usdPayout,
      cryptoAmount: cryptoPayout,
      currency: bet.currency,
      transactionType: 'cashout',
      transactionHash: mockTxHash(),
      priceAtTime: price
    });
    await tx.save();

    res.json({
      message: "Cashed out successfully",
      cryptoPayout,
      usdEquivalent: usdPayout
    });

  } catch (err) {
    console.error("❌ Server Error (cashOut):", err);
    res.status(500).json({ error: "Server error" });
  }
};
