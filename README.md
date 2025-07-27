# 🎰 Crypto Crash Game (Backend)

A real-time multiplayer **casino-style Crash game** built in **Node.js** that allows players to place USD bets converted to **BTC/ETH** using live crypto prices. Players can **cash out** before the game crashes and earn crypto. Powered by **WebSockets**, **MongoDB**, and a **provably fair algorithm**.

---

## 🧩 Features

- Real-time crash multiplier updates (every 100ms)
- USD bets converted to real-time BTC/ETH values (via CoinGecko)
- Provably fair crash point generation
- Wallet system with simulated blockchain transactions
- WebSocket-powered multiplayer game engine
- Player bet + cashout APIs
- MongoDB data logging (wallets, rounds, transactions)

---

## ⚙️ Tech Stack

- **Node.js + Express.js**
- **MongoDB** (via Mongoose)
- **Socket.IO**
- **CoinGecko API** (for live prices)
- **Crypto module** (for provably fair crash hash)

---

## 🚀 Setup Instructions

### 1. Clone + Install

```bash
git clone https://github.com/yourusername/crypto-crash-game.git
cd crypto-crash-game
npm install
