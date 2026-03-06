import joblib
import tensorflow as tf
import numpy as np

maternal_model = joblib.load("../models/best_model.pkl")
maternal_scaler = joblib.load("../models/scaler.pkl")

fhr_model = tf.keras.models.load_model("../models/ann_fhr_model.keras")
fhr_scaler = joblib.load("../models/fhr_scaler.pkl")
label_encoder = joblib.load("../models/label_encoder.pkl")


def predict_maternal(data):

    features = np.array([[
        data["age"],
        data["systolic_bp"],
        data["diastolic_bp"],
        data["blood_sugar"],
        data["body_temp"],
        data["heart_rate"]
    ]])

    features = maternal_scaler.transform(features)

    prediction = maternal_model.predict(features)

    return int(prediction[0])


def predict_fhr(data):

    features = np.array([[
        data["baseline"],
        data["accelerations"],
        data["fetal_movement"],
        data["uterine_contractions"]
    ]])

    features = fhr_scaler.transform(features)

    prediction = fhr_model.predict(features)

    predicted_class = np.argmax(prediction)

    label = label_encoder.inverse_transform([predicted_class])

    return label[0]