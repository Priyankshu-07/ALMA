"""
services/maternal.py
Maternal Risk Prediction

Models:  Models/best_model.pkl
         Models/scaler.pkl
         Models/label_encoder.pkl

Input:   [age, systolicBP, diastolicBP, bloodSugar, bodyTemperature, heartRate]
Output:  { "risk_level": "low" | "mid" | "high", "confidence": float }
"""

import logging
import pickle
from pathlib import Path

import numpy as np

logger = logging.getLogger("fetal_health.maternal")

# ── Paths ──────────────────────────────────────────────────────────────────────
_BASE         = Path(__file__).resolve().parent.parent / "Models"
_MODEL_PATH   = _BASE / "best_model.pkl"
_SCALER_PATH  = _BASE / "scaler.pkl"
_ENCODER_PATH = _BASE / "label_encoder.pkl"

# ── Lazy-loaded singletons ─────────────────────────────────────────────────────
_model   = None
_scaler  = None
_encoder = None


def _load_artifacts() -> None:
    global _model, _scaler, _encoder

    if _model is not None:
        return

    for path, label in [
        (_MODEL_PATH,   "best_model.pkl"),
        (_SCALER_PATH,  "scaler.pkl"),
        (_ENCODER_PATH, "label_encoder.pkl"),
    ]:
        if not path.exists():
            raise FileNotFoundError(
                f"[maternal] Required artifact not found: {path}\n"
                f"Make sure '{label}' is inside the Models/ folder."
            )

    with open(_MODEL_PATH,   "rb") as f: _model   = pickle.load(f)
    with open(_SCALER_PATH,  "rb") as f: _scaler  = pickle.load(f)
    with open(_ENCODER_PATH, "rb") as f: _encoder = pickle.load(f)

    logger.info("[maternal] Model, scaler, and label encoder loaded.")


def predict_maternal_risk(features: list) -> dict:
    """
    Predict maternal risk level.

    Args:
        features: [age, systolicBP, diastolicBP, bloodSugar, bodyTemperature, heartRate]

    Returns:
        { "risk_level": "low" | "mid" | "high", "confidence": float }
    """
    _load_artifacts()

    X        = np.array(features, dtype=np.float32).reshape(1, -1)
    X_scaled = _scaler.transform(X)

    pred_encoded = _model.predict(X_scaled)[0]
    risk_level   = _encoder.inverse_transform([pred_encoded])[0].lower()

    confidence = None
    if hasattr(_model, "predict_proba"):
        proba      = _model.predict_proba(X_scaled)[0]
        confidence = round(float(np.max(proba)), 4)

    logger.info(f"[maternal] Risk={risk_level} | Confidence={confidence}")

    return {
        "risk_level": risk_level,
        "confidence": confidence,
    }