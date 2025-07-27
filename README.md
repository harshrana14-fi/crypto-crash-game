# 🚀 Crypto Crash Game

A real-time multiplayer cryptocurrency betting game where players place bets and cash out before the multiplier crashes. Built with Node.js, Express, Socket.io, and MongoDB.

## 🎮 Game Overview

Players bet USD amounts (converted to BTC/ETH) and watch a multiplier increase from 1.00x. The goal is to cash out before the multiplier "crashes" at a random point. The longer you wait, the higher the potential payout, but if you wait too long and the game crashes, you lose your bet.

## 🏗️ Architecture

- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: WebSockets for live multiplier updates
- **Crypto Prices**: CoinGecko API for real-time BTC/ETH prices
- **Fairness**: Provably fair algorithm using cryptographic hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd crypto-crash-game
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/crypto-crash

# Server Configuration
PORT=5000
```

### 3. Database Setup

Initialize the database with sample players:

```bash
# Seed players with initial crypto balances
node scripts/seedPlayers.js

# Fix any database issues (if needed)
node scripts/fixDatabase.js
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev
```

### 5. Access the Game

Open your browser and navigate to `http://localhost:5000/index.html`

## 🔧 Crypto API Configuration

### CoinGecko API

The game uses the **free** CoinGecko API for real-time cryptocurrency prices. No API key required!

- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Rate Limit**: 10-30 calls/minute (free tier)
- **Caching**: Prices cached for 10 seconds to avoid rate limits

**Supported Cryptocurrencies:**
- Bitcoin (BTC)
- Ethereum (ETH)

### Price Fetching Logic

```javascript
// services/cryptoAPI.js
const getPrice = async (symbol) => {
  const coinId = symbolToId[symbol]; // BTC -> bitcoin, ETH -> ethereum
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
  );
  return response.data[coinId].usd;
};
```

## 📡 API Endpoints

### Game Endpoints

#### Place Bet
```http
POST /api/game/bet
Content-Type: application/json

{
  "playerId": "6885fa4a75debd33e2dd7000",
  "usdAmount": 10.00,
  "currency": "BTC",
  "roundId": "round-1753632494712"
}
```

**Response:**
```json
{
  "message": "Bet placed successfully",
  "cryptoAmount": 0.00008418,
  "remainingBalance": 0.09991582
}
```

#### Cash Out
```http
POST /api/game/cashout
Content-Type: application/json

{
  "playerId": "6885fa4a75debd33e2dd7000",
  "roundId": "round-1753632494712",
  "currentMultiplier": 2.45
}
```

**Response:**
```json
{
  "message": "Cashed out successfully",
  "cryptoPayout": 0.00020624,
  "usdEquivalent": 24.50,
  "newBalance": 0.10012206
}
```

### Wallet Endpoints

#### Get Player Wallet
```http
GET /api/wallet/:playerId
```

**Response:**
```json
{
  "crypto": {
    "BTC": 0.09991582,
    "ETH": 2.0
  },
  "usdEquivalent": {
    "BTC": "11858.23",
    "ETH": "6000.00"
  }
}
```

### Player Endpoints

#### Get All Players
```http
GET /api/players
```

#### Create Player
```http
POST /api/players
Content-Type: application/json

{
  "name": "Charlie"
}
```

## 🔌 WebSocket Events

### Client → Server Events

The client automatically connects and listens. No manual events need to be sent.

### Server → Client Events

#### `bettingPhaseStarted`
Triggered when a new round begins and betting is open.

```javascript
{
  "roundId": "round-1753632494712",
  "startTime": "2025-07-27T16:08:14.713Z",
  "countdown": 10
}
```

#### `roundStarted`
Triggered when the multiplier starts increasing.

```javascript
{
  "roundId": "round-1753632494712",
  "seed": "a1b2c3d4e5f6...",
  "salt": "round-1753632494712"
}
```

#### `multiplierUpdate`
Sent every 100ms during the round with current multiplier.

```javascript
{
  "multiplier": "2.45"
}
```

#### `roundCrashed`
Triggered when the round ends (crash occurs).

```javascript
{
  "roundId": "round-1753632494712",
  "crashPoint": "3.67",
  "seed": "a1b2c3d4e5f6...",
  "salt": "round-1753632494712",
  "hash": "sha256hash..."
}
```

#### `betPlaced`
Broadcast when any player places a bet.

```javascript
{
  "playerId": "6885fa4a75debd33e2dd7000",
  "playerName": "Alice",
  "usdAmount": 10,
  "cryptoAmount": 0.00008418,
  "currency": "BTC",
  "roundId": "round-1753632494712"
}
```

#### `playerCashout`
Broadcast when any player cashes out.

```javascript
{
  "playerId": "6885fa4a75debd33e2dd7000",
  "playerName": "Alice",
  "multiplier": 2.45,
  "payout": 0.00020624,
  "currency": "BTC"
}
```

## 🎲 Provably Fair Algorithm

The game uses a **provably fair** system to ensure crash points cannot be manipulated by the house or predicted by players.

### How It Works

1. **Seed Generation**: Each round generates a random 16-byte seed
2. **Salt Creation**: Unique salt using timestamp: `round-{timestamp}`
3. **Hash Calculation**: SHA-256 hash of `seed + salt`
4. **Crash Point Derivation**: First 8 characters of hash converted to crash multiplier

```javascript
// utils/fairCrash.js
function generateCrashPoint(seed, salt) {
  const hash = crypto.createHash('sha256')
    .update(seed + salt)
    .digest('hex');
  
  const hashNum = parseInt(hash.substring(0, 8), 16);
  const crashPoint = Math.max(1.01, (hashNum % 4900) / 100 + 1.01);
  
  return {
    crashPoint: Math.round(crashPoint * 100) / 100,
    seed,
    salt,
    hash
  };
}
```

### Verification

Players can verify fairness by:
1. Taking the revealed `seed` and `salt` after each round
2. Computing `SHA-256(seed + salt)`
3. Converting first 8 hex chars to decimal
4. Applying the same formula: `Math.max(1.01, (hashNum % 4900) / 100 + 1.01)`

### Distribution

- **Range**: 1.01x to 50x (approximately)
- **Average**: ~25.5x
- **High Multipliers**: Rare but possible (mathematical distribution)

## 💰 USD-to-Crypto Conversion Logic

### Real-time Price Fetching

```javascript
// Price fetching with caching
const getPrice = async (symbol) => {
  // Check cache (10-second TTL)
  if (cached && now - cached.timestamp < 10000) {
    return cached.price;
  }
  
  // Fetch from CoinGecko
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
  );
  
  // Cache and return
  cache[symbol] = { price, timestamp: now };
  return price;
};
```

### Conversion Process

1. **User Input**: USD amount (e.g., $10.00)
2. **Price Fetch**: Get current BTC/ETH price from CoinGecko
3. **Calculate Crypto**: `cryptoAmount = usdAmount / currentPrice`
4. **Precision**: Round to 8 decimal places for accuracy
5. **Validation**: Ensure sufficient wallet balance

### Example Conversion

```javascript
// $10 USD → BTC conversion
const usdAmount = 10.00;
const btcPrice = 118584; // Current BTC price
const cryptoAmount = (10.00 / 118584).toFixed(8); // 0.00008433 BTC
```

### Price Update Frequency

- **Fetching**: Every API call (with 10s cache)
- **Cache Duration**: 10 seconds
- **Fallback**: Use cached price if API fails
- **Error Handling**: Graceful degradation with last known price

## 🎯 Game Logic Approach

### Round Lifecycle

```
1. Betting Phase (10s) → 2. Multiplier Phase → 3. Crash → 4. Wait (10s) → Repeat
```

1. **Betting Phase** (10 seconds):
   - Players can place bets
   - Round created in database with `status: 'betting'`
   - Crash point pre-determined but hidden

2. **Multiplier Phase**:
   - Status changes to `'ongoing'`
   - Multiplier increases by 0.05 every 100ms
   - Players can cash out anytime
   - Real-time updates via WebSockets

3. **Crash Event**:
   - When multiplier reaches predetermined crash point
   - Status changes to `'crashed'`
   - All remaining bets are lost
   - Results broadcast to all clients

4. **Cooldown** (10 seconds):
   - Process payouts
   - Update leaderboards
   - Prepare next round

### Bet Management

- **Placement**: Only during betting phase
- **Validation**: Check player balance and round status
- **Storage**: Bet stored in round document with player reference
- **State Tracking**: `cashedOut` boolean and `multiplierAtCashout` value

### Cashout Logic

- **Timing**: Only during multiplier phase
- **Calculation**: `payout = originalBet * currentMultiplier`
- **Instant**: Immediate credit to player wallet
- **Finality**: Cannot cash out twice

## 🔧 Technical Implementation

### WebSocket Architecture

```javascript
// Real-time multiplier updates
multiplierInterval = setInterval(() => {
  currentMultiplier += 0.05;
  io.emit('multiplierUpdate', { 
    multiplier: currentMultiplier.toFixed(2) 
  });
}, 100); // 100ms intervals = smooth animation
```

### Error Handling

- **Network Issues**: Graceful degradation with cached prices
- **Database Errors**: Comprehensive error logging and user feedback
- **WebSocket Disconnects**: Automatic reconnection on client side
- **Invalid Bets**: Clear validation messages
- **Race Conditions**: Atomic database operations

### Security Considerations

- **Input Validation**: All user inputs sanitized and validated
- **Rate Limiting**: Prevent spam betting (can be added)
- **Authentication**: Player ID validation
- **Fairness**: Cryptographically secure random generation
- **Balance Checks**: Prevent overdraft/negative balances

## 📊 Monitoring and Debugging

### Debug Information

The client includes a debug panel showing:
- WebSocket connection status
- Round status changes
- Bet placement confirmations
- Error messages with timestamps

### Server Logging

```javascript
console.log('🟡 Betting phase started for round-xxx');
console.log('🎮 Round started - crash at 3.67x');
console.log('✅ Bet placed: Alice $10 BTC');
console.log('💸 Cashout: Alice at 2.45x');
console.log('💥 Round crashed at 3.67x');
```

## 🧪 Testing

### Manual Testing

1. **Start server**: `npm run dev`
2. **Seed database**: `npm run seed`
3. **Open browser**: `http://localhost:5000/index.html`
4. **Test flow**:
   - Select player (Alice/Bob)
   - Place bet during betting phase
   - Watch multiplier increase
   - Cash out before crash

### Test Scenarios

- ✅ Place bet during betting phase
- ✅ Try to bet during multiplier phase (should fail)
- ✅ Cash out at various multipliers
- ✅ Let bet ride until crash
- ✅ Check wallet balance updates
- ✅ Verify provably fair calculation

## 🚀 Deployment

### Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/crypto-crash
PORT=5000
```

### Production Setup

1. **Database**: Use MongoDB Atlas or dedicated MongoDB server
2. **Process Manager**: PM2 for Node.js process management
3. **Reverse Proxy**: Nginx for serving static files and SSL
4. **SSL Certificate**: Let's Encrypt for HTTPS
5. **Monitoring**: Application monitoring (New Relic, DataDog, etc.)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://coingecko.com) for free cryptocurrency price API
- [Socket.io](https://socket.io) for real-time WebSocket communication
- [MongoDB](https://mongodb.com) for flexible document database
- [Express.js](https://expressjs.com) for robust web framework

---
