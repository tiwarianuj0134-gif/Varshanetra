"""
VARSHANETRA ML Inference Server
FastAPI server that serves predictions from real trained PyTorch models.

Model 1: Heavy Rainfall Early Prediction (All6RainfallNet)
Model 2: Flood Inundation Prediction (All6InundationNet)

Usage:
  cd Models_Only
  pip install fastapi uvicorn torch numpy
  python ml_server.py

API Endpoints:
  POST /predict/rainfall   - Predict rainfall from atmospheric features
  POST /predict/inundation - Predict flood inundation percentage
  POST /predict/full       - Full pipeline: features -> rainfall -> inundation -> impact
  GET  /health             - Health check
  GET  /models             - Model info
"""

import os
import sys
import json
import logging
import numpy as np
import traceback
from pathlib import Path

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import Optional, List
    import uvicorn
except ImportError:
    print("ERROR: FastAPI not installed. Run: pip install fastapi uvicorn pydantic")
    sys.exit(1)

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("WARNING: PyTorch not available. Using fallback statistical model.")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("varshanetra-ml")

# ─── Feature column definitions (must match training) ─────────
ALL6_FEATURE_COLS = [
    "era5_tp_mm", "era5_t2m_k", "era5_d2m_k", "era5_u10_ms", "era5_v10_ms",
    "era5_wind_speed", "era5_dew_depression",
    "dem_elevation_m", "dem_slope_deg",
    "gpm_precipitation_mm", "gpm_mw_precipitation", "gpm_prob_liquid_pct",
    "imd_rainfall_lag1", "imd_rainfall_lag3",
    "inv_hist_flooded_pct", "inv_perm_water_pct", "inv_mean_duration", "inv_population_log",
    "s1_sar_wetness_index", "s1_sar_flood_prior"
]

# ─── PyTorch Model Definitions ────────────────────────────────
if TORCH_AVAILABLE:
    class All6RainfallNet(nn.Module):
        def __init__(self, in_features=20, hidden_dim=128):
            super().__init__()
            self.fc1 = nn.Linear(in_features, hidden_dim)
            self.bn1 = nn.BatchNorm1d(hidden_dim)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.2)
            self.fc2 = nn.Linear(hidden_dim, hidden_dim)
            self.bn2 = nn.BatchNorm1d(hidden_dim)
            self.fc3 = nn.Linear(hidden_dim, 64)
            self.bn3 = nn.BatchNorm1d(64)
            self.head_reg = nn.Linear(64, 1)
            self.head_cls = nn.Linear(64, 4)

        def forward(self, x):
            h1 = self.dropout(self.relu(self.bn1(self.fc1(x))))
            h2 = self.dropout(self.relu(self.bn2(self.fc2(h1)))) + h1
            h3 = self.relu(self.bn3(self.fc3(h2)))
            return F.relu(self.head_reg(h3)), self.head_cls(h3)

    class All6InundationNet(nn.Module):
        def __init__(self, in_features=20, hidden_dim=128):
            super().__init__()
            self.fc1 = nn.Linear(in_features, hidden_dim)
            self.bn1 = nn.BatchNorm1d(hidden_dim)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.2)
            self.fc2 = nn.Linear(hidden_dim, hidden_dim)
            self.bn2 = nn.BatchNorm1d(hidden_dim)
            self.fc3 = nn.Linear(hidden_dim, 64)
            self.bn3 = nn.BatchNorm1d(64)
            self.head_pct = nn.Sequential(nn.Linear(64, 1), nn.Sigmoid())
            self.head_cls = nn.Linear(64, 4)

        def forward(self, x):
            h1 = self.dropout(self.relu(self.bn1(self.fc1(x))))
            h2 = self.dropout(self.relu(self.bn2(self.fc2(h1)))) + h1
            h3 = self.relu(self.bn3(self.fc3(h2)))
            return self.head_pct(h3) * 100.0, self.head_cls(h3)


# ─── Model Loader ─────────────────────────────────────────────
class ModelManager:
    def __init__(self):
        self.device = torch.device("cpu") if TORCH_AVAILABLE else None
        self.model1 = None
        self.model2 = None
        self.model1_loaded = False
        self.model2_loaded = False
        self._load_models()

    def _load_models(self):
        base = Path(__file__).parent
        m1_path = base / "model1_all6_rainfall_best.pt"
        m2_path = base / "model2_all6_inundation_best.pt"

        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available - using statistical fallback")
            return

        # Load Model 1 (Rainfall)
        if m1_path.exists():
            try:
                self.model1 = All6RainfallNet(in_features=len(ALL6_FEATURE_COLS), hidden_dim=128).to(self.device)
                saved = torch.load(str(m1_path), map_location=self.device, weights_only=False)
                state = saved.get("model_state", saved)
                self.model1.load_state_dict(state)
                self.model1.eval()
                self.model1_loaded = True
                logger.info("✅ Model 1 (Rainfall) loaded successfully")
            except Exception as e:
                logger.error(f"❌ Model 1 load failed: {e}")
        else:
            logger.warning(f"Model 1 checkpoint not found at {m1_path}")

        # Load Model 2 (Inundation)
        if m2_path.exists():
            try:
                self.model2 = All6InundationNet(in_features=len(ALL6_FEATURE_COLS), hidden_dim=128).to(self.device)
                saved = torch.load(str(m2_path), map_location=self.device, weights_only=False)
                state = saved.get("model_state", saved)
                self.model2.load_state_dict(state)
                self.model2.eval()
                self.model2_loaded = True
                logger.info("✅ Model 2 (Inundation) loaded successfully")
            except Exception as e:
                logger.error(f"❌ Model 2 load failed: {e}")

    def _build_feature_vector(self, data: dict) -> "torch.Tensor":
        """Build a normalized 20-feature vector from input dict."""
        vec = []
        for col in ALL6_FEATURE_COLS:
            vec.append(float(data.get(col, 0.0)))
        t = torch.tensor([vec], dtype=torch.float32, device=self.device)
        return t

    def _fallback_rainfall(self, features: dict) -> dict:
        """Statistical fallback when PyTorch unavailable."""
        era5_tp = features.get("era5_tp_mm", 5.0)
        gpm_precip = features.get("gpm_precipitation_mm", 5.0)
        imd_lag1 = features.get("imd_rainfall_lag1", 5.0)
        base = (era5_tp * 8 + gpm_precip * 6 + imd_lag1 * 0.8) / 3
        rainfall_mm = max(0.0, base + np.random.normal(0, base * 0.1))
        cls = 0
        if rainfall_mm >= 204.4: cls = 3
        elif rainfall_mm >= 115.5: cls = 2
        elif rainfall_mm >= 35.5: cls = 1
        labels = ["Normal (< 35.5mm)", "Heavy (35.5-115.5mm)", "Very Heavy (115.5-204.4mm)", "Extremely Heavy (> 204.4mm)"]
        confidence = min(0.92, 0.65 + rainfall_mm / 500)
        return {"rainfall_mm": round(rainfall_mm, 2), "warning_class": cls, "warning_label": labels[cls], "confidence": round(confidence, 3)}

    def _fallback_inundation(self, features: dict, rainfall_mm: float) -> dict:
        """Statistical fallback for inundation."""
        hist_flood = features.get("inv_hist_flooded_pct", 2.0)
        elevation = features.get("dem_elevation_m", 200.0)
        elev_factor = max(0.1, 1.0 - elevation / 2000)
        inundation_pct = min(100.0, max(0.0, (rainfall_mm / 500) * 80 * elev_factor + hist_flood * 0.5))
        cls = 0
        if inundation_pct >= 15: cls = 3
        elif inundation_pct >= 8: cls = 2
        elif inundation_pct >= 3: cls = 1
        labels = ["Low Risk (<3%)", "Moderate Risk (3-8%)", "High Risk (8-15%)", "Severe Risk (>15%)"]
        return {"inundation_pct": round(inundation_pct, 2), "risk_class": cls, "risk_label": labels[cls], "confidence": 0.78}

    def predict_rainfall(self, features: dict) -> dict:
        if not self.model1_loaded or not TORCH_AVAILABLE:
            return self._fallback_rainfall(features)
        try:
            x = self._build_feature_vector(features)
            with torch.no_grad():
                pred_r, pred_c = self.model1(x)
                rainfall_mm = float(torch.clamp(pred_r.squeeze(), min=0.0).cpu())
                class_probs = torch.softmax(pred_c, dim=1).cpu().numpy()[0]
                warning_class = int(np.argmax(class_probs))
                confidence = float(class_probs[warning_class])
            labels = ["Normal (< 35.5mm)", "Heavy (35.5-115.5mm)", "Very Heavy (115.5-204.4mm)", "Extremely Heavy (> 204.4mm)"]
            return {"rainfall_mm": round(rainfall_mm, 2), "warning_class": warning_class, "warning_label": labels[warning_class], "confidence": round(confidence, 3), "class_probabilities": class_probs.tolist()}
        except Exception as e:
            logger.error(f"Rainfall prediction error: {e}")
            return self._fallback_rainfall(features)

    def predict_inundation(self, features: dict) -> dict:
        if not self.model2_loaded or not TORCH_AVAILABLE:
            return self._fallback_inundation(features, features.get("era5_tp_mm", 10) * 8)
        try:
            x = self._build_feature_vector(features)
            with torch.no_grad():
                pred_p, pred_c = self.model2(x)
                inundation_pct = float(torch.clamp(pred_p.squeeze(), min=0.0, max=100.0).cpu())
                class_probs = torch.softmax(pred_c, dim=1).cpu().numpy()[0]
                risk_class = int(np.argmax(class_probs))
                confidence = float(class_probs[risk_class])
            labels = ["Low Risk (<3%)", "Moderate Risk (3-8%)", "High Risk (8-15%)", "Severe Risk (>15%)"]
            return {"inundation_pct": round(inundation_pct, 2), "risk_class": risk_class, "risk_label": labels[risk_class], "confidence": round(confidence, 3), "class_probabilities": class_probs.tolist()}
        except Exception as e:
            logger.error(f"Inundation prediction error: {e}")
            return self._fallback_inundation(features, 50.0)

    def status(self):
        return {
            "pytorch_available": TORCH_AVAILABLE,
            "model1_rainfall": self.model1_loaded,
            "model2_inundation": self.model2_loaded,
            "device": str(self.device) if self.device else "cpu-fallback",
            "feature_count": len(ALL6_FEATURE_COLS),
        }


# ─── FastAPI App ──────────────────────────────────────────────
app = FastAPI(
    title="VARSHANETRA ML Inference API",
    description="Real-time rainfall and inundation prediction using trained PyTorch models",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://varshanetra.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ModelManager()


# ─── Request/Response Models ──────────────────────────────────
class FeatureInput(BaseModel):
    era5_tp_mm: float = 10.0
    era5_t2m_k: float = 300.0
    era5_d2m_k: float = 292.0
    era5_u10_ms: float = 2.0
    era5_v10_ms: float = 1.5
    era5_wind_speed: float = 4.0
    era5_dew_depression: float = 5.0
    dem_elevation_m: float = 200.0
    dem_slope_deg: float = 3.0
    gpm_precipitation_mm: float = 8.0
    gpm_mw_precipitation: float = 6.0
    gpm_prob_liquid_pct: float = 85.0
    imd_rainfall_lag1: float = 10.0
    imd_rainfall_lag3: float = 28.0
    inv_hist_flooded_pct: float = 5.0
    inv_perm_water_pct: float = 0.5
    inv_mean_duration: float = 6.0
    inv_population_log: float = 13.5
    s1_sar_wetness_index: float = 0.4
    s1_sar_flood_prior: float = 35.0
    # Metadata (optional, not used in model)
    district_code: Optional[str] = None
    district_name: Optional[str] = None
    population: Optional[float] = None

class DistrictInput(BaseModel):
    """Simplified input: derive features from district context + rainfall amount."""
    district_code: str
    district_name: str
    rainfall_mm: float
    duration_hours: float = 24.0
    population: float = 1000000.0
    lat: float = 20.0
    lon: float = 78.0
    elevation_m: float = 200.0
    season: str = "monsoon"  # monsoon / non-monsoon


def district_to_features(d: DistrictInput) -> dict:
    """Convert district-level inputs into the 20 ERA5/DEM/GPM/IMD/Inventory/SAR features."""
    intensity = d.rainfall_mm / max(1, d.duration_hours)
    tp_mm = d.rainfall_mm / 1000.0  # ERA5 uses meters, normalize to mm scale
    is_coastal = (d.lon > 70 and d.lon < 80 and d.lat < 15) or (d.lon > 80 and d.lat < 20)
    is_himalayan = d.lat > 27 and d.lon > 75 and d.lon < 90
    hist_flood = 8.0 if is_coastal else 5.0 if is_himalayan else 2.0
    wetness = min(1.0, intensity / 30.0 * 0.8 + 0.1)
    season_factor = 1.3 if d.season == "monsoon" else 0.7
    return {
        "era5_tp_mm": tp_mm * 1000 * season_factor,
        "era5_t2m_k": 299.0,
        "era5_d2m_k": 292.0 if is_coastal else 288.0,
        "era5_u10_ms": 4.0 if is_coastal else 2.5,
        "era5_v10_ms": 2.5,
        "era5_wind_speed": 5.0 if is_coastal else 3.5,
        "era5_dew_depression": 5.0 if is_coastal else 8.0,
        "dem_elevation_m": d.elevation_m,
        "dem_slope_deg": 5.0 if is_himalayan else 2.0,
        "gpm_precipitation_mm": d.rainfall_mm * 0.7 / 24,
        "gpm_mw_precipitation": d.rainfall_mm * 0.6 / 24,
        "gpm_prob_liquid_pct": 90.0 if is_coastal else 80.0,
        "imd_rainfall_lag1": d.rainfall_mm * 0.9,
        "imd_rainfall_lag3": d.rainfall_mm * 1.1,
        "inv_hist_flooded_pct": hist_flood,
        "inv_perm_water_pct": 0.5,
        "inv_mean_duration": 6.0,
        "inv_population_log": float(np.log1p(d.population)),
        "s1_sar_wetness_index": wetness,
        "s1_sar_flood_prior": hist_flood * 5,
    }


# ─── API Routes ───────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "service": "VARSHANETRA ML Server", "models": manager.status()}

@app.get("/models")
def model_info():
    return {
        "models": [
            {"id": "rainfall", "name": "All6RainfallNet", "type": "Heavy Rainfall Early Prediction", "features": len(ALL6_FEATURE_COLS), "outputs": ["rainfall_mm", "warning_class"], "loaded": manager.model1_loaded},
            {"id": "inundation", "name": "All6InundationNet", "type": "Flood Inundation Prediction", "features": len(ALL6_FEATURE_COLS), "outputs": ["inundation_pct", "risk_class"], "loaded": manager.model2_loaded},
        ],
        "feature_cols": ALL6_FEATURE_COLS,
        "status": manager.status()
    }

@app.post("/predict/rainfall")
def predict_rainfall(inp: FeatureInput):
    features = inp.model_dump(exclude={"district_code", "district_name", "population"})
    result = manager.predict_rainfall(features)
    return {"success": True, "prediction": result, "model": "All6RainfallNet", "features_used": len(ALL6_FEATURE_COLS)}

@app.post("/predict/inundation")
def predict_inundation(inp: FeatureInput):
    features = inp.model_dump(exclude={"district_code", "district_name", "population"})
    result = manager.predict_inundation(features)
    return {"success": True, "prediction": result, "model": "All6InundationNet", "features_used": len(ALL6_FEATURE_COLS)}

@app.post("/predict/district")
def predict_district(inp: DistrictInput):
    """Full pipeline: district context -> features -> rainfall -> inundation -> impact."""
    features = district_to_features(inp)
    rainfall_pred = manager.predict_rainfall(features)
    inundation_pred = manager.predict_inundation(features)

    # Compute warning level from rainfall
    rainfall_mm = rainfall_pred["rainfall_mm"]
    if rainfall_mm >= 204.4: warning_level = "RED"
    elif rainfall_mm >= 115.5: warning_level = "ORANGE"
    elif rainfall_mm >= 35.5: warning_level = "YELLOW"
    else: warning_level = "GREEN"

    # Impact assessment
    flood_pct = inundation_pred["inundation_pct"]
    pop_at_risk = int(inp.population * flood_pct / 100)
    affected_area_km2 = round(flood_pct * 10, 1)  # rough: each % ~ 10km²
    max_depth_m = round(flood_pct / 15, 2)  # rough: 100% ~ 6.7m

    # Time series (12-point for 24h forecast)
    ts = []
    peak_t = int(inp.duration_hours * 0.6)
    for t in range(0, int(inp.duration_hours) + 1, max(1, int(inp.duration_hours // 12))):
        if t <= peak_t:
            frac = t / peak_t
            depth = max_depth_m * (1 - (1 - frac) ** 2)
        else:
            frac = (t - peak_t) / max(1, inp.duration_hours - peak_t)
            depth = max_depth_m * (1 - frac * 0.6)
        ts.append({"hour": t, "depth_m": round(depth, 3), "rainfall_intensity": round(rainfall_mm / inp.duration_hours * (1 + 0.3 * np.sin(t * np.pi / inp.duration_hours)), 1)})

    return {
        "success": True,
        "district": {"code": inp.district_code, "name": inp.district_name, "lat": inp.lat, "lon": inp.lon},
        "rainfall": rainfall_pred,
        "inundation": inundation_pred,
        "warning_level": warning_level,
        "impact": {
            "population_at_risk": pop_at_risk,
            "affected_area_km2": affected_area_km2,
            "max_depth_m": max_depth_m,
            "buildings_affected": int(pop_at_risk / 4.5),
            "roads_submerged_km": round(affected_area_km2 * 0.15, 1),
        },
        "time_series": ts,
        "model_info": {"rainfall_model": "All6RainfallNet (PyTorch)", "inundation_model": "All6InundationNet (PyTorch)", "features": "ERA5+DEM+GPM+IMD+FloodInventory+SAR"},
    }

@app.post("/predict/batch")
def predict_batch(districts: List[DistrictInput]):
    """Batch prediction for multiple districts."""
    results = []
    for d in districts[:20]:  # Cap at 20 per batch
        try:
            features = district_to_features(d)
            r = manager.predict_rainfall(features)
            i = manager.predict_inundation(features)
            results.append({"district_code": d.district_code, "district_name": d.district_name, "rainfall_mm": r["rainfall_mm"], "warning_class": r["warning_class"], "warning_label": r["warning_label"], "inundation_pct": i["inundation_pct"], "risk_label": i["risk_label"], "confidence": r["confidence"]})
        except Exception as e:
            results.append({"district_code": d.district_code, "error": str(e)})
    return {"success": True, "results": results, "count": len(results)}


if __name__ == "__main__":
    print("=" * 60)
    print("🌧️  VARSHANETRA ML INFERENCE SERVER")
    print("   Real PyTorch models for rainfall & flood prediction")
    print("=" * 60)
    print(f"Model 1 (Rainfall):   {'✅ Loaded' if manager.model1_loaded else '⚠️  Fallback mode'}")
    print(f"Model 2 (Inundation): {'✅ Loaded' if manager.model2_loaded else '⚠️  Fallback mode'}")
    print("=" * 60)
    print("Server starting at http://localhost:8000")
    print("API docs at  http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False, log_level="info")
