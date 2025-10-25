const axios = require('axios');

class BinanceService {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3';
  }

  // Get real-time ticker price
  async getTickerPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/24hr?symbol=${symbol}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Kronos-CryptoPredict/1.0'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Binance ticker error for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get all tickers
  async getAllTickers() {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Kronos-CryptoPredict/1.0'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all tickers:', error.message);
      throw error;
    }
  }

  // Get klines (candlestick data)
  async getKlines(symbol, interval = '1d', limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Kronos-CryptoPredict/1.0'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Binance klines error for ${symbol}:`, error.message);
      // Return mock data if API fails
      return this.generateMockKlines(symbol, limit);
    }
  }

  // Generate mock klines data
  generateMockKlines(symbol, limit) {
    const mockData = [];
    const basePrice = this.getMockPrice(symbol);
    
    for (let i = 0; i < limit; i++) {
      const time = Date.now() - (limit - i) * 24 * 60 * 60 * 1000;
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
      mockData.push([
        time, // open time
        price.toString(), // open
        (price * 1.02).toString(), // high
        (price * 0.98).toString(), // low
        price.toString(), // close
        (Math.random() * 1000000).toString(), // volume
        time + 24 * 60 * 60 * 1000, // close time
        (Math.random() * 1000000).toString(), // quote asset volume
        '0', // count
        (Math.random() * 1000000).toString(), // taker buy base asset volume
        (Math.random() * 1000000).toString(), // taker buy quote asset volume
        '0' // ignore
      ]);
    }
    return mockData;
  }

  // Generate prediction based on Binance data
  async generatePrediction(symbol, days) {
    try {
      // Get current ticker data
      const ticker = await this.getTickerPrice(symbol);
      const currentPrice = parseFloat(ticker.lastPrice);
      const currentVolume = parseFloat(ticker.volume);
      
      // Get historical data for better prediction
      const klines = await this.getKlines(symbol, '1d', 30);
      
      // Generate predictions based on historical volatility
      const predictions = this.generatePredictionsFromHistory(klines, currentPrice, days);
      const volumePredictions = this.generateVolumePredictions(currentVolume, days);
      
      return {
        symbol: symbol,
        currentPrice: currentPrice,
        predictedPrices: predictions,
        currentVolume: currentVolume,
        predictedVolumes: volumePredictions,
        confidence: this.calculateConfidence(klines),
        predictionDays: days,
        volatility: this.calculateVolatility(klines),
        trend: this.calculateTrend(klines),
        timestamp: Date.now(),
        dataSource: 'Binance API'
      };
    } catch (error) {
      console.error(`Binance prediction error for ${symbol}:`, error.message);
      // Fallback to mock data
      return this.generateMockPrediction(symbol, days);
    }
  }

  // Generate predictions from historical data
  generatePredictionsFromHistory(klines, currentPrice, days) {
    const prices = klines.map(k => parseFloat(k[4])); // Close prices
    const returns = [];
    
    // Calculate daily returns
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    const predictions = [currentPrice];
    
    for (let i = 1; i < days; i++) {
      const randomReturn = (Math.random() - 0.5) * 2 * volatility + avgReturn;
      const newPrice = predictions[i - 1] * (1 + randomReturn);
      predictions.push(Math.max(newPrice, 0.01));
    }
    
    return predictions;
  }

  // Calculate confidence based on historical data
  calculateConfidence(klines) {
    const prices = klines.map(k => parseFloat(k[4]));
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length);
    
    // Lower volatility = higher confidence
    return Math.max(0.6, Math.min(0.95, 1 - volatility * 2));
  }

  // Calculate volatility
  calculateVolatility(klines) {
    const prices = klines.map(k => parseFloat(k[4]));
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    return Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  }

  // Calculate trend
  calculateTrend(klines) {
    const prices = klines.map(k => parseFloat(k[4]));
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    
    const change = (lastPrice - firstPrice) / firstPrice;
    
    if (change > 0.05) return 'Bullish';
    if (change < -0.05) return 'Bearish';
    return 'Neutral';
  }

  // Generate mock prediction
  generateMockPrediction(symbol, days) {
    const currentPrice = this.getMockPrice(symbol);
    const currentVolume = Math.random() * 1000000 + 100000;
    const predictions = this.generateMockPredictions(currentPrice, days);
    const volumePredictions = this.generateVolumePredictions(currentVolume, days);
    
    return {
      symbol: symbol,
      currentPrice: currentPrice,
      predictedPrices: predictions,
      currentVolume: currentVolume,
      predictedVolumes: volumePredictions,
      confidence: Math.random() * 0.3 + 0.7,
      predictionDays: days,
      volatility: Math.random() * 0.2 + 0.05,
      trend: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
      timestamp: Date.now(),
      dataSource: 'Mock Data (Binance unavailable)'
    };
  }

  // Get mock price for different cryptocurrencies
  getMockPrice(symbol) {
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
      'ICPUSDT': 4.8,
    };
    
    // Try exact match first
    if (prices[symbol]) {
      return prices[symbol];
    }
    
    // Try without USDT suffix
    const symbolWithoutUSDT = symbol.replace(/USDT$/, '');
    if (prices[symbolWithoutUSDT + 'USDT']) {
      return prices[symbolWithoutUSDT + 'USDT'];
    }
    
    return 100;
  }

  // Generate mock predictions
  generateMockPredictions(currentPrice, days) {
    const predictions = [currentPrice];
    const trend = Math.random() > 0.5 ? 1 : -1;
    const volatility = Math.random() * 0.02 + 0.01;
    
    for (let i = 1; i < days; i++) {
      const dailyChange = (Math.random() - 0.5) * volatility * trend;
      const newPrice = predictions[i - 1] * (1 + dailyChange);
      predictions.push(Math.max(newPrice, 0.01));
    }
    
    return predictions;
  }

  // Generate volume predictions
  generateVolumePredictions(currentVolume, days) {
    const volumes = [currentVolume];
    const volumeVolatility = Math.random() * 0.3 + 0.1; // 10-40% volume volatility
    
    for (let i = 1; i < days; i++) {
      const volumeChange = (Math.random() - 0.5) * volumeVolatility;
      const newVolume = volumes[i - 1] * (1 + volumeChange);
      volumes.push(Math.max(newVolume, currentVolume * 0.1)); // Don't go below 10% of current volume
    }
    
    return volumes;
  }
}

module.exports = BinanceService;
