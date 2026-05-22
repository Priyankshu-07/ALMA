import logging
from pathlib import Path
import cv2
import numpy as np
import torch
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2
logger = logging.getLogger("fetal_health.head")
_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "Models" / "head.pth"
IMG_SIZE         = 256
PIXEL_SPACING_MM = 0.176  
_DEVICE          = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_HC_REFERENCE = {
    12: 70,  13: 84,  14: 98,  15: 112,
    16: 126, 17: 140, 18: 154, 19: 168,
    20: 182, 21: 196, 22: 210, 23: 224,
    24: 238, 25: 252, 26: 266, 27: 280,
    28: 294, 29: 308, 30: 320, 31: 332,
    32: 340, 33: 348, 34: 354, 35: 360,
    36: 365, 37: 370, 38: 373, 39: 375,
    40: 377, 41: 378, 42: 379,
}
_transform = A.Compose([
    A.Resize(IMG_SIZE, IMG_SIZE),
    A.Normalize(
        mean=(0.485, 0.456, 0.406),
        std= (0.229, 0.224, 0.225),
    ),
    ToTensorV2(),
])
_model = None
def _load_model() -> None:
    global _model

    if _model is not None:
        return
    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"[head] Model not found: {_MODEL_PATH}\n"
            f"Make sure 'head.pth' is inside the Models/ folder."
        )
    model = smp.Unet(
        encoder_name    = "resnet34",
        encoder_weights = None,
        in_channels     = 3,
        classes         = 1,
        activation      = None,
    )
    state_dict = torch.load(_MODEL_PATH, map_location=_DEVICE)
    model.load_state_dict(state_dict)
    model.to(_DEVICE)
    model.eval()
    _model = model
    logger.info(f"[head] U-Net (resnet34) loaded on {_DEVICE}")
def _predict_mask(image_np: np.ndarray) -> np.ndarray:
    _load_model()
    augmented = _transform(image=image_np)
    tensor    = augmented["image"].unsqueeze(0).to(_DEVICE)  
    with torch.no_grad():
        output = _model(tensor)                        
        pred   = torch.sigmoid(output)
        mask   = (pred > 0.5).squeeze().cpu().numpy().astype(np.uint8)
    return mask  
def _mask_to_hc_mm(mask: np.ndarray, pixel_spacing: float) -> float | None:
    kernel = np.ones((5, 5), np.uint8)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        logger.warning("[head] No contours found in mask")
        return None
    cnt = max(contours, key=cv2.contourArea)
    if len(cnt) < 5:
        logger.warning("[head] Contour too small to fit ellipse")
        return None
    ellipse      = cv2.fitEllipse(cnt)
    (_, axes, _) = ellipse
    a = max(axes) / 2  
    b = min(axes) / 2   
    h          = ((a - b) ** 2) / ((a + b) ** 2)
    hc_pixels  = np.pi * (a + b) * (1 + (3 * h) / (10 + (4 - 3 * h) ** 0.5))
    hc_mm      = hc_pixels * pixel_spacing
    logger.info(f"[head] Ellipse axes: a={a:.1f}px, b={b:.1f}px → HC={hc_mm:.2f}mm")
    return hc_mm
def _classify_hc(hc_mm: float, gestational_age: int) -> str:
    ga = max(12, min(42, gestational_age))

    if ga in _HC_REFERENCE:
        expected = _HC_REFERENCE[ga]
    else:
        keys  = sorted(_HC_REFERENCE.keys())
        lower = max(k for k in keys if k <= ga)
        upper = min(k for k in keys if k >= ga)
        t     = (ga - lower) / (upper - lower)
        expected = _HC_REFERENCE[lower] * (1 - t) + _HC_REFERENCE[upper] * t
    ratio = hc_mm / expected
    if ratio < 0.85:
        return "Severely Underdeveloped"
    elif ratio < 0.95:
        return "Mildly Underdeveloped"
    elif ratio > 1.15:
        return "Large for Gestational Age"
    else:
        return "Normal"
def measure_head_circumference(
    image_np: np.ndarray,
    gestational_age: int = None,
    pixel_spacing: float = PIXEL_SPACING_MM,
) -> dict | None:

    try:
        mask  = _predict_mask(image_np)
        hc_mm = _mask_to_hc_mm(mask, pixel_spacing)
        if hc_mm is None:
            return None
        status = "Unknown"
        if gestational_age is not None:
            status = _classify_hc(hc_mm, gestational_age)
        logger.info(f"[head] HC={hc_mm:.2f}mm | GA={gestational_age}w | Status={status}")
        return {
            "HC_mm":  round(hc_mm, 2),
            "status": status,
        }
    except Exception as e:
        logger.error(f"[head] Measurement failed: {e}")
        return None