# 🎓 Smart ERP - College Management System with Facial Emotion Detection & AI Proctoring

Smart ERP is a comprehensive, next-generation college ERP system designed with premium glassmorphism dark-mode aesthetics. It incorporates advanced AI features such as camera-based student wellness monitoring, automated attendance tracking via face classification models, real-time posture-based proctoring for online exams, and a voice-enabled AI counselor.

---

## 🌟 Key Features

### 1. 🧠 AI Student Wellness Monitor (Mood Fusion)
* **Dual-Input Analysis:** Fuses local facial expression analysis (OpenCV & CNN) with semantic sentiment analysis of written text (Google Gemini API).
* **Focus & Attention Scoring:** Computes student concentration metrics based on their text responses.
* **Faculty Alert System:** Automatically generates alerts for Faculty Guides when students register persistent `Sad` or `Stressed` states.

### 2. 📋 Automated Attendance Marking (Teachable Machine)
* **Webcam Face Recognition:** Faculty can scan the classroom using a webcam. The integrated Google Teachable Machine model automatically classifies students based on trained face profiles and marks their presence in real-time.

### 3. 📝 AI Online Exam Proctoring (PoseNet)
* **Real-time Cheat Detection:** Tracks student movement during exams using local PoseNet frameworks.
* **Smart Alerting:** Warns the student and reports violations if they look away, use a phone, or leave the camera frame.

### 4. 💬 EduERP Guide (AI Counselor & Chatbot)
* **Emotion-Aware Conversations:** Reads the student's emotional state via webcam snapshots and tailors its responses to encourage and comfort them.
* **Voice Synthesis:** Synthesizes voice responses for a natural auditory chat experience.

---

## 📂 Project Structure

```text
Smart-Erp/
├── backend/                       # Node.js & Express API Server
│   ├── config/db.js               # SQLite connector wrapper
│   ├── models/schema.sql          # Core SQL tables (including Faculty_Alerts)
│   ├── init-sqlite.js             # DB initialization and data seeding script
│   └── routes/                    # API endpoints (auth, students, attendance, AI, exams)
├── frontend/                      # React SPA (Vite + Vanilla CSS / Tailwind)
│   ├── src/components/Sidebar.jsx # Translucent navigation panel
│   ├── src/components/AIChatbot.jsx# Emotion-aware AI counselor
│   ├── src/pages/student/         # Student pages (Dashboard, Exams, Wellness Check)
│   └── src/pages/faculty/         # Faculty pages (Dashboard, Attendance Scanner)
├── emotion/                       # Local Python Flask Emotion Recognition API
│   ├── app.py                     # Flask server with /predict endpoint
│   ├── fer.py                     # Keras CNN model architecture compiler
│   └── top_models/fer.h5          # Trained CNN emotion model weights
└── NeuroTrack-AI/                 # Standalone Streamlit Classroom Dashboard
    ├── app.py                     # Main Streamlit dashboard interface
    └── requirements.txt           # Python dependency specification
```

---

## 🛠 Prerequisites

Make sure the following runtimes are installed:
* **Node.js** (v16.0 or higher) & **npm**
* **Python** (v3.8 to v3.11 recommended for TensorFlow compatibility)
* **Git**

---

## 🚀 Getting Started

Follow the configuration steps below to get the entire project running locally.

### 1. Backend Server Setup
The backend serves API endpoints and connects to a local SQLite database file.

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_signing_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Initialize and seed the SQLite database:
   ```bash
   node init-sqlite.js
   ```
   *This seeds the database (`database.sqlite`) with default departments, courses, faculty, and mock students.*
5. Start the API server:
   ```bash
   npm run dev
   ```
   *Runs at `http://localhost:5000`.*

---

### 2. Frontend React Client Setup
The frontend is a React application built with Vite and designed with glassmorphism components.

1. Navigate to the `frontend/` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *Runs at `http://localhost:5173`. Any API calls to `/api` are automatically proxied to `http://localhost:5000`.*

#### 🔑 Default Login Credentials
* **Admin Dashboard:** `admin@erp.com` / `admin123`
* **Faculty Dashboard:** `prof.sharma@erp.com` / `faculty123`
* **Student Dashboard:** `ritu.patel@erp.com` / `student123` (PRN: `PRN000`)

---

### 3. Local Facial Emotion Recognition API Setup
The local Flask API performs offline convolutional analysis on snapshots to determine face expression features (port `5001`).

1. Navigate to the `emotion/` folder:
   ```bash
   cd ../emotion
   ```
2. Create and activate a Python virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the required packages:
   ```bash
   pip install flask flask-cors opencv-python tensorflow keras numpy pillow
   ```
4. Start the Flask prediction server:
   ```bash
   python app.py
   ```
   *Runs at `http://127.0.0.1:5001`.*

---

### 4. NeuroTrack AI (Streamlit) Setup
NeuroTrack AI is a standalone, browser-based class-energy tracker.

1. Navigate to the `NeuroTrack-AI/` folder (or `NeuroTrack-AI-Prathamesh/`):
   ```bash
   cd ../NeuroTrack-AI
   ```
2. Activate your virtual environment and install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the dashboard:
   ```bash
   streamlit run app.py
   ```
   *Opens in your browser at `http://localhost:8501`.*
