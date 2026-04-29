import os
import io
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np

from services.maternal import predict_maternal_risk
from services.fhr import predict_fhr
from services.classify import classify_plane
from services.head import measure_head_circumference
from services.abdomen import measure_abdominal_circumference
from services.femur import measure_femur_length
from services.hadlock import estimate_fetal_weight

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("fetal_health")

app = FastAPI(title="Fetal Health Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MaternalRequest(BaseModel):
    age: float
    systolicBP: float
    diastolicBP: float
    bloodSugar: float
    bodyTemperature: float
    heartRate: float


class FHRRequest(BaseModel):
    baseline: float
    accelerations: float
    fetalMovement: float
    uterineContractions: float
    lightDecelerations: float
    severeDecelerations: float


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
            "status": "success",
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
            request.uterineContractions, request.lightDecelerations, request.severeDecelerations,
        ]
        result = predict_fhr(features)
        return JSONResponse(content={
            "status": "success",
            "prediction": result["condition"],
            "confidence": result.get("confidence"),
        })
    except Exception as e:
        logger.error(f"FHR prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Upload a JPEG or PNG image.")

        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(image)

        plane = classify_plane(image_np)
        hc_mm, ac_mm, fl_mm = None, None, None

        if plane == "HEAD":
            hc_mm = measure_head_circumference(image_np)
        elif plane == "ABDOMEN":
            ac_mm = measure_abdominal_circumference(image_np)
        elif plane == "FEMUR":
            femur_result = measure_femur_length(image_np)
            fl_mm = femur_result["FL_mm"] if femur_result is not None else None
        else:
            raise HTTPException(status_code=422, detail=f"Could not classify ultrasound plane. Got: {plane}")

        efw_grams = None
        if any(v is not None for v in [hc_mm, ac_mm, fl_mm]):
            efw_grams = estimate_fetal_weight(hc=hc_mm, ac=ac_mm, fl=fl_mm)

        growth_status = None
        if efw_grams is not None:
            if efw_grams < 1700:
                growth_status = "underdeveloped"
            elif efw_grams > 2500:
                growth_status = "overgrowth"
            else:
                growth_status = "normal"

        return JSONResponse(content={
            "status": "success",
            "plane_detected": plane,
            "measurements": {
                "HC_mm": round(hc_mm, 2) if hc_mm is not None else None,
                "AC_mm": round(ac_mm, 2) if ac_mm is not None else None,
                "FL_mm": round(fl_mm, 2) if fl_mm is not None else None,
            },
            "estimated_fetal_weight_grams": round(efw_grams, 2) if efw_grams is not None else None,
            "growth_status": growth_status,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)