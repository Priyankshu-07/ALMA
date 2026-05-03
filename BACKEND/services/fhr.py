"""
services/fhr.py
Fetal Heart Rate (FHR) Condition Prediction

Models:  Models/ann_fhr_model.keras
         Models/fhr_scaler.pkl

Input:   [baseline, accelerations, fetalMovement, uterineContractions,
          lightDecelerations, severeDecelerations]
Output:  { "condition": "Normal" | "Suspect" | "Pathological", "confidence": float }
"""

import logging
import pickle
from pathlib import Path

import numpy as np

logger = logging.getLogger("fetal_health.fhr")

# ── Paths ──────────────────────────────────────────────────────────────────────
_BASE         = Path(__file__).resolve().parent.parent.parent / "Models"
_MODEL_PATH   = _BASE / "ann_fhr_model.keras"
_SCALER_PATH  = _BASE / "fhr_scaler.pkl"

# ── Class labels (index → label) ──────────────────────────────────────────────
# ANN output: 3 neurons → softmax → argmax
# Training typically encodes: 0=Normal, 1=Suspect, 2=Pathological
_LABELS = ["Normal", "Suspect", "Pathological"]

# ── Lazy-loaded singletons ─────────────────────────────────────────────────────
_model  = None
_scaler = None


def _load_artifacts() -> None:
    global _model, _scaler

    if _model is not None:
        return

    for path, label in [
        (_MODEL_PATH,  "ann_fhr_model.keras"),
        (_SCALER_PATH, "fhr_scaler.pkl"),
    ]:
        if not path.exists():
            raise FileNotFoundError(
                f"[fhr] Required artifact not found: {path}\n"
                f"Make sure '{label}' is inside the Models/ folder."
            )

    # Keras model
    from tensorflow import keras
    _model = keras.models.load_model(str(_MODEL_PATH))

    # Scaler
    with open(_SCALER_PATH, "rb") as f:
        _scaler = pickle.load(f)

    logger.info("[fhr] ANN model and scaler loaded.")


def predict_fhr(features: list) -> dict:
    """
    Predict FHR condition.

    Args:
        features: [baseline, accelerations, fetalMovement,
                   uterineContractions, lightDecelerations, severeDecelerations]

    Returns:
        { "condition": "Normal" | "Suspect" | "Pathological", "confidence": float }
    """
    _load_artifacts()

    X        = np.array(features, dtype=np.float32).reshape(1, -1)
    X_scaled = _scaler.transform(X)

    # ANN prediction — output shape (1, 3) with softmax probabilities
    proba     = _model.predict(X_scaled, verbose=0)[0]   # (3,)
    pred_idx  = int(np.argmax(proba))
    condition = _LABELS[pred_idx]
    confidence = round(float(np.max(proba)), 4)

    logger.info(f"[fhr] Condition={condition} | Confidence={confidence}")

    return {
        "condition":  condition,
        "confidence": confidence,
    }