# 🩺 Fetal Health Analysis using Machine Learning & AI Assistant

> An intelligent, multi-pipeline clinical decision support system for maternal and fetal health monitoring — combining classical ML, deep learning, and a conversational AI assistant into a unified, evidence-based platform.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [ML & DL Pipelines](#-ml--dl-pipelines)
- [AI Assistant](#-ai-assistant)
- [Tech Stack](#-tech-stack)
- [Datasets](#-datasets)
- [Getting Started](#-getting-started)
- [Future Work](#-future-work)
- [License](#-license)

---

## 🧬 Overview

**Fetal Health Analysis** is a final-year capstone project that addresses the critical need for intelligent, accessible prenatal monitoring tools. The system integrates **five machine learning and deep learning pipelines** covering maternal risk, fetal cardiac activity, and anatomical ultrasound classification — all unified under a **RAG-powered conversational AI assistant** that provides personalized, evidence-based guidance to clinicians or patients.

The platform ingests structured clinical data, CTG (cardiotocography) signals, and fetal ultrasound images to produce risk assessments and classifications in real time. The embedded AI assistant then contextualizes these outputs alongside a patient's history and indexed medical literature to generate meaningful, actionable responses.

---

## ✨ Key Features

- 🔴 **Maternal Risk Classification** — Predicts Low / Medium / High maternal health risk using XGBoost on clinical vitals
- 💓 **CTG Fetal State Analysis** — Classifies fetal state as Normal / Suspect / Pathological via an Artificial Neural Network
- 🖼️ **Fetal Ultrasound Plane Detection** — Identifies anatomical scan planes (Head, Abdomen, Femur, etc.) using ResNet50 with Grad-CAM interpretability overlays
- 🧠 **Fetal Head Segmentation** — Semantic segmentation of the fetal head in ultrasound images using U-Net
- 🫀 **Fetal Abdomen Segmentation** — Anatomical segmentation of fetal abdominal structures using U-Net
- 🤖 **AI Assistant (RAG)** — A LangChain-powered conversational assistant that fuses ML predictions and medical guidelines into personalised, context-aware clinical responses

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React.js Frontend                    │
│              (TypeScript, Component-based UI)            │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                         │
│         (Python, Async endpoints, Pydantic models)        │
└───┬──────────────┬──────────────┬──────────────┬─────────┘
    │              │              │              │
┌───▼───┐   ┌──────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
│XGBoost│   │  ANN (CTG) │  │ResNet50 │  │  U-Net x2  │
│Maternal│  │Fetal State │  │ + Grad- │  │ Head Seg.  │
│ Risk  │   │Classifier  │  │   CAM   │  │ Abdo Seg.  │
└───────┘   └────────────┘  └─────────┘  └────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   AI Assistant Layer                      │
│                                                          │
│  ┌──────────────┐        ┌──────────────┐               │
│  │  LangChain   │        │  Vector DB   │               │
│  │  Memory +    │◄──────►│(Chroma /    │               │
│  │  LLM Chain   │        │  Pinecone)   │               │
│  └──────────────┘        └──────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔬 ML & DL Pipelines

### 1. Maternal Health Risk Prediction
| Attribute | Detail |
|-----------|--------|
| Model | XGBoost Classifier |
| Input | Age, Blood Pressure, Blood Glucose, Body Temp, Heart Rate |
| Output | Risk Level: **Low / Medium / High** |
| Dataset | [Kaggle — csafrit2](https://www.kaggle.com/datasets/csafrit2/maternal-health-risk-data) |

---

### 2. Fetal Heart Rate (CTG) Analysis
| Attribute | Detail |
|-----------|--------|
| Model | Artificial Neural Network (ANN) |
| Input | 21 CTG features (baseline FHR, accelerations, decelerations, histogram features, etc.) |
| Output | Fetal State: **Normal / Suspect / Pathological** |
| Dataset | [Kaggle — andrewmvd](https://www.kaggle.com/datasets/andrewmvd/fetal-health-classification) |

---

### 3. Fetal Ultrasound Anatomical Plane Classification
| Attribute | Detail |
|-----------|--------|
| Model | ResNet50 (Transfer Learning) + Grad-CAM |
| Input | 2D Fetal Ultrasound Images |
| Output | Anatomical Plane: Head / Abdomen / Femur / Other |
| Explainability | Grad-CAM heatmaps to highlight model attention regions |
| Dataset | [Zenodo — Record 3904280](https://zenodo.org/records/3904280) |

---

### 4. Fetal Head Segmentation (U-Net)
| Attribute | Detail |
|-----------|--------|
| Model | U-Net (Encoder-Decoder with skip connections) |
| Input | Fetal head ultrasound scan |
| Output | Pixel-wise segmentation mask of the fetal head |
| Clinical Use | Head circumference estimation, growth assessment |
| Dataset | [Zenodo — Record 8265464](https://zenodo.org/records/8265464) |

---

### 5. Fetal Abdomen Segmentation (U-Net)
| Attribute | Detail |
|-----------|--------|
| Model | U-Net |
| Input | Fetal abdominal ultrasound images |
| Output | Segmentation mask of abdominal structures |
| Clinical Use | Abdominal circumference measurement, organ identification |
| Dataset | [Kaggle — orvile](https://www.kaggle.com/datasets/orvile/fetal-abdominal-structures-segmentation-dataset) |

---

## 🤖 AI Assistant

The AI assistant is the intelligence layer that synthesises everything:

- **Retrieval-Augmented Generation (RAG):** Queries a Vector DB (Chroma or Pinecone) pre-loaded with indexed medical guidelines and obstetric literature, retrieving the most relevant context before generating a response.
- **ML Output Integration:** Receives real-time risk scores and classifications from all five pipelines as part of its context window.
- **Conversational Memory:** Uses LangChain's memory module to maintain multi-turn conversation context, enabling coherent and progressive dialogue across a consultation session.
- **Prompt Engineering:** System prompts are carefully designed to ensure responses are medically responsible, evidence-based, and appropriately caveated.

```
User Query
    │
    ▼
LangChain Chain
    ├── Retrieve: Vector DB (medical guidelines)
    └── Generate: LLM with assembled context
         │
         ▼
   Personalised Clinical Response
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React.js, TypeScript |
| **Backend** | Python, FastAPI |
| **ML / DL** | XGBoost, ANN, ResNet50, U-Net, Scikit-learn, TensorFlow / PyTorch, OpenCV |
| **AI Layer** | LangChain, LLMs, Prompt Engineering |
| **Explainability** | Grad-CAM |

---

## 📊 Datasets

| # | Dataset | Source | Used For |
|---|---------|--------|----------|
| 1 | Maternal Health Risk Dataset | [Kaggle · csafrit2](https://www.kaggle.com/datasets/csafrit2/maternal-health-risk-data) | XGBoost maternal risk classifier (Low / Medium / High) |
| 2 | Fetal Health Classification (CTG) | [Kaggle · andrewmvd](https://www.kaggle.com/datasets/andrewmvd/fetal-health-classification) | ANN fetal state classifier (Normal / Suspect / Pathological) |
| 3 | Fetal Ultrasound Planes Dataset | [Zenodo · Record 3904280](https://zenodo.org/records/3904280) | ResNet50 anatomical plane classification + Grad-CAM |
| 4 | Fetal Head Ultrasound Dataset | [Zenodo · Record 8265464](https://zenodo.org/records/8265464) | U-Net fetal head segmentation |
| 5 | Fetal Abdominal Structures Dataset | [Kaggle · orvile](https://www.kaggle.com/datasets/orvile/fetal-abdominal-structures-segmentation-dataset) | U-Net fetal abdomen segmentation |

> **Note:** The Femur classification model reuses the Fetal Ultrasound Planes Dataset (Zenodo · Record 3904280), leveraging the femur plane subset within the same dataset.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- API key for your LLM provider (OpenAI / Anthropic)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fetal-health-analysis.git
cd fetal-health-analysis
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
OPENAI_API_KEY=your_openai_key           # or Anthropic key
VECTOR_DB=chroma                         # or pinecone
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Ingest Medical Guidelines into Vector DB

```bash
cd ai_assistant/vector_store
python ingest.py --source ../../data/guidelines/
```

### 5. Train Models (Optional — pre-trained weights included)

```bash
# Maternal Risk
python ml/maternal_risk/train.py

# CTG ANN
python ml/ctg_analysis/train.py

# ResNet50 Ultrasound Classifier
python ml/ultrasound_classification/train_resnet50.py

# U-Net Head Segmentation
python ml/head_segmentation/train_unet.py

# U-Net Abdomen Segmentation
python ml/abdomen_segmentation/train_unet.py
```

---

## 🔮 Future Work

- [ ] DICOM image support for hospital-grade ultrasound integration
- [ ] Gestational age estimation from fetal biometry measurements
- [ ] Real-time fetal movement monitoring via video analysis
- [ ] Integration with Electronic Health Records (EHR) systems via HL7/FHIR
- [ ] Federated learning to train across hospitals without sharing patient data

---

Built as a Final Year Project — combining clinical domain knowledge with modern AI/ML engineering to make prenatal care smarter and more accessible.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

