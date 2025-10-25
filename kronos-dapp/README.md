# 🚀 Kronos CryptoPredict - AI-Powered Cryptocurrency Prediction Platform

A decentralized application built on Solana that leverages Kronos AI models for intelligent cryptocurrency price predictions with real-time Binance data integration.

## ✨ Features

- **AI-Powered Predictions**: Advanced machine learning models for accurate cryptocurrency price forecasting
- **Real-time Data**: Live market data integration from Binance API
- **Interactive Charts**: Beautiful, responsive charts with prediction overlays
- **Blockchain Integration**: Solana program for storing and verifying predictions
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Wallet Integration**: Seamless connection with Phantom and other Solana wallets
- **Risk Analysis**: Comprehensive risk assessment and confidence metrics

## 🏗️ Architecture

```
┌─────────────────────────────┐
│       Web Frontend          │
│    (Next.js + React)        │
└──────────────┬──────────────┘
               │
    Solana Wallet Adapter
               │
┌──────────────┴──────────────┐
│    Solana Program (Rust)    │
│   Prediction Storage &      │
│      Verification           │
└──────────────┬──────────────┘
               │
        Solana Devnet
               │
┌──────────────┴──────────────┐
│    Binance API Service      │
│   Real-time Crypto Data     │
│      & Price Feeds          │
└─────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Rust 1.70+
- Solana CLI
- Anchor Framework

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kronos-dapp
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../app
   npm install
   ```

3. **Start the services**
   ```bash
   # Start backend server
   cd server
   npm start

   # Start frontend (new terminal)
   cd app
   PORT=3002 npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3002`

## 📁 Project Structure

```
kronos-dapp/
├── programs/
│   └── kronos_dapp/          # Solana program (Rust)
├── app/                      # Next.js frontend
│   ├── app/
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities and services
│   │   └── globals.css      # Global styles
│   └── package.json
├── server/                   # Backend API with Binance integration
│   ├── index.js
│   └── package.json
├── scripts/
│   └── deploy.sh            # Deployment script
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `app` directory:

```env
NEXT_PUBLIC_SOLANA_NETWORK=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<your_program_id>
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

## 🎯 Usage

1. **Connect Wallet**: Click the wallet button to connect your Solana wallet
2. **Select Cryptocurrency**: Choose a crypto symbol from the sidebar (BTCUSDT, ETHUSDT, etc.)
3. **Set Parameters**: Select prediction timeframe (5-30 days)
4. **Generate Prediction**: Click "Start Prediction" to run AI analysis
5. **View Results**: Explore interactive charts and detailed analysis
6. **Store on Chain**: Save predictions to Solana blockchain for verification

## 🧠 AI Integration

The platform integrates with Kronos AI models to provide:
- **Price Predictions**: Multi-day forecasting with confidence intervals
- **Risk Assessment**: Volatility analysis and risk metrics
- **Trend Analysis**: Bullish/bearish market sentiment
- **Confidence Scoring**: Model reliability indicators

## 📊 Data Sources

- **Binance API**: Real-time cryptocurrency price data
- **Historical Data**: 30-day price history for analysis
- **Market Metrics**: Volume, volatility, and trend indicators

## 🔒 Security

- **Wallet Integration**: Secure transaction signing with user's private key
- **On-chain Verification**: All predictions stored and verified on Solana
- **Data Integrity**: Immutable prediction history on blockchain
- **User Privacy**: No sensitive data stored off-chain

## 🌐 Access Points

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@kronos.ai

---

**Built with ❤️ by the Kronos Team - Version 2.0**
