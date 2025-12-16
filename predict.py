import tensorflow as tf
import joblib
import numpy as np
model = tf.keras.models.load_model("Models/ann_fhr_model.keras")
scaler = joblib.load("Models/fhr_scaler.pkl")
sample = np.random.rand(1, 21)

sample_scaled = scaler.transform(sample)

pred_prob = model.predict(sample_scaled)
pred_class = np.argmax(pred_prob, axis=1)

labels = ["Normal", "Suspect", "Pathological"]
print("Prediction probabilities:", pred_prob)
print("Final Prediction:", labels[pred_class[0]])
