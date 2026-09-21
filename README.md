<div align="center">
  <div style="font-size: 6rem; margin-bottom: 20px;">💧</div>
  
  # JalRakshak
  **AI-Powered Water Quality Monitoring & Vernacular Advisory System**
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
  [![IS_10500:2012](https://img.shields.io/badge/Standards-IS_10500:2012-blue?style=for-the-badge)](#)
</div>

<br />

## 📌 Overview
**JalRakshak** is an intelligent water quality analysis and citizen communication platform. It analyzes real-time and historical water quality datasets (over **50,000 real samples**) against the **IS 10500:2012 Indian Standard** for drinking water. 

Rather than relying purely on AI to make critical safety decisions, JalRakshak implements a strict decoupled architecture:
1. **Deterministic Rule Engine:** Accurately classifies biological, chemical, and physical hazards with zero hallucinations.
2. **AI Translation Layer (Gemini):** Translates these strict safety decisions into **14 local languages**, delivering contextualized WhatsApp-style alerts to rural citizens.

---

## ✨ Key Features
- **📊 Comprehensive Dashboard:** Visualize hazard severity, geographical distribution, and chemical/biological breakdowns across Indian states.
- **🛡️ Deterministic Rule Engine:** Evaluates complex parameters (Arsenic, Fluoride, E. coli, pH, Turbidity, TDS, etc.) directly against scientific safety thresholds.
- **🌍 14-Language AI Advisory:** Automatically generates safety warnings in English, Hindi, Punjabi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Odia, Assamese, Urdu, and Arabic.
- **⚡ Bulletproof Fallbacks:** If the AI API fails, the system safely falls back to a deterministic, human-verified templated translation so citizens are never without critical safety data.
- **🚫 Safe-Guard Invariants:** Gemini cannot override safety classifications (e.g., suggesting "boiling" for chemical hazards where boiling increases toxicity).

---

## 🏗️ Architecture
- **Backend:** `FastAPI`, `Python`, `SQLAlchemy`, `SQLite` — Handles mathematical evaluations, API routes, and interfaces with Gemini.
- **Frontend:** `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Recharts` — Dynamic dashboard and citizen preview interfaces.
- **AI/LLM:** `Google GenAI / Gemini 3.6 Flash` — Operates strictly as a localization/communication engine.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
source .venv/bin/activate      # Mac/Linux
.venv\Scripts\activate         # Windows

pip install -r requirements.txt
```
Set up your environment variables by copying the example:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` in `.env`.

Run the backend server:
```bash
fastapi dev app/main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8000`.

---

## 🗄️ Dataset
JalRakshak ships with a high-density SQLite database (`water_quality.db`) containing **50,000 real-world samples** across Indian districts. 
- *Data integrity is critical:* The database is populated with verified records and is not meant to be wiped during regular development.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

<br />
<div align="center">
  <sub>Built with ❤️ to ensure safe drinking water access.</sub>
</div>
