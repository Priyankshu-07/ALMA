import logging
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms
logger = logging.getLogger("fetal_health.classify")
_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "Models" / "resnet50_fetal_planes.pth"
IMG_SIZE   = 224
NUM_CLASSES = 6
CONFIDENCE_THRESHOLD = 0.5 
_IDX_TO_LABEL = {
    0: "Fetal abdomen",
    1: "Fetal brain",
    2: "Fetal femur",
    3: "Fetal thorax",
    4: "Maternal cervix",
    5: "Other",
}
_LABEL_MAP = {
    "Fetal abdomen": "ABDOMEN",
    "Fetal brain":   "HEAD",
    "Fetal femur":   "FEMUR",
    "Fetal thorax":  "UNKNOWN",
    "Maternal cervix": "UNKNOWN",
    "Other":         "UNKNOWN",
}
_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std= [0.229, 0.224, 0.225],
    ),
])
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_model = None
def _load_model() -> None:
    global _model
    if _model is not None:
        return
    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"[classify] Model not found: {_MODEL_PATH}\n"
            f"Make sure 'resnet50_fetal_planes.pth' is inside the Models/ folder."
        )
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(model.fc.in_features, NUM_CLASSES),
    )
    state_dict = torch.load(_MODEL_PATH, map_location=_DEVICE)
    model.load_state_dict(state_dict)
    model.to(_DEVICE)
    model.eval()
    _model = model
    logger.info(f"[classify] ResNet50 loaded on {_DEVICE}")
def classify_plane(image_np: np.ndarray) -> dict:
    _load_model()
    pil_image = Image.fromarray(image_np.astype(np.uint8))
    tensor = _transform(pil_image).unsqueeze(0).to(_DEVICE)
    with torch.no_grad():
        outputs = _model(tensor)                       
        probs   = torch.softmax(outputs, dim=1)         
        conf, pred_idx = torch.max(probs, dim=1)
    pred_idx  = pred_idx.item()
    confidence = conf.item()
    raw_label  = _IDX_TO_LABEL[pred_idx]
    plane      = _LABEL_MAP[raw_label]
    if confidence < CONFIDENCE_THRESHOLD:
        logger.warning(
            f"[classify] Low confidence ({confidence:.2f}) for '{raw_label}' → UNKNOWN"
        )
        plane = "UNKNOWN"
    logger.info(
        f"[classify] Prediction: {raw_label} → {plane} "
        f"(confidence: {confidence:.2f})"
    )
    return {
        "plane":      plane,
        "raw_label":  raw_label,
        "confidence": round(confidence, 4),
    }