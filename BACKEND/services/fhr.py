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

def _build_and_load_fetal_model(model_file_path: Path):
    import tensorflow as tf
    
    # 1. Reconstruct the exact layer architecture from your training configuration
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(6,)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(3, activation='softmax')
    ])
    
    # 2. Extract and load the raw weights to bypass the serialization bug
    try:
        model.load_weights(str(model_file_path))
    except Exception:
        # Fallback if load_weights directly objects: load without compilation and copy weights
        legacy_model = tf.keras.models.load_model(str(model_file_path), compile=False)
        model.set_weights(legacy_model.get_weights())
        
    return model

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
            
    # Load the model safely using the patch function
    _model = _build_and_load_fetal_model(_MODEL_PATH)
    
    import joblib
    _scaler = joblib.load(str(_SCALER_PATH))
    logger.info("[fhr] ANN model and scaler loaded safely.")

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