import logging
from pathlib import Path
import numpy as np
logger = logging.getLogger("fetal_health.fhr")
_BASE        = Path(__file__).resolve().parent.parent.parent / "Models"
_MODEL_PATH  = _BASE / "ann_fhr_model.keras"
_SCALER_PATH = _BASE / "fhr_scaler.pkl"
_LABELS = ["Normal", "Suspect", "Pathological"]
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
    import tensorflow as tf
    _model = tf.keras.models.load_model(str(_MODEL_PATH))
    import joblib
    _scaler = joblib.load(str(_SCALER_PATH))
    logger.info("[fhr] ANN model and scaler loaded.")
def predict_fhr(features: list) -> dict:
    _load_artifacts()
    X        = np.array(features, dtype=np.float32).reshape(1, -1)
    X_scaled = _scaler.transform(X)
    proba      = _model.predict(X_scaled, verbose=0)[0]  
    pred_idx   = int(np.argmax(proba))
    condition  = _LABELS[pred_idx]
    confidence = round(float(np.max(proba)), 4)
    logger.info(f"[fhr] Condition={condition} | Confidence={confidence}")
    return {
        "condition":  condition,
        "confidence": confidence,
    }