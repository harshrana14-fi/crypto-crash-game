// utils/mockTxHash.js
const crypto = require('crypto');

module.exports = function mockTxHash() {
  return crypto.randomBytes(32).toString('hex');
};