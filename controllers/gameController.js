// controllers/gameController.js
const Player = require('../models/Player');
const GameRound = require('../models/GameRound');
const Transaction = require('../models/Transaction');
const getPrice = require('../services/cryptoAPI');
const mockTxHash = require('../utils/mockTxHash');

exports.placeBet = async (req, res) => {
  try {
    console.log('🎰 Bet request received:', req.body);
    
    const { playerId, usdAmount, currency, roundId } = req.body;

    // ✅ Enhanced validation
    if (!playerId || !usdAmount || usdAmount <= 0 || !currency || !roundId) {
      console.log('❌ Invalid bet details:', { playerId, usdAmount, currency, roundId });
      return res.status(400).json({ error: "Missing or invalid bet details" });
    }

    // ✅ Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      console.log('❌ Player not found:', playerId);
      return res.status(404).json({ error: "Player not found" });
    }

    console.log('✅ Player found:', player.name, 'Wallet:', player.wallet);

    // ✅ Check if round exists with detailed logging
    const round = await GameRound.findOne({ roundId });
    if (!round) {
      console.log('❌ Round not found:', roundId);
      // List available rounds for debugging
      const availableRounds = await GameRound.find().sort({ startTime: -1 }).limit(3);
      console.log('Available rounds:', availableRounds.map(r => ({ 
        id: r.roundId, 
        status: r.status,
        startTime: r.startTime 
      })));
      return res.status(404).json({ error: "Round not found" });
    }

    console.log('✅ Round found:', {
      roundId: round.roundId,
      status: round.status,
      startTime: round.startTime,
      betsCount: round.bets?.length || 0
    });

    // ✅ Check round status with detailed logging
    if (!round.status) {
      console.log('❌ Round status is undefined, setting to betting');
      // Try to fix missing status
      round.status = 'betting';
      await round.save();
    }

    if (round.status !== 'betting') {
      console.log('❌ Round not in betting phase:', round.status);
      return res.status(400).json({ 
        error: `Betting phase has ended. Current status: ${round.status}` 
      });
    }

    // ✅ Get crypto price with error handling
    let price;
    try {
      price = await getPrice(currency);
      console.log(`💰 ${currency} price: ${price}`);
    } catch (priceError) {
      console.error('❌ Price fetch error:', priceError.message);
      return res.status(500).json({ error: "Unable to fetch crypto price" });
    }

    const cryptoAmount = +(usdAmount / price).toFixed(8);
    console.log(`🔢 Crypto amount needed: ${cryptoAmount} ${currency}`);

    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      return res.status(400).json({ error: "Invalid crypto amount calculated" });
    }

    // ✅ Initialize wallet if needed
    if (typeof player.wallet[currency] !== 'number') {
      player.wallet[currency] = 0;
    }

    if (player.wallet[currency] < cryptoAmount) {
      console.log(`❌ Insufficient balance: Has ${player.wallet[currency]} ${currency}, needs ${cryptoAmount}`);
      return res.status(400).json({ 
        error: `Insufficient balance. You have ${player.wallet[currency]} ${currency}, need ${cryptoAmount}` 
      });
    }

    // ✅ Check if player already has active bet in this round
    if (!round.bets) {
      round.bets = []; // Initialize if undefined
    }

    const existingBet = round.bets.find(bet => 
      bet.playerId.toString() === playerId && !bet.cashedOut
    );
    
    if (existingBet) {
      console.log('❌ Player already has active bet in this round');
      return res.status(400).json({ error: "You already have an active bet in this round" });
    }

    // ✅ Deduct from wallet
    player.wallet[currency] = +(player.wallet[currency] - cryptoAmount).toFixed(8);
    await player.save();
    console.log('✅ Wallet updated. New balance:', player.wallet[currency], currency);

    // ✅ Create transaction record
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
    console.log('✅ Transaction saved:', tx.transactionHash);

    // ✅ Add bet to round
    round.bets.push({
      playerId,
      usdAmount,
      cryptoAmount,
      currency,
      cashedOut: false,
      multiplierAtCashout: null
    });
    await round.save();
    console.log('✅ Bet added to round. Total bets:', round.bets.length);

    // ✅ Emit bet placed event if io is available
    if (req.io) {
      req.io.emit('betPlaced', {
        playerId,
        playerName: player.name,
        usdAmount,
        cryptoAmount,
        currency,
        roundId
      });
    }

    res.json({ 
      message: "Bet placed successfully", 
      cryptoAmount,
      remainingBalance: player.wallet[currency]
    });

  } catch (err) {
    console.error("❌ Server Error (placeBet):", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

exports.cashOut = async (req, res) => {
  try {
    console.log('💸 Cashout request received:', req.body);
    
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

    const bet = round.bets.find(b => 
      b.playerId.toString() === playerId && !b.cashedOut
    );
    
    if (!bet) {
      console.log('❌ No active bet found for player:', playerId);
      return res.status(400).json({ error: "No active bet found for player" });
    }

    // ✅ Get current price for payout calculation
    const price = await getPrice(bet.currency);
    const cryptoPayout = +(bet.cryptoAmount * currentMultiplier).toFixed(8);
    const usdPayout = +(cryptoPayout * price).toFixed(2);

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: "Player not found" });

    // ✅ Add winnings to wallet
    if (typeof player.wallet[bet.currency] !== 'number') player.wallet[bet.currency] = 0;
    player.wallet[bet.currency] = +(player.wallet[bet.currency] + cryptoPayout).toFixed(8);
    await player.save();

    // ✅ Update bet as cashed out
    const betIndex = round.bets.findIndex(b => 
      b.playerId.toString() === playerId && !b.cashedOut
    );
    
    if (betIndex === -1) {
      return res.status(400).json({ error: "No active bet found for player" });
    }

    await GameRound.updateOne(
      { _id: round._id, [`bets.${betIndex}.cashedOut`]: false },
      {
        $set: {
          [`bets.${betIndex}.cashedOut`]: true,
          [`bets.${betIndex}.multiplierAtCashout`]: currentMultiplier
        }
      }
    );

    // ✅ Save cashout transaction
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

    // ✅ Emit event so frontend can update
    if (req.io) {
      req.io.emit("playerCashout", {
        playerId,
        playerName: player.name,
        multiplier: currentMultiplier,
        payout: cryptoPayout,
        currency: bet.currency
      });
    }

    console.log('✅ Successful cashout:', { cryptoPayout, usdPayout });

    res.json({
      message: "Cashed out successfully",
      cryptoPayout,
      usdEquivalent: usdPayout,
      newBalance: player.wallet[bet.currency]
    });

  } catch (err) {
    console.error("❌ Server Error (cashOut):", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};