<div align="center">

#  Fetal Health Analysis Platform
### AI-Powered Clinical Decision Support for Maternal & Fetal Health

*A full-stack healthcare AI system combining machine learning, deep learning, computer vision, and modern web engineering to support prenatal risk assessment.*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](#tech-stack)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](#tech-stack)
[![PyTorch](https://img.shields.io/badge/DL-PyTorch-EE4C2C?logo=pytorch)](#tech-stack)
[![TensorFlow](https://img.shields.io/badge/DL-TensorFlow-FF6F00?logo=tensorflow)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

[Demo Video](https://drive.google.com/file/d/1tDOiBD4-HCEmggOax7Q0tDK33VmeIyC7/view?usp=drive_link) · [Features](#-project-highlights) · [Architecture](#-system-architecture) · [Pipelines](#-machine-learning--deep-learning-pipelines) · [Tech Stack](#-tech-stack)

</div>

---

##  Overview

Prenatal care depends on interpreting several independent data sources — maternal vitals, fetal heart-rate monitoring, and ultrasound imaging — often across disconnected tools. **This platform unifies all three into a single clinical dashboard**, using five purpose-built ML, DL, and classical CV pipelines to turn raw clinical data into actionable, real-time risk assessments.

Built end-to-end (data pipeline → model training → inference services → production UI), the project demonstrates the full lifecycle of applied AI: from a Kaggle-grade research notebook to a deployable, API-driven web application.

---

##  Project Highlights

- **Full-stack healthcare AI platform** — Next.js + TypeScript frontend, FastAPI + Python backend
- **5 independent pipelines** — spanning classical ML, deep learning, and classical computer vision — unified into one clinical dashboard
- **Maternal Risk Prediction** — XGBoost classifier on clinical vitals
- **CTG Fetal Health Classification** — custom ANN trained on cardiotocography signals, with deliberate class-imbalance tuning for clinical safety
- **Ultrasound Plane Classification** — ResNet50 (transfer learning) with **Grad-CAM explainability**, so predictions are interpretable, not black-box
- **Fetal Head Segmentation** — U-Net for pixel-level anatomical structure detection
- **Femur Length Measurement** — classical OpenCV pipeline (CLAHE + Canny + Hough Line Transform) that geometrically measures femur length from segmented ultrasound frames, no additional model required
- **Modular FastAPI microservices** for real-time, independently-scalable model inference
- **AI-generated clinical reports** synthesizing outputs from all five pipelines into one summary

---

##  Problem Statement

Prenatal healthcare requires synthesizing multiple, heterogeneous data types — clinical vitals, time-series fetal heart monitoring, and medical imaging — to make timely risk decisions. This platform acts as an intelligent decision-support layer that:

- Predicts maternal health risk from vitals
- Classifies fetal health status from CTG data
- Detects fetal anatomical planes in ultrasound scans
- Segments fetal anatomical structures for biometric measurement
- Delivers every result through a unified, modern web interface

---

##  Demo

| | |
|---|---|
| **Dashboard** — combined assessment across all modules | ![Dashboard](./demo/dashboard.png) |
| **Maternal Risk Prediction** — AI-powered classification from vitals (Age, BP, Blood Sugar, Heart Rate, Body Temp) | ![Maternal Risk Prediction](./demo/maternal_risk.png) |
| **Fetal Heart Rate (CTG) Analysis** — classify fetal health from Baseline FHR, Accelerations, Decelerations | ![FHR Analysis](./demo/fhr_analysis.png) |
| **Ultrasound Image Analysis** — upload Head / Abdomen / Femur scans for plane classification & biometry | ![Ultrasound Analysis](./demo/ultrasound.png) |
| **AI Clinical Report** — consolidated report across all modules | ![AI Clinical Report](./demo/ai_report.png) |

 **[Watch the full demo video](https://drive.google.com/file/d/1tDOiBD4-HCEmggOax7Q0tDK33VmeIyC7/view?usp=drive_link)**

![Flow Chart](./demo/fetal_health_flowchart.png)

---

##  System Architecture

```mermaid
flowchart TD
    A["👤 Clinical User<br/>Vitals · CTG data · Ultrasound scan"] --> B["Frontend — Next.js + TypeScript<br/>Clinical Dashboard UI"]
    B -- "REST API" --> C["FastAPI Backend<br/>Request routing & I/O"]

    C --> D["Maternal Risk<br/>XGBoost"]
    C --> E["CTG Analysis<br/>ANN"]
    C --> F["Ultrasound Plane Classification<br/>ResNet50 + Grad-CAM"]

    F --> G["Head Segmentation<br/>U-Net"]
    F --> H["Femur Length Measurement<br/>Classical CV: CLAHE → Canny → Hough Line Transform"]

    D --> I["Aggregated Predictions"]
    E --> I
    G --> I
    H --> I

    I --> J["Interactive Clinical Dashboard"]
    I --> K["AI-Generated Clinical Report"]

    style A fill:#f5f5f5,stroke:#999,color:#111
    style B fill:#dbeafe,stroke:#3b82f6,color:#111
    style C fill:#dbeafe,stroke:#3b82f6,color:#111
    style D fill:#dcfce7,stroke:#22c55e,color:#111
    style E fill:#dcfce7,stroke:#22c55e,color:#111
    style F fill:#fef3c7,stroke:#f59e0b,color:#111
    style G fill:#fef3c7,stroke:#f59e0b,color:#111
    style H fill:#fce7f3,stroke:#ec4899,color:#111
    style I fill:#ede9fe,stroke:#8b5cf6,color:#111
    style J fill:#f5f5f5,stroke:#999,color:#111
    style K fill:#f5f5f5,stroke:#999,color:#111
```

> **Femur measurement, unpacked:** once the ResNet50 classifier tags a frame as a "Femur" plane, that frame is routed to a **deterministic OpenCV pipeline** — not a second neural network. CLAHE contrast enhancement + Gaussian blur clean up the ultrasound noise, Canny edge detection finds bone boundaries, and a probabilistic Hough Line Transform isolates the longest valid near-horizontal line (the femur shaft axis, filtered by angle and length bounds). The pixel length is then converted to millimeters via a fixed pixel-spacing calibration constant. It's a deliberate choice: femur length is a well-defined geometric measurement, so a classical CV algorithm gives a fast, deterministic, and fully explainable result — no training data or GPU inference needed for this step.

---

##  Model Performance

| Pipeline | Model | Metric | Result |
|---|---|---|---|
| Maternal Risk Prediction | XGBoost | Test Accuracy | **81.77%** |
| CTG Fetal Health Classification | ANN | Test Accuracy | **~80%** (macro F1: 0.632) |
| Ultrasound Plane Classification | ResNet50 | Accuracy | **93.0%** |
| Fetal Head Segmentation | U-Net | IoU | **95.66%** |
| Femur Length Measurement | Classical CV (OpenCV) | Method | Deterministic geometric measurement — no accuracy metric applies |

> **Engineering note:** the CTG/ANN model's raw accuracy peaked higher, but the initial version recognized only **5.71%** of true Pathological cases — an unacceptable miss rate for a clinical-safety-critical class. Iterative `class_weight` tuning traded a small amount of overall accuracy for a **7× improvement in Pathological recall (5.71% → 40%)**, prioritizing the metric that actually matters in this domain: not missing high-risk cases.

---

##  Machine Learning, Deep Learning & Computer Vision Pipelines

### 1. Maternal Health Risk Prediction
**Objective:** Predict maternal health risk level from clinical vitals.
**Input Features:** Age, Systolic BP, Diastolic BP, Blood Glucose, Body Temperature, Heart Rate
**Model:** XGBoost Classifier
**Output:** Low Risk / Medium Risk / High Risk

### 2. CTG Fetal Health Classification
**Objective:** Classify fetal health status from cardiotocography (CTG) measurements.
**Model:** Artificial Neural Network (ANN), tuned for class-imbalance-aware recall on the clinically critical minority class.
**Output Classes:** Normal / Suspect / Pathological

### 3. Ultrasound Anatomical Plane Classification
**Objective:** Identify fetal anatomical planes from ultrasound images.
**Model:** ResNet50 (Transfer Learning)
**Explainability:** Grad-CAM visualization highlights the image regions driving each prediction
**Supported Planes:** Head / Abdomen / Femur / Other Fetal Planes

### 4. Fetal Head Segmentation
**Objective:** Generate pixel-level segmentation masks of fetal head regions.
**Model:** U-Net
**Applications:** Head circumference estimation, growth monitoring

### 5. Femur Length Measurement
**Objective:** Measure femur length (FL) from ultrasound frames already classified as the "Femur" plane.
**Approach:** Classical computer vision, not a trained model. Femur images are first segregated from the U-Net fetal-parts classification dataset, then processed through:
1. **CLAHE** (Contrast Limited Adaptive Histogram Equalization) to enhance bone contrast against ultrasound noise
2. **Gaussian blur** to suppress speckle noise
3. **Canny edge detection** to extract bone boundaries
4. **Probabilistic Hough Line Transform** to detect candidate line segments, filtered by angle (rejecting near-vertical lines) and length bounds to isolate the true femur shaft axis
5. **Pixel-to-mm conversion** via a fixed pixel-spacing calibration constant to output the final `FL_mm`

**Why classical CV instead of another model:** femur length is a well-defined geometric measurement once the bone is visible — a deterministic algorithm is faster, fully explainable, and needs no additional labeled training data, unlike a learned segmentation or regression model.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, TypeScript, React, Tailwind CSS |
| Backend | FastAPI, Python |
| Machine Learning | XGBoost, Scikit-Learn |
| Deep Learning | TensorFlow / Keras, PyTorch |
| Computer Vision | OpenCV, Grad-CAM |
| Data Processing | NumPy, Pandas |

---

##  Project Structure

```
FETAL-HEALTH/
│
├── Backend/
│   ├── main.py
│   └── services/
│       ├── maternal.py
│       ├── fhr.py
│       ├── classify.py
│       ├── head.py
│       ├── femur.py
│       └── hadlock.py
│
├── FRONTEND/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│
├── Models/
│   ├── best_model.pkl
│   ├── fetal_health_ann_model.h5
│   ├── resnet50_fetal_planes.pth
│   └── head.pth
│
├── Notebooks/
│   ├── MHRP_XGBoost.ipynb
│   ├── FetalHealthrate.ipynb
│   ├── UltrasoundImage+femur.ipynb
│   └── Head.ipynb
│
├── demo/
│   ├── dashboard.png
│   ├── maternal_risk.png
│   ├── fhr_analysis.png
│   ├── ultrasound.png
│   └── ai_report.png
│
└── README.md
```

---

##  Technical Challenges & Solutions

| Challenge | How it was addressed |
|---|---|
| Heterogeneous healthcare datasets (tabular + time-series + image) | Built separate, purpose-fit pipelines per modality instead of forcing one model architecture |
| Multiple ML/DL model types in one workflow | Standardized on modular FastAPI inference services, each independently deployable |
| Severe class imbalance in CTG data (Pathological cases rare) | Iteratively tuned `class_weight` strategies to prioritize recall on the clinically critical class over raw accuracy |
| Ultrasound image preprocessing at scale | OpenCV-based preprocessing pipeline feeding a ResNet50 transfer-learning model |
| Model interpretability for clinical trust | Integrated Grad-CAM so predictions are visually explainable, not black-box |
| Integrating segmentation + classification pipelines | Unified output schema so the frontend renders both under one dashboard |
| Measuring femur length without a dedicated regression model | Segregated femur frames from the classification dataset and built a classical OpenCV pipeline (CLAHE → Canny → Hough Line Transform) with angle/length filtering to isolate the correct bone-axis line |

---

##  Future Enhancements

- RAG-powered AI Clinical Assistant for guideline-grounded Q&A
- Medical guideline retrieval using vector databases
- LangChain-based conversational interface
- DICOM image support
- Gestational age estimation
- Cloud deployment via Docker + Kubernetes
- Hospital system integration via HL7/FHIR standards

---

##  License

Released under the [MIT License](LICENSE).

---

<div align="center">

**Built to demonstrate end-to-end applied AI engineering — from raw clinical data to a production-ready clinical dashboard.**

</div>
