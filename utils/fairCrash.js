// utils/fairCrash.js
const crypto = require('crypto');

function hashToFloat(seed, salt) {
  const hash = crypto.createHash('sha256').update(seed + salt).digest('hex');
  const intValue = parseInt(hash.slice(0, 13), 16);
  const float = intValue / 0xFFFFFFFFFFFFF;
  return { float, hash };
}

function generateCrashRound(seed, salt) {
  const { float: r, hash } = hashToFloat(seed, salt);
  const crash = r >= 1 ? 1.0 : Math.min(Math.floor(100 * (1 / (1 - r))) / 100, 100);
  
  return {
    crashPoint: crash,
    hash,
    seed,
    salt
  };
}

module.exports = generateCrashRound;
