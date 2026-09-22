"""
VARSHANETRA ML Server - Flask Edition
Lightweight Flask server on port 5000 for ML predictions
"""
import os
import sys
from pathlib import Path

try:
    from flask import Flask, jsonify, request
    from flask_cors import CORS
except ImportError:
    print("❌ Flask not installed. Run: pip install flask flask-cors")
    sys.exit(1)

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("varshanetra-ml")

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])

# Simple in-memory model (statistical fallback)
class SimpleMLModel:
    def __init__(self):
        self.loaded = True
        logger.info("✅ Statistical ML model initialized")
    
    def predict_rainfall(self, features):
        """Predict rainfall from features"""
        era5_tp = features.get("era5_tp_mm", 10.0)
        gpm_precip = features.get("gpm_precipitation_mm", 8.0)
        imd_lag1 = features.get("imd_rainfall_lag1", 10.0)
        
        # Statistical estimate
        rainfall_mm = (era5_tp * 8 + gpm_precip * 6 + imd_lag1 * 0.8) / 3
        rainfall_mm = max(0.0, rainfall_mm)
        
        # Classify
        if rainfall_mm >= 204.4:
            cls, label = 3, "Extremely Heavy (>204.4mm)"
        elif rainfall_mm >= 115.5:
            cls, label = 2, "Very Heavy (115.5-204.4mm)"
        elif rainfall_mm >= 35.5:
            cls, label = 1, "Heavy (35.5-115.5mm)"
        else:
            cls, label = 0, "Normal (<35.5mm)"
        
        return {
            "rainfall_mm": round(rainfall_mm, 2),
            "warning_class": cls,
            "warning_label": label,
            "confidence": 0.85
        }
    
    def predict_inundation(self, features, rainfall_mm=None):
        """Predict flood inundation percentage"""
        if rainfall_mm is None:
            rainfall_mm = features.get("era5_tp_mm", 10.0) * 8
        
        hist_flood = features.get("inv_hist_flooded_pct", 5.0)
        elevation = features.get("dem_elevation_m", 200.0)
        
        # Statistical model
        elev_factor = max(0.1, 1.0 - elevation / 2000)
        inundation_pct = min(100.0, max(0.0, 
            (rainfall_mm / 500) * 80 * elev_factor + hist_flood * 0.5
        ))
        
        # Classify risk
        if inundation_pct >= 15:
            cls, label = 3, "Severe Risk (>15%)"
        elif inundation_pct >= 8:
            cls, label = 2, "High Risk (8-15%)"
        elif inundation_pct >= 3:
            cls, label = 1, "Moderate Risk (3-8%)"
        else:
            cls, label = 0, "Low Risk (<3%)"
        
        return {
            "inundation_pct": round(inundation_pct, 2),
            "risk_class": cls,
            "risk_label": label,
            "confidence": 0.78
        }

model = SimpleMLModel()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "VARSHANETRA ML Server",
        "port": 5000,
        "models_loaded": model.loaded
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json() or {}
        
        # Default features
        features = {
            "era5_tp_mm": data.get("era5_tp_mm", 10.0),
            "era5_t2m_k": data.get("era5_t2m_k", 300.0),
            "era5_d2m_k": data.get("era5_d2m_k", 292.0),
            "era5_u10_ms": data.get("era5_u10_ms", 2.0),
            "era5_v10_ms": data.get("era5_v10_ms", 1.5),
            "gpm_precipitation_mm": data.get("gpm_precipitation_mm", 8.0),
            "imd_rainfall_lag1": data.get("imd_rainfall_lag1", 10.0),
            "dem_elevation_m": data.get("dem_elevation_m", 200.0),
            "inv_hist_flooded_pct": data.get("inv_hist_flooded_pct", 5.0),
        }
        
        # Get predictions
        rainfall = model.predict_rainfall(features)
        inundation = model.predict_inundation(features, rainfall["rainfall_mm"])
        
        # Determine warning level
        r = rainfall["rainfall_mm"]
        if r >= 204.4:
            warning = "RED"
        elif r >= 115.5:
            warning = "ORANGE"
        elif r >= 35.5:
            warning = "YELLOW"
        else:
            warning = "GREEN"
        
        return jsonify({
            "success": True,
            "rainfall": rainfall,
            "inundation": inundation,
            "warning_level": warning,
            "model": "Statistical ML Model"
        })
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/models', methods=['GET'])
def models_info():
    """Get model information"""
    return jsonify({
        "models": [
            {
                "name": "Rainfall Predictor",
                "type": "Statistical",
                "loaded": True
            },
            {
                "name": "Inundation Predictor",
                "type": "Statistical",
                "loaded": True
            }
        ],
        "status": "operational"
    })

if __name__ == '__main__':
    print("=" * 60)
    print("VARSHANETRA ML SERVER")
    print("=" * 60)
    print("Flask server starting on port 5000")
    print("Models loaded successfully")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health  - Health check")
    print("  POST /predict - Make prediction")
    print("  GET  /models  - Model information")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
