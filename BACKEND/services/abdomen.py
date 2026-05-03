"""
services/abdomen.py
Fetal Abdominal Circumference (AC) Measurement

Model:   Models/unet_abdomen.pth  (custom UNet — grayscale input)
Input:   RGB image (numpy array) — converted to grayscale internally
Output:  AC in mm + growth status

Architecture matches training notebook exactly:
  - Custom UNet with DoubleConv blocks
  - in_channels=1 (grayscale), single output channel
  - Input size: 256x256
  - Normalization: divide by 255.0
  - Output: sigmoid > 0.5 binary mask
  - Post-processing: morphologyEx(7,7) + connectedComponentsWithStats
  - AC = π × (a + b) / 2, pixel_spacing = 0.1
"""

import logging
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger("fetal_health.abdomen")

# ── Paths ──────────────────────────────────────────────────────────────────────
_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "Models" / "unet_abdomen.pth"

# ── Constants ──────────────────────────────────────────────────────────────────
IMG_SIZE         = 256
PIXEL_SPACING_MM = 0.1   # from notebook: pixel_spacing = 0.1
_DEVICE          = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Custom UNet Architecture (must match notebook exactly) ────────────────────
class _DoubleConv(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, 3, padding=1),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class _UNet(nn.Module):
    def __init__(self):
        super().__init__()
        # Encoder
        self.down1  = _DoubleConv(1, 64)
        self.pool1  = nn.MaxPool2d(2)
        self.down2  = _DoubleConv(64, 128)
        self.pool2  = nn.MaxPool2d(2)
        self.down3  = _DoubleConv(128, 256)
        self.pool3  = nn.MaxPool2d(2)
        self.down4  = _DoubleConv(256, 512)
        self.pool4  = nn.MaxPool2d(2)
        # Bottleneck
        self.bottleneck = _DoubleConv(512, 1024)
        # Decoder
        self.up4   = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.conv4 = _DoubleConv(1024, 512)
        self.up3   = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.conv3 = _DoubleConv(512, 256)
        self.up2   = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.conv2 = _DoubleConv(256, 128)
        self.up1   = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.conv1 = _DoubleConv(128, 64)
        # Output
        self.final = nn.Conv2d(64, 1, kernel_size=1)

    def forward(self, x):
        d1 = self.down1(x)
        p1 = self.pool1(d1)
        d2 = self.down2(p1)
        p2 = self.pool2(d2)
        d3 = self.down3(p2)
        p3 = self.pool3(d3)
        d4 = self.down4(p3)
        p4 = self.pool4(d4)
        bn = self.bottleneck(p4)
        u4 = self.up4(bn)
        u4 = torch.cat([u4, d4], dim=1)
        u4 = self.conv4(u4)
        u3 = self.up3(u4)
        u3 = torch.cat([u3, d3], dim=1)
        u3 = self.conv3(u3)
        u2 = self.up2(u3)
        u2 = torch.cat([u2, d2], dim=1)
        u2 = self.conv2(u2)
        u1 = self.up1(u2)
        u1 = torch.cat([u1, d1], dim=1)
        u1 = self.conv1(u1)
        return self.final(u1)


# ── Lazy-loaded model singleton ───────────────────────────────────────────────
_model = None


def _load_model() -> None:
    """Load custom UNet from saved state dict."""
    global _model

    if _model is not None:
        return

    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"[abdomen] Model not found: {_MODEL_PATH}\n"
            f"Make sure 'unet_abdomen.pth' is inside the Models/ folder."
        )

    model = _UNet()
    state_dict = torch.load(_MODEL_PATH, map_location=_DEVICE)
    model.load_state_dict(state_dict)
    model.to(_DEVICE)
    model.eval()

    _model = model
    logger.info(f"[abdomen] Custom UNet loaded on {_DEVICE}")


def _predict_mask(image_np: np.ndarray) -> np.ndarray:
    """
    Run UNet inference on grayscale image.
    Returns binary mask (256, 256) with values 0 or 1.
    """
    _load_model()

    # Convert RGB → grayscale → resize → normalize (matches notebook exactly)
    gray       = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    resized    = cv2.resize(gray, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_LINEAR)
    normalized = resized / 255.0

    # Add batch + channel dims: (1, 1, 256, 256)
    tensor = torch.tensor(normalized, dtype=torch.float32)\
                  .unsqueeze(0).unsqueeze(0).to(_DEVICE)

    with torch.no_grad():
        output = _model(tensor)
        pred   = torch.sigmoid(output)
        mask   = (pred > 0.5).squeeze().cpu().numpy().astype(np.uint8)

    return mask  # (256, 256)


def _mask_to_ac_mm(mask: np.ndarray, pixel_spacing: float) -> float | None:
    """
    Convert binary segmentation mask → AC in mm.
    Follows process_abdomen() from notebook exactly.
    """
    # Morphological closing (7×7 kernel — from notebook)
    kernel = np.ones((7, 7), np.uint8)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # Keep only largest connected component
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    if num_labels > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        mask    = (labels == largest).astype(np.uint8)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        logger.warning("[abdomen] No contours found in mask")
        return None

    cnt = max(contours, key=cv2.contourArea)

    if len(cnt) < 5:
        logger.warning("[abdomen] Contour too small to fit ellipse")
        return None

    # Fit ellipse → AC formula from notebook
    ellipse      = cv2.fitEllipse(cnt)
    (_, axes, _) = ellipse
    a            = max(axes)   # full axis (not semi)
    b            = min(axes)

    # AC = π × (a + b) / 2  — from notebook exactly
    ac_pixels = np.pi * (a + b) / 2
    ac_mm     = ac_pixels * pixel_spacing

    logger.info(f"[abdomen] Ellipse axes: a={a:.1f}px, b={b:.1f}px → AC={ac_mm:.2f}mm")
    return ac_mm


def _classify_ac(ac_mm: float, gestational_age: int) -> str:
    """
    Compare AC against expected range for gestational age.
    Follows classify_ac() from notebook:
      expected = 10 × GA
      < 0.9 × expected → SGA risk (Mildly Underdeveloped)
      > 1.1 × expected → LGA risk (Large for Gestational Age)
      else             → Normal
    """
    expected = 10.0 * gestational_age

    if ac_mm < 0.9 * expected:
        return "Mildly Underdeveloped"
    elif ac_mm > 1.1 * expected:
        return "Large for Gestational Age"
    else:
        return "Normal"


def measure_abdominal_circumference(
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
            "AC_mm":   float,
            "status":  "Normal" | "Mildly Underdeveloped" | "Large for Gestational Age",
        }
        or None if measurement fails.
    """
    try:
        mask  = _predict_mask(image_np)
        ac_mm = _mask_to_ac_mm(mask, pixel_spacing)

        if ac_mm is None:
            return None

        status = "Unknown"
        if gestational_age is not None:
            status = _classify_ac(ac_mm, gestational_age)

        logger.info(f"[abdomen] AC={ac_mm:.2f}mm | GA={gestational_age}w | Status={status}")

        return {
            "AC_mm":  round(ac_mm, 2),
            "status": status,
        }

    except Exception as e:
        logger.error(f"[abdomen] Measurement failed: {e}")
        return None