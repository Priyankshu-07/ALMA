from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predict import predict_maternal, predict_fhr
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/predict-maternal")
def maternal(data: dict):
    result = predict_maternal(data)
    return {"risk_level": result}
@app.post("/predict-fhr")
def fhr(data: dict):
    result = predict_fhr(data)
    return {"fetal_health": result}