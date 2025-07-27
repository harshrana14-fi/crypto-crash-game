// services/gameLogic.js
function getMultiplier(elapsed, rate = 0.06) {
  return +(1 * Math.exp(rate * elapsed)).toFixed(2);
}

module.exports = getMultiplier;
