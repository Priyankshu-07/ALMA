from services.report_aggregator import aggregate_results
from services.ai_report_service import generate_ai_report
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
from services.femur import measure_femur_length

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

HEAD_PIXEL_SPACING = 0.176  # mm/pixel — calibration constant for HC measurement


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


class ReportRequest(BaseModel):
    maternal_result:    Optional[dict] = None
    fhr_result:         Optional[dict] = None
    ultrasound_results: Optional[List[dict]] = None


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}


def _read_image(file_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(image)


def _analyze_single_image(
    image_np: np.ndarray,
    gestational_age: Optional[int],
) -> dict:
    classify_result = classify_plane(image_np)
    plane      = classify_result["plane"]
    raw_label  = classify_result["raw_label"]
    confidence = classify_result["confidence"]

    if plane == "UNKNOWN":
        return {
            "plane_detected":   "UNKNOWN",
            "raw_label":        raw_label,
            "confidence":       confidence,
            "measurements":     {"HC_mm": None, "AC_mm": None, "FL_mm": None},
            "measurement_status": None,
            "development_status": None,
            "error": (
                f"Could not identify a measurable fetal plane. "
                f"Detected '{raw_label}' with {confidence*100:.1f}% confidence. "
                f"Please upload a HEAD or FEMUR image."
            ),
        }

    hc_mm, ac_mm, fl_mm     = None, None, None
    measurement_status       = None

    if plane == "HEAD":
        result = measure_head_circumference(
            image_np=image_np,
            gestational_age=gestational_age,
            pixel_spacing=HEAD_PIXEL_SPACING,
        )
        if result:
            hc_mm              = result["HC_mm"]
            measurement_status = result["status"]
    elif plane == "FEMUR":
        result = measure_femur_length(image_np)
        if result:
            fl_mm = result["FL_mm"]
            if gestational_age is not None and fl_mm is not None:
                expected_fl = gestational_age * 1.8
                if fl_mm < expected_fl * 0.85:
                    measurement_status = "Severely Underdeveloped"
                elif fl_mm < expected_fl * 0.95:
                    measurement_status = "Mildly Underdeveloped"
                elif fl_mm > expected_fl * 1.15:
                    measurement_status = "Large for Gestational Age"
                else:
                    measurement_status = "Normal"

    return {
        "plane_detected":   plane,
        "raw_label":        raw_label,
        "confidence":       confidence,
        "measurements": {
            "HC_mm": round(hc_mm, 2) if hc_mm is not None else None,
            "AC_mm": round(ac_mm, 2) if ac_mm is not None else None,
            "FL_mm": round(fl_mm, 2) if fl_mm is not None else None,
        },
        "measurement_status":  measurement_status,
        "development_status":  measurement_status,
        "error":                None,
    }


@app.get("/")
def root():
    return {"status": "ok", "message": "Fetal Health Analysis API is running"}


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


@app.post("/generate-report")
def generate_report(request: ReportRequest):
    try:
        combined = aggregate_results(
            request.maternal_result,
            request.fhr_result,
            request.ultrasound_results,
        )
        report = generate_ai_report(combined)
        return JSONResponse(content={
            "status": "success",
            "report": report,
        })
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)