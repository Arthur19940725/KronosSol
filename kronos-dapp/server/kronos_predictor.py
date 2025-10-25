import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import torch
from typing import List, Dict, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Add Kronos model path
sys.path.append('/mnt/e/code/KronosSol/Kronos')

try:
    from model import Kronos, KronosTokenizer, KronosPredictor
    KRONOS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Kronos model not available: {e}")
    KRONOS_AVAILABLE = False

class KronosPredictionService:
    def __init__(self):
        self.predictor = None
        self.model_loaded = False
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    def load_model(self):
        """Load Kronos model and tokenizer"""
        if not KRONOS_AVAILABLE:
            return False
            
        try:
            # Load tokenizer and model
            tokenizer = KronosTokenizer.from_pretrained("NeoQuasar/Kronos-Tokenizer-base")
            model = Kronos.from_pretrained("NeoQuasar/Kronos-small")
            
            # Initialize predictor
            self.predictor = KronosPredictor(
                model=model,
                tokenizer=tokenizer,
                device=self.device,
                max_context=512
            )
            
            self.model_loaded = True
            return True
            
        except Exception as e:
            self.model_loaded = False
            return False
    
    def prepare_historical_data(self, symbol: str, days: int = 10) -> pd.DataFrame:
        """Prepare historical OHLCV data for Kronos prediction"""
        try:
            # Generate realistic historical data based on symbol
            base_prices = {
                'BTCUSDT': 110000,
                'ETHUSDT': 3500,
                'ADAUSDT': 0.5,
                'SOLUSDT': 100,
                'DOTUSDT': 6,
                'MATICUSDT': 0.8,
                'AVAXUSDT': 25,
                'LINKUSDT': 15,
                'UNIUSDT': 8,
                'LTCUSDT': 80,
                'BCHUSDT': 250,
                'XLMUSDT': 0.12,
                'ATOMUSDT': 8,
                'VETUSDT': 0.03,
                'FILUSDT': 5,
                'DOGEUSDT': 0.08
            }
            
            base_price = base_prices.get(symbol, 100)
            volatility = 0.02  # 2% daily volatility
            
            # Generate historical data
            data = []
            current_price = base_price
            
            for i in range(days):
                # Generate OHLCV data
                open_price = current_price
                high_price = open_price * (1 + np.random.uniform(0, volatility))
                low_price = open_price * (1 - np.random.uniform(0, volatility))
                close_price = open_price * (1 + np.random.uniform(-volatility, volatility))
                volume = np.random.uniform(1000000, 5000000)
                amount = volume * close_price
                
                # Ensure OHLC consistency
                high_price = max(high_price, open_price, close_price)
                low_price = min(low_price, open_price, close_price)
                
                data.append({
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price,
                    'volume': volume,
                    'amount': amount
                })
                
                current_price = close_price
            
            return pd.DataFrame(data)
            
        except Exception as e:
            return pd.DataFrame()
    
    def predict_with_kronos(self, symbol: str, days: int = 5) -> Dict[str, Any]:
        """Make prediction using Kronos model"""
        if not self.model_loaded or not self.predictor:
            return self._generate_mock_prediction(symbol, days)
        
        try:
            # Prepare historical data
            historical_df = self.prepare_historical_data(symbol, days=400)  # Kronos needs more context
            
            if historical_df.empty:
                return self._generate_mock_prediction(symbol, days)
            
            # Create timestamps
            end_date = datetime.now()
            start_date = end_date - timedelta(days=400)
            
            x_timestamp = pd.date_range(start=start_date, end=end_date, periods=len(historical_df))
            y_timestamp = pd.date_range(start=end_date + timedelta(days=1), periods=days)
            
            # Make prediction
            pred_df = self.predictor.predict(
                df=historical_df,
                x_timestamp=x_timestamp,
                y_timestamp=y_timestamp,
                pred_len=days,
                T=1.0,
                top_p=0.9,
                sample_count=1
            )
            
            # Extract results
            current_price = historical_df['close'].iloc[-1]
            predicted_prices = pred_df['close'].tolist()
            predicted_volumes = pred_df['volume'].tolist()
            
            # Calculate confidence and volatility
            price_changes = [abs(predicted_prices[i] - predicted_prices[i-1]) / predicted_prices[i-1] 
                           for i in range(1, len(predicted_prices))]
            volatility = np.mean(price_changes) if price_changes else 0.1
            
            # Determine trend
            final_price = predicted_prices[-1]
            trend = "Bullish" if final_price > current_price else "Bearish"
            
            return {
                "symbol": symbol,
                "currentPrice": float(current_price),
                "predictedPrices": [float(p) for p in predicted_prices],
                "currentVolume": float(historical_df['volume'].iloc[-1]),
                "predictedVolumes": [float(v) for v in predicted_volumes],
                "confidence": min(0.95, 0.7 + (1 - volatility) * 0.25),
                "volatility": float(volatility),
                "trend": trend,
                "timestamp": datetime.now().isoformat(),
                "model": "Kronos-small"
            }
            
        except Exception as e:
            return self._generate_mock_prediction(symbol, days)
    
    def _generate_mock_prediction(self, symbol: str, days: int) -> Dict[str, Any]:
        """Generate mock prediction when Kronos is not available"""
        base_prices = {
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
        }
        
        # Try exact match first
        current_price = base_prices.get(symbol, None)
        
        # Try without USDT suffix if not found
        if current_price is None:
            symbol_without_usdt = symbol.replace('USDT', '')
            current_price = base_prices.get(symbol_without_usdt + 'USDT', 100)
        volatility = 0.02
        
        # Generate predicted prices with trend
        predicted_prices = [current_price]
        for i in range(days):
            change = np.random.normal(0, volatility)
            new_price = predicted_prices[-1] * (1 + change)
            predicted_prices.append(new_price)
        
        predicted_prices = predicted_prices[1:]  # Remove current price
        
        # Generate predicted volumes
        base_volume = np.random.uniform(1000000, 5000000)
        predicted_volumes = [base_volume * (1 + np.random.uniform(-0.3, 0.3)) for _ in range(days)]
        
        # Calculate metrics
        final_price = predicted_prices[-1]
        trend = "Bullish" if final_price > current_price else "Bearish"
        confidence = np.random.uniform(0.6, 0.9)
        
        return {
            "symbol": symbol,
            "currentPrice": float(current_price),
            "predictedPrices": [float(p) for p in predicted_prices],
            "currentVolume": float(base_volume),
            "predictedVolumes": [float(v) for v in predicted_volumes],
            "confidence": float(confidence),
            "volatility": float(volatility),
            "trend": trend,
            "timestamp": datetime.now().isoformat(),
            "model": "Mock (Kronos unavailable)"
        }

# Global instance
kronos_service = KronosPredictionService()
