const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const FinnhubService = require('./finnhub-service');
const BinanceService = require('./binance-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Kronos Prediction Service
class KronosPredictionService {
  constructor() {
    this.pythonPath = 'python3';
    this.scriptPath = path.join(__dirname, 'run_kronos_prediction.py');
  }

  async predict(symbol, days) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [this.scriptPath, symbol, days.toString()]);
      let dataString = '';
      let errorString = '';

      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error(`Kronos prediction error: ${errorString}`);
          reject(new Error(`Kronos prediction failed with code ${code}`));
        } else {
          try {
            const result = JSON.parse(dataString);
            resolve(result);
          } catch (e) {
            console.error('Failed to parse Kronos prediction result:', e);
            reject(e);
          }
        }
      });
    });
  }
}

// Binance API integration

const kronosService = new KronosPredictionService();
const finnhubService = new FinnhubService();
const binanceService = new BinanceService();

// Mock prediction fallback
function generateMockPrediction(symbol, days) {
  const basePrices = {
    'BTCUSDT': 110000,
    'ETHUSDT': 3500,
    'BNBUSDT': 600,
    'ADAUSDT': 0.48,
    'SOLUSDT': 180,
    'XRPUSDT': 0.52,
    'DOGEUSDT': 0.08,
    'MATICUSDT': 0.85,
    'AVAXUSDT': 25.5,
    'DOTUSDT': 6.2,
    'LINKUSDT': 14.8,
    'UNIUSDT': 6.5,
    'LTCUSDT': 85.2,
    'BCHUSDT': 245.6,
    'ATOMUSDT': 8.9,
    'NEARUSDT': 3.2,
    'FTMUSDT': 0.35,
    'ALGOUSDT': 0.18,
    'VETUSDT': 0.025,
    'ICPUSDT': 4.8
  };
  
  // Try exact match first
  let currentPrice = basePrices[symbol];
  
  // Try without USDT suffix if not found
  if (currentPrice === undefined) {
    const symbolWithoutUSDT = symbol.replace('USDT', '');
    currentPrice = basePrices[symbolWithoutUSDT + 'USDT'] || 100;
  }
  
  const volatility = 0.02;
  const predictedPrices = [currentPrice];
  
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.5) * currentPrice * volatility;
    predictedPrices.push(predictedPrices[i - 1] + change);
  }
  
  const predictedVolumes = [];
  const currentVolume = Math.random() * 5000000 + 1000000;
  for (let i = 0; i < days; i++) {
    const volumeChange = (Math.random() - 0.5) * currentVolume * 0.3;
    predictedVolumes.push(Math.max(100000, currentVolume + volumeChange));
  }
  
  return {
    symbol: symbol,
    currentPrice: currentPrice,
    predictedPrices: predictedPrices.slice(1),
    currentVolume: currentVolume,
    predictedVolumes: predictedVolumes,
    confidence: Math.random() * 0.3 + 0.7,
    predictionDays: days,
    volatility: volatility,
    trend: predictedPrices[days] > currentPrice ? 'Bullish' : 'Bearish',
    timestamp: Date.now(),
    dataSource: 'Mock Data'
  };
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Kronos CryptoPredict API',
    version: '2.0.0'
  });
});

app.post('/api/predict', async (req, res) => {
  try {
    const { symbol, days } = req.body;
    
    if (!symbol || !days) {
      return res.status(400).json({ error: 'Symbol and days are required' });
    }
    
    console.log(`Making prediction for ${symbol} for ${days} days using Binance`);
    
    try {
      // Use Binance as primary data source
      const prediction = await binanceService.generatePrediction(symbol, days);
      res.json(prediction);
    } catch (binanceError) {
      console.log('Binance prediction failed, falling back to Finnhub:', binanceError.message);
      
      try {
        // Fallback to Finnhub
        const prediction = await finnhubService.generatePrediction(symbol, days);
        res.json(prediction);
      } catch (finnhubError) {
        console.log('Finnhub prediction failed, falling back to Kronos:', finnhubError.message);
        
        try {
          // Fallback to Kronos
          const prediction = await kronosService.predict(symbol, days);
          res.json(prediction);
        } catch (kronosError) {
          console.log('Kronos prediction failed, using mock data:', kronosError.message);
          
          // Final fallback to mock data
          const prediction = generateMockPrediction(symbol, days);
          res.json(prediction);
        }
      }
    }
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

app.get('/api/crypto/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const ticker = await binanceService.getTickerPrice(symbol);
    
    res.json({
      symbol: ticker.symbol,
      price: parseFloat(ticker.lastPrice),
      change: parseFloat(ticker.priceChange),
      changePercent: parseFloat(ticker.priceChangePercent),
      volume: parseFloat(ticker.volume),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Crypto info error:', error);
    res.status(500).json({ error: 'Failed to fetch crypto info' });
  }
});

app.get('/api/cryptos/popular', async (req, res) => {
  try {
    const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'MATICUSDT', 'AVAXUSDT', 'DOTUSDT'];
    const popularTickers = [];
    
    // Fetch all tickers in parallel for better performance
    const tickerPromises = popularSymbols.map(async (symbol) => {
      try {
        const ticker = await binanceService.getTickerPrice(symbol);
        return {
          symbol: ticker.symbol,
          name: getCryptoName(ticker.symbol),
          price: parseFloat(ticker.lastPrice),
          change: parseFloat(ticker.priceChange),
          changePercent: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          timestamp: Date.now(),
          rank: popularSymbols.indexOf(symbol) + 1
        };
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        // Return mock data for failed symbols
        return {
          symbol: symbol,
          name: getCryptoName(symbol),
          price: getMockPrice(symbol),
          change: 0,
          changePercent: 0,
          volume: 0,
          high24h: 0,
          low24h: 0,
          timestamp: Date.now(),
          rank: popularSymbols.indexOf(symbol) + 1
        };
      }
    });
    
    const results = await Promise.all(tickerPromises);
    const validTickers = results.filter(ticker => ticker !== null);
    
    res.json(validTickers);
  } catch (error) {
    console.error('Popular cryptos error:', error);
    res.status(500).json({ error: 'Failed to fetch popular cryptos' });
  }
});

// Helper function to get mock price
function getMockPrice(symbol) {
  const prices = {
    'BTCUSDT': 110000,
    'ETHUSDT': 3500,
    'BNBUSDT': 600,
    'ADAUSDT': 0.48,
    'SOLUSDT': 180,
    'XRPUSDT': 0.52,
    'DOGEUSDT': 0.08,
    'MATICUSDT': 0.85,
    'AVAXUSDT': 25.5,
    'DOTUSDT': 6.2
  };
  return prices[symbol] || 100;
}

function getCryptoName(symbol) {
  const names = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'BNB',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'XRPUSDT': 'XRP',
    'DOTUSDT': 'Polkadot',
    'DOGEUSDT': 'Dogecoin'
  };
  return names[symbol] || symbol.replace('USDT', '');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kronos CryptoPredict API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Data source: Binance API`);
});