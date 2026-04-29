"""
services/femur.py
Femur length (FL) detection using OpenCV edge detection + Hough transform.
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger("fetal_health.femur")

# Adjust this if your ultrasound machine has a known calibration factor
PIXEL_SPACING_MM = 0.28  # mm per pixel


def detect_femur_length_pixels(image: np.ndarray) -> float | None:
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=80,
        minLineLength=80,
        maxLineGap=10,
    )
    if lines is None:
        logger.warning("No lines detected in femur image")
        return None

    max_len = 0.0
    for line in lines:
        x1, y1, x2, y2 = line[0]
        dx = x2 - x1
        dy = y2 - y1
        length = np.hypot(dx, dy)
        angle = abs(np.degrees(np.arctan2(dy, dx)))

        # Skip near-horizontal lines
        if angle < 15 or angle > 165:
            continue
        if length > max_len:
            max_len = length

    if max_len < 120 or max_len > 320:
        logger.warning(f"Femur pixel length {max_len:.1f}px outside valid range [120, 320]")
        return None

    return max_len


def measure_femur_length(image: np.ndarray, pixel_spacing: float = PIXEL_SPACING_MM) -> dict | None:
    """
    Public interface called by main.py.
    Returns dict with FL_mm and FL_pixels, or None if detection fails.
    """
    pixel_length = detect_femur_length_pixels(image)

    if pixel_length is None:
        logger.warning("Femur length detection returned None")
        return None

    fl_mm = pixel_length * pixel_spacing
    logger.info(f"FL: {pixel_length:.1f}px → {fl_mm:.2f}mm")

    return {
        "FL_mm": round(fl_mm, 2),
        "FL_pixels": round(pixel_length, 2),
    }