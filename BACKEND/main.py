"""
main.py
Fetal Health Analysis API

Routes:
  GET  /                  → health check
  GET  /health            → health check
  POST /predict-maternal  → maternal risk prediction
  POST /predict-fhr       → fetal heart rate condition
  POST /analyze-image     → single ultrasound image analysis
  POST /analyze-images    → multiple ultrasound images (1-3) + gestational age
"""

import io
import logging
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel

from services.maternal import predict_maternal_risk
from services.fhr import predict_fhr
from services.classify import classify_plane
from services.head import measure_head_circumference
from services.abdomen import measure_abdominal_circumference
from services.femur import measure_femur_length
from services.hadlock import estimate_fetal_weight, classify_efw

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("fetal_health")

app = FastAPI(title="Fetal Health Analysis API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class MaternalRequest(BaseModel):
    age:             float
    systolicBP:      float
    diastolicBP:     float
    bloodSugar:      float
    bodyTemperature: float
    heartRate:       float


class FHRRequest(BaseModel):
    baseline:            float
    accelerations:       float
    fetalMovement:       float
    uterineContractions: float
    lightDecelerations:  float
    severeDecelerations: float


# ── Utility ────────────────────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}


def _read_image(file_bytes: bytes) -> np.ndarray:
    """Convert raw bytes → RGB numpy array."""
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(image)


def _analyze_single_image(
    image_np: np.ndarray,
    gestational_age: Optional[int],
) -> dict:
    """
    Full pipeline for one ultrasound image:
      classify → measure → hadlock → status
    """
    # Step 1: Classify plane
    classify_result = classify_plane(image_np)
    plane      = classify_result["plane"]
    raw_label  = classify_result["raw_label"]
    confidence = classify_result["confidence"]

    # Step 2: Fallback if unrecognized
    if plane == "UNKNOWN":
        return {
            "plane_detected":   "UNKNOWN",
            "raw_label":        raw_label,
            "confidence":       confidence,
            "measurements":     {"HC_mm": None, "AC_mm": None, "FL_mm": None},
            "measurement_status": None,
            "estimated_fetal_weight_grams": None,
            "growth_status":    None,
            "error": (
                f"Could not identify a measurable fetal plane. "
                f"Detected '{raw_label}' with {confidence*100:.1f}% confidence. "
                f"Please upload a HEAD, ABDOMEN, or FEMUR image."
            ),
        }

    # Step 3: Measure based on plane
    hc_mm, ac_mm, fl_mm     = None, None, None
    measurement_status       = None

    if plane == "HEAD":
        result = measure_head_circumference(image_np, gestational_age)
        if result:
            hc_mm              = result["HC_mm"]
            measurement_status = result["status"]

    elif plane == "ABDOMEN":
        result = measure_abdominal_circumference(image_np, gestational_age)
        if result:
            ac_mm              = result["AC_mm"]
            measurement_status = result["status"]

    elif plane == "FEMUR":
        result = measure_femur_length(image_np)
        if result:
            fl_mm = result["FL_mm"]
            # Femur status via simple GA comparison
            if gestational_age is not None and fl_mm is not None:
                expected_fl = gestational_age * 1.8  # approx mm
                if fl_mm < expected_fl * 0.85:
                    measurement_status = "Severely Underdeveloped"
                elif fl_mm < expected_fl * 0.95:
                    measurement_status = "Mildly Underdeveloped"
                elif fl_mm > expected_fl * 1.15:
                    measurement_status = "Large for Gestational Age"
                else:
                    measurement_status = "Normal"

    # Step 4: EFW via Hadlock
    efw_grams    = None
    growth_status = None

    if any(v is not None for v in [hc_mm, ac_mm, fl_mm]):
        efw_grams = estimate_fetal_weight(hc=hc_mm, ac=ac_mm, fl=fl_mm)

    if efw_grams is not None and gestational_age is not None:
        growth_status = classify_efw(efw_grams, gestational_age)
    elif efw_grams is not None:
        # Fallback if no GA provided
        if efw_grams < 1700:
            growth_status = "Underdeveloped"
        elif efw_grams > 4000:
            growth_status = "Large for Gestational Age"
        else:
            growth_status = "Normal"

    return {
        "plane_detected":   plane,
        "raw_label":        raw_label,
        "confidence":       confidence,
        "measurements": {
            "HC_mm": round(hc_mm, 2) if hc_mm is not None else None,
            "AC_mm": round(ac_mm, 2) if ac_mm is not None else None,
            "FL_mm": round(fl_mm, 2) if fl_mm is not None else None,
        },
        "measurement_status":           measurement_status,
        "estimated_fetal_weight_grams": round(efw_grams, 2) if efw_grams else None,
        "growth_status":                growth_status,
        "error":                        None,
    }


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Fetal Health Analysis API v2 is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/predict-maternal")
def predict_maternal(request: MaternalRequest):
    try:
        features = [
            request.age, request.systolicBP, request.diastolicBP,
            request.bloodSugar, request.bodyTemperature, request.heartRate,
        ]
        result = predict_maternal_risk(features)
        return JSONResponse(content={
            "status":     "success",
            "prediction": result["risk_level"],
            "confidence": result.get("confidence"),
        })
    except Exception as e:
        logger.error(f"Maternal prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-fhr")
def predict_fhr_route(request: FHRRequest):
    try:
        features = [
            request.baseline, request.accelerations, request.fetalMovement,
            request.uterineContractions, request.lightDecelerations,
            request.severeDecelerations,
        ]
        result = predict_fhr(features)
        return JSONResponse(content={
            "status":     "success",
            "prediction": result["condition"],
            "confidence": result.get("confidence"),
        })
    except Exception as e:
        logger.error(f"FHR prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-image")
async def analyze_image(
    file:             UploadFile = File(...),
    gestational_age:  Optional[int] = Form(None),
):
    """Single image analysis — backward compatible."""
    try:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Upload JPEG or PNG.",
            )
        contents = await file.read()
        image_np = _read_image(contents)
        result   = _analyze_single_image(image_np, gestational_age)

        return JSONResponse(content={"status": "success", **result})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-images")
async def analyze_images(
    files:           List[UploadFile] = File(...),
    gestational_age: int              = Form(...),
):
    """
    Multi-image analysis — accepts 1 to 3 ultrasound images.
    All images share the same gestational age (same fetus).

    Returns a list of results, one per image.
    """
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 images allowed.")

    results = []

    for idx, file in enumerate(files):
        if file.content_type not in ALLOWED_TYPES:
            results.append({
                "image_index": idx + 1,
                "filename":    file.filename,
                "error":       f"Invalid file type: {file.content_type}",
            })
            continue

        try:
            contents = await file.read()
            image_np = _read_image(contents)
            result   = _analyze_single_image(image_np, gestational_age)

            results.append({
                "image_index": idx + 1,
                "filename":    file.filename,
                **result,
            })

        except Exception as e:
            logger.error(f"Failed to analyze image {idx+1} ({file.filename}): {e}")
            results.append({
                "image_index": idx + 1,
                "filename":    file.filename,
                "error":       str(e),
            })

    return JSONResponse(content={
        "status":          "success",
        "gestational_age": gestational_age,
        "total_images":    len(files),
        "results":         results,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)