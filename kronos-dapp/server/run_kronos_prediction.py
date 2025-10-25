#!/usr/bin/env python3
import sys
import json
import os
sys.path.append('/mnt/e/code/KronosSol/Kronos')

from kronos_predictor import kronos_service

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python run_kronos_prediction.py <symbol> <days>"}))
        sys.exit(1)
    
    symbol = sys.argv[1]
    days = int(sys.argv[2])
    
    try:
        # Load model if not already loaded
        if not kronos_service.model_loaded:
            kronos_service.load_model()
        
        # Make prediction
        result = kronos_service.predict_with_kronos(symbol, days)
        print(json.dumps(result))
        
    except Exception as e:
        # Generate mock prediction on error
        result = kronos_service._generate_mock_prediction(symbol, days)
        print(json.dumps(result))

if __name__ == "__main__":
    main()
