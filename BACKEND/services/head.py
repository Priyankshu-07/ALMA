"""
services/head.py
Fetal Head Circumference (HC) Measurement

Model:   Models/head.pth  (smp.Unet with resnet34 encoder)
Input:   RGB image (numpy array)
Output:  HC in mm + growth status

Architecture matches training notebook exactly:
  - smp.Unet, encoder=resnet34, encoder_weights=None (we load our own)
  - in_channels=3, classes=1, activation=None
  - Input size: 256x256
  - Normalization: ImageNet mean/std via albumentations
  - Output: sigmoid > 0.5 binary mask
"""

import logging
from pathlib import Path

import cv2
import numpy as np
import torch
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2

logger = logging.getLogger("fetal_health.head")

# ── Paths ──────────────────────────────────────────────────────────────────────
_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "Models" / "head.pth"

# ── Constants ──────────────────────────────────────────────────────────────────
IMG_SIZE          = 256
PIXEL_SPACING_MM  = 0.28   # mm per pixel (same as femur notebook)
_DEVICE           = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Preprocessing (matches val_transform from notebook exactly) ────────────────
_transform = A.Compose([
    A.Resize(IMG_SIZE, IMG_SIZE),
    A.Normalize(
        mean=(0.485, 0.456, 0.406),
        std= (0.229, 0.224, 0.225),
    ),
    ToTensorV2(),
])

# ── Lazy-loaded model singleton ───────────────────────────────────────────────
_model = None


def _load_model() -> None:
    """Load smp.Unet with resnet34 encoder from saved state dict."""
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
    """
    Run U-Net inference on RGB image.
    Returns binary mask (H=256, W=256) with values 0 or 1.
    """
    _load_model()

    augmented = _transform(image=image_np)
    tensor    = augmented["image"].unsqueeze(0).to(_DEVICE)  # (1, 3, 256, 256)

    with torch.no_grad():
        output = _model(tensor)                        # (1, 1, 256, 256)
        pred   = torch.sigmoid(output)
        mask   = (pred > 0.5).squeeze().cpu().numpy().astype(np.uint8)

    return mask  # (256, 256)


def _mask_to_hc_mm(mask: np.ndarray, pixel_spacing: float) -> float | None:
    """
    Convert binary segmentation mask → HC in mm.

    Steps:
      1. Morphological closing to fill gaps
      2. Find largest contour (fetal head region)
      3. Fit ellipse to contour
      4. HC = π × (a + b)  where a, b are semi-axes
      5. Convert pixels → mm
    """
    # Close small holes
    kernel = np.ones((5, 5), np.uint8)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        logger.warning("[head] No contours found in mask")
        return None

    # Largest contour = fetal head
    cnt = max(contours, key=cv2.contourArea)

    if len(cnt) < 5:
        logger.warning("[head] Contour too small to fit ellipse")
        return None

    # Fit ellipse → get semi-axes
    ellipse         = cv2.fitEllipse(cnt)
    (_, axes, _)    = ellipse
    a               = max(axes) / 2   # semi-major axis in pixels
    b               = min(axes) / 2   # semi-minor axis in pixels

    # HC formula: π × (a + b) — Ramanujan approximation for ellipse perimeter
    hc_pixels = np.pi * (a + b)
    hc_mm     = hc_pixels * pixel_spacing

    logger.info(f"[head] Ellipse axes: a={a:.1f}px, b={b:.1f}px → HC={hc_mm:.2f}mm")
    return hc_mm


def _classify_hc(hc_mm: float, gestational_age: int) -> str:
    """
    Compare HC against WHO reference ranges for gestational age.

    Reference: expected HC ≈ gestational_age × 10 mm (simplified linear model)
    ±10% → Normal
    < 10% below → Mildly Underdeveloped
    > 10% below → Severely Underdeveloped
    > 10% above → Large for gestational age
    """
    expected = gestational_age * 10.0

    if hc_mm < expected * 0.85:
        return "Severely Underdeveloped"
    elif hc_mm < expected * 0.95:
        return "Mildly Underdeveloped"
    elif hc_mm > expected * 1.15:
        return "Large for Gestational Age"
    else:
        return "Normal"


def measure_head_circumference(
    image_np: np.ndarray,
    gestational_age: int = None,
    pixel_spacing: float = PIXEL_SPACING_MM,
) -> dict | None:
    """
    Public interface called by main.py.

    Args:
        image_np:         RGB numpy array
        gestational_age:  weeks (optional, needed for status)
        pixel_spacing:    mm per pixel

    Returns:
        {
            "HC_mm":   float,
            "status":  "Normal" | "Mildly Underdeveloped" | "Severely Underdeveloped" | "Large for Gestational Age",
        }
        or None if measurement fails.
    """
    try:
        mask = _predict_mask(image_np)
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