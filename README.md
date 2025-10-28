# 🧠 ResumeMatch — Skill Gap & Job Fit Assistant  
### 🚀 Powered by FastAPI, Next.js, MongoDB & Graph-RAG AI

ResumeMatch AI is an intelligent, explainable recruitment and skill-improvement platform.  
It goes beyond simple resume–JD keyword matching — analyzing candidate skills, building a **Graph-RAG knowledge graph**, and providing **actionable AI feedback** on how applicants can **improve their real skills** to better fit target roles.

---

## 🌟 Key Features

### 👩‍💼 For Candidates
- Upload resumes (PDF/DOCX) and apply to open jobs.  
- AI-driven skill extraction and personalized improvement suggestions.  
- Real-time **match score** visualization between their resume and job roles.  
- Understand missing or weak skills, with guidance like:
  > “Improve your Python proficiency by completing projects using FastAPI.”

### 🧑‍💼 For Recruiters / Admins
- Post and manage job descriptions.  
- View applicants with AI-computed match scores.  
- Understand candidate fit through **explainable graphs** and **counterfactual “what-if” analysis**.  
- Export applicant data and performance insights.

### 🤖 AI Modules
- **Skill Extraction:** Uses GPT-4-Turbo to identify relevant technical and soft skills from text.  
- **Graph-RAG Matching:** Builds a knowledge graph connecting applicant skills to job requirements.  
- **Actionable Explainability:** Suggests *how* skill improvement actions can raise match scores.  
- **Counterfactual Analysis:** Estimates how much improving certain skills would affect fit (e.g., +15% if Python projects increase).

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js (React + TailwindCSS) |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | MongoDB (Atlas) |
| **AI / ML** | OpenAI GPT-4-Turbo / GPT-5, NetworkX, Chroma / FAISS |
| **File Handling** | AWS S3 (production) / Local `/uploads` (dev) |
| **Authentication** | JWT (JSON Web Tokens) |
| **Deployment** | Vercel (Frontend) + Render/Railway (Backend) |

---

## 🧩 Core Architecture

```

Frontend (Next.js)
├── Job feed & search
├── Resume upload
├── Profile dashboard
├── Skill gap insights page
└── Admin panel

Backend (FastAPI)
├── Auth & user management
├── Job / Resume / Application APIs
├── AI services (Skill extraction, RAG graph, LLM suggestions)
├── Counterfactual explainability
└── MongoDB integration

AI Engine
├── Extract candidate & job skills
├── Build skill knowledge graph (Graph-RAG)
├── Compute semantic similarity & match score
├── Generate skill improvement recommendations
└── Explain “what-if” improvements

```

---

## 📁 Folder Structure

### Frontend
```

/frontend
├── pages/
│   ├── index.js
│   ├── jobs/[id].js
│   ├── auth/{login,register}.js
│   ├── profile/index.js
│   ├── admin/{index,jobs-new,jobs-[id]}.js
│   └── insights/[appId].js
├── components/
│   ├── JobCard.jsx
│   ├── ResumeUpload.jsx
│   ├── MatchInsights.jsx
│   └── SkillGraphView.jsx
└── lib/
├── api.js
└── auth.js

```

### Backend
```

/backend
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── user_model.py
│   │   ├── job_model.py
│   │   ├── resume_model.py
│   │   ├── application_model.py
│   │   └── match_result_model.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── job_routes.py
│   │   ├── resume_routes.py
│   │   ├── application_routes.py
│   │   └── ai_routes.py
│   ├── services/
│   │   ├── resume_parser.py
│   │   ├── skill_extractor.py
│   │   ├── graph_rag_engine.py
│   │   ├── suggestor.py
│   │   └── counterfactual.py
│   ├── schemas/
│   └── utils/
│       ├── jwt_utils.py
│       ├── file_utils.py
│       └── embeddings.py
└── requirements.txt

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/jaithsandiv/ResumeMatch.git
cd ResumeMatch
````

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
```

### 3️⃣ Environment Variables (`.env`)

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resumematch
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
UPLOAD_DIR=./uploads
S3_BUCKET_NAME=your_bucket_name
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

### 4️⃣ Run FastAPI Server

```bash
uvicorn app.main:app --reload
```

Docs available at 👉 [http://localhost:8000/docs](http://localhost:8000/docs)

### 5️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at 👉 [http://localhost:3000](http://localhost:3000)

---

## 🔑 API Overview

| Endpoint                   | Method             | Description                          |
| -------------------------- | ------------------ | ------------------------------------ |
| `/auth/register`           | POST               | Register a new user                  |
| `/auth/login`              | POST               | Login and get JWT                    |
| `/jobs`                    | GET / POST         | List or create jobs                  |
| `/jobs/{id}`               | GET / PUT / DELETE | Job details & updates                |
| `/resumes/upload`          | POST               | Upload a resume (PDF/DOCX)           |
| `/applications`            | POST               | Apply for a job                      |
| `/ai/skill-analysis`       | POST               | Extract skills from text             |
| `/ai/match-preview`        | POST               | Compute match score & missing skills |
| `/ai/suggest-improvements` | POST               | Generate skill improvement actions   |
| `/ai/counterfactual`       | POST               | “What-if” analysis for skill growth  |

---

## 🧠 Example AI Flow

1. Candidate uploads resume → AI extracts skills.
2. Recruiter posts job → job skills extracted.
3. When applying:

   * Graph-RAG connects resume skills ↔ job requirements.
   * Match score computed.
   * Missing skills identified.
   * LLM suggests **improvement actions** (not resume edits).
4. Candidate sees:

   * **Score:** 76% match
   * **Missing Skills:** `FastAPI`, `Docker`, `SQL`
   * **Suggestions:**

     * “Build a REST API with FastAPI.”
     * “Deploy a project using Docker Compose.”

---

## 🔬 Development Timeline (20 Weeks)

| Week  | Milestone                                |
| ----- | ---------------------------------------- |
| 1–2   | Setup FastAPI, MongoDB, Next.js frontend |
| 3–4   | Auth system + CRUD APIs                  |
| 5–6   | Resume upload & text parsing             |
| 7–9   | Skill extraction (OpenAI)                |
| 10–12 | Graph-RAG skill graph & matching         |
| 13–15 | LLM skill improvement suggestions        |
| 16–17 | Counterfactual explainability            |
| 18–19 | Frontend insights dashboard              |
| 20    | QA, testing, documentation, deployment   |

---

## 🔒 Security & Privacy

* JWT-based authentication for both users & admins.
* Strict role-based authorization for admin endpoints.
* File uploads validated for type and size.
* OpenAI prompts anonymized — no personal info sent.
* HTTPS recommended for production deployment.

---

## 🧩 Future Enhancements

* 🧭 Skill Graph Visualization (Neo4j or D3.js).
* 🧾 Recruiter feedback → adaptive learning for AI.
* 🎯 Personalized learning path integration (Coursera / Udemy APIs).
* 🧮 Custom fine-tuned model for skill matching.

---

## ☁️ Deployment

### Frontend (Vercel)

* Connect `/frontend` to Vercel.
* Add environment variables under project settings.

### Backend (Render / Railway)

* Deploy `/backend` folder.
* Set environment variables.
* Expose service at `https://api.resumematch.com`.

### Database

* Use MongoDB Atlas (free tier).
* Whitelist backend IP or set to `0.0.0.0/0` (dev only).

---

## 🧑‍💻 Contributing

Contributions are welcome!
If you’d like to fix a bug, add features, or improve documentation:

1. Fork the repo
2. Create a feature branch
3. Submit a PR with detailed changes

```bash
git checkout -b feature/your-feature
git commit -m "Added new AI skill suggestor"
git push origin feature/your-feature
```

---

## 🧾 License

This project is licensed under the **MIT License**.

---

## 💬 Contact

**Developer:** [Your Name]
**Email:** [jaithsandivhemachandra@gmail.com](mailto:jaithsandivhemachandra@gmail.com)
**LinkedIn:** [linkedin.com/in/jaith-sandiv-hemachandra](https://linkedin.com/in/jaith-sandiv-hemachandra)
**GitHub:** [github.com/jaithsandiv](https://github.com/jaithsandiv)

---

### ⚡ “Bridging AI and human potential — one skill at a time.”
