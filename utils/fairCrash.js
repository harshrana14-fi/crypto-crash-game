// utils/fairCrash.js
const crypto = require('crypto');

module.exports = function generateCrashPoint(seed, salt) {
  const hash = crypto.createHash('sha256').update(seed + salt).digest('hex');
  
  // Convert first 8 chars of hash to number
  const hashNum = parseInt(hash.substring(0, 8), 16);
  
  // Generate crash point between 1.01x and 50x
  const crashPoint = Math.max(1.01, (hashNum % 4900) / 100 + 1.01);
  
  return {
    crashPoint: Math.round(crashPoint * 100) / 100,
    seed,
    salt,
    hash
  };
};