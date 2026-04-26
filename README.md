# ResumeMatch — AI-Powered Skill Gap & Job Fit Platform

**Stack:** FastAPI · Next.js 16 · MongoDB · OpenAI · Graph-RAG · Backblaze B2

ResumeMatch is a full-stack recruitment platform that goes beyond keyword matching. It extracts skills from resumes, builds a Graph-RAG knowledge graph, computes weighted match scores against job requirements, and generates counterfactual "what-if" analysis so candidates know exactly how to improve their fit.

---

## Features

### For Candidates
- Upload resumes (PDF / DOCX) — parsed and stored in Backblaze B2
- Apply to jobs with an optional cover letter
- AI-powered skill extraction (LLM with keyword fallback)
- Live insight dashboard showing: match score, matched/missing skills, and ranked skill improvement suggestions
- Profile management: update name, email, and password

### For Admins
- Create, edit, archive, and delete job postings
- View all applicants for each job, ranked by match score
- Update application statuses: `pending → interview → rejected`
- Platform statistics: total users, resumes, applications, active jobs
- User management: list users, change roles, delete accounts

### AI Pipeline
- **Skill Extraction** — GPT-4 via OpenAI API with keyword fallback
- **Graph-RAG Matching** — NetworkX graph connecting candidate skills to job requirements with weighted semantic similarity
- **Counterfactual Analysis** — Simulates adding missing skills to rank which improvements would most raise the match score
- **n8n Integration** — Optional webhook trigger for external workflow automation; results posted back via callback

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React 19), TypeScript, Tailwind CSS 4 |
| UI Primitives | Radix UI (Dialog, Dropdown, Progress), Lucide React |
| Backend | FastAPI (Python 3.11+) |
| Database | MongoDB (Atlas or self-hosted) |
| File Storage | Backblaze B2 (S3-compatible) |
| AI / ML | OpenAI API, NetworkX, keyword extraction fallback |
| Auth | JWT (stored in localStorage + cookie) |
| Automation | n8n (optional webhook integration) |
| Deployment | Vercel (frontend) · Render / Railway (backend) |

---

## Architecture

```
Frontend (Next.js)
├── Public pages:   / (job feed), /auth/login, /auth/register
├── Candidate:      /profile, /jobs/[id], /insights/[appId]
└── Admin:          /admin, /admin/jobs/new, /admin/jobs/[id],
                    /admin/jobs/[id]/applicants, /admin/users

Backend (FastAPI)
├── /auth       — register, login, profile info, admin stats
├── /jobs       — CRUD for job postings
├── /resumes    — upload, list, download, delete
├── /applications — apply, list applicants, update status
├── /ai         — skill extraction, graph match, counterfactual, n8n callback
├── /internal   — protected internal endpoints (n8n access)
└── /users      — profile update, admin user management

AI Engine
├── Resume text extraction (PDF / DOCX)
├── Skill extraction via LLM (OpenAI) with keyword fallback
├── Graph-RAG skill graph (NetworkX) — semantic similarity scoring
├── Counterfactual simulation — ranked skill improvement actions
└── Full analysis pipeline orchestrated on application submission
```

---

## Folder Structure

### Backend
```
backend/
├── app/
│   ├── main.py               # App entry, routers, CORS middleware
│   ├── config.py             # Environment configuration
│   ├── database.py           # MongoDB connection
│   ├── models/
│   │   ├── user_model.py
│   │   ├── job_model.py
│   │   ├── resume_model.py
│   │   ├── application_model.py
│   │   └── match_result.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── job_routes.py
│   │   ├── resume_routes.py
│   │   ├── application_routes.py
│   │   ├── ai_routes.py
│   │   ├── internal_routes.py
│   │   └── user_routes.py
│   ├── services/
│   │   ├── analysis_pipeline.py  # Orchestrates full AI pipeline
│   │   ├── graph_rag_engine.py   # NetworkX graph matching
│   │   ├── counterfactual_engine.py
│   │   ├── skill_extractor.py
│   │   ├── resume_parser.py
│   │   ├── storage_service.py    # Backblaze B2
│   │   ├── n8n_trigger.py
│   │   └── auth_dependencies.py
│   └── schemas/
├── seed_admin.py
├── seed_jobs.py
└── requirements.txt
```

### Frontend
```
frontend/
├── app/
│   ├── page.tsx                          # Job feed homepage
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   ├── profile/page.tsx
│   ├── jobs/[id]/page.tsx
│   ├── insights/[appId]/page.tsx
│   ├── admin/page.tsx
│   ├── admin/jobs/new/page.tsx
│   ├── admin/jobs/[id]/page.tsx
│   ├── admin/jobs/[id]/applicants/page.tsx
│   └── admin/users/page.tsx
├── components/
│   ├── JobCard.tsx
│   ├── ResumePanel.tsx
│   ├── ApplicationsPanel.tsx
│   ├── AdminGuard.tsx
│   ├── SkillsTagInput.tsx
│   ├── Toast.tsx
│   ├── insights/
│   │   ├── MatchScoreCard.tsx
│   │   ├── ExplainabilityChart.tsx
│   │   └── CounterfactualPanel.tsx
│   ├── layout/
│   │   ├── Navbar.tsx / NavbarWrapper.tsx
│   │   └── Footer.tsx / FooterWrapper.tsx
│   └── ui/
│       ├── SkillTag.tsx
│       ├── EmptyState.tsx
│       ├── Skeleton.tsx
│       ├── ScoreRing.tsx
│       └── Logo.tsx
├── hooks/
│   └── useToast.ts
└── lib/
    ├── api.ts          # Axios instance with JWT interceptor
    ├── auth.ts         # Token management, JWT decode, role checks
    └── apiError.ts     # Centralised error handling
```

---

## Installation & Setup

### 1. Clone
```bash
git clone https://github.com/jaithsandiv/ResumeMatch.git
cd ResumeMatch
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in all values (see Environment Variables below).

```bash
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

Optionally seed an admin account and sample jobs:
```bash
python seed_admin.py
python seed_jobs.py
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Environment Variables

### Backend `.env`
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/resumematch
JWT_SECRET=your_jwt_secret

OPENAI_API_KEY=your_openai_key

B2_ENDPOINT=https://s3.<region>.backblazeb2.com
B2_BUCKET_NAME=your_bucket_name
B2_ACCESS_KEY_ID=your_b2_key_id
B2_SECRET_ACCESS_KEY=your_b2_secret
B2_REGION=us-west-004
B2_UPLOAD_PREFIX=resumes/

FRONTEND_ORIGIN=http://localhost:3000

# Optional — n8n automation
N8N_WEBHOOK_URL=https://your-n8n.instance/webhook/...
N8N_SHARED_SECRET=your_n8n_secret
```

---

## API Reference

### Authentication — `/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | User | Current user info |
| GET | `/auth/admin/me` | Admin | Admin user info |
| GET | `/auth/admin/stats` | Admin | Platform statistics |

### Jobs — `/jobs`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/jobs/` | Public | List active job postings |
| POST | `/jobs/` | Admin | Create a job posting |
| PUT | `/jobs/{job_id}` | Admin | Update a job posting |
| DELETE | `/jobs/{job_id}` | Admin | Delete a job posting |

### Resumes — `/resumes`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/resumes/` | User | List own resumes |
| POST | `/resumes/upload` | User | Upload PDF/DOCX resume |
| GET | `/resumes/{resume_id}/text` | User | Resume text preview |
| GET | `/resumes/{resume_id}/download-url` | User | Presigned B2 download URL |
| DELETE | `/resumes/{resume_id}` | User | Delete resume |

### Applications — `/applications`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/applications/apply` | User | Apply to a job |
| GET | `/applications/job/{job_id}` | Admin | Get applicants (sorted by score) |
| PATCH | `/applications/{application_id}/status` | Admin | Update status |

### AI — `/ai`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ai/analysis/{job_id}/{resume_id}` | User | Get cached analysis results |
| POST | `/ai/skill-extraction` | User | Extract skills from resume text |
| POST | `/ai/graph-match` | User | Compute Graph-RAG match score |
| POST | `/ai/counterfactual-analysis` | User | Skill improvement simulation |
| POST | `/ai/match-preview` | User | Quick skill-intersection preview |
| POST | `/ai/n8n/callback` | Internal | Receive n8n workflow results |

### Users — `/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/users/profile` | User | Update own profile |
| GET | `/users/admin/list` | Admin | List all users |
| PATCH | `/users/admin/{user_id}/role` | Admin | Change user role |
| DELETE | `/users/admin/{user_id}` | Admin | Delete user and their data |

### Internal — `/internal`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/internal/resumes/access` | N8N Secret | Access resume text or download URL |

---

## Application Flow

### Candidate — Applying for a Job
1. Browse job feed at `/`
2. Open job detail at `/jobs/[id]`
3. Click **Apply** — select a resume, add optional cover letter
4. Application submitted → backend creates record and triggers background AI pipeline
5. Navigate to `/insights/[appId]` to watch live pipeline progress
6. Results display: match score ring, skill-by-skill explainability, ranked counterfactuals

### Admin — Managing Jobs & Applicants
1. Access `/admin` — platform stats and job table
2. Create job at `/admin/jobs/new` or edit at `/admin/jobs/[id]`
3. View ranked applicants at `/admin/jobs/[id]/applicants`
4. Update application status (pending → interview → rejected)
5. Manage users at `/admin/users`

---

## MongoDB Collections

| Collection | Key Fields |
|---|---|
| `users` | email, full_name, role, password_hash, created_at |
| `jobs` | title, company, description, required_skills, location, salary_range, status |
| `resumes` | candidate_id, parsed_text, extracted_skills, parse_status, b2_object_key |
| `applications` | job_id, candidate_id, resume_id, cover_letter, status, match_score |
| `match_results` | job_id, resume_id, match_score, matched_skills, missing_skills, explainability |
| `counterfactual_results` | job_id, resume_id, baseline_score, counterfactuals |

---

## Roles & Authorization

| Role | Capabilities |
|---|---|
| `visitor` (default) | Upload resumes, apply to jobs, view own data and insights |
| `admin` | All visitor capabilities + manage jobs, view all applicants, manage users |

JWT tokens are decoded client-side via `lib/auth.ts` to determine role and redirect accordingly. Backend enforces role checks on every protected route.

---

## Deployment

### Frontend — Vercel
- Connect the `/frontend` directory to a Vercel project
- Set `NEXT_PUBLIC_API_URL` to your backend URL in project environment settings

### Backend — Render / Railway
- Deploy the `/backend` directory
- Set all environment variables from the `.env` section above
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Database — MongoDB Atlas
- Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Whitelist your backend's IP (or `0.0.0.0/0` for development)
- Use the Atlas connection string as `MONGO_URI`

### File Storage — Backblaze B2
- Create a B2 bucket and application key
- Set all `B2_*` environment variables
- Ensure the bucket has public download disabled (presigned URLs are used)

---

## Security

- Passwords hashed with bcrypt before storage
- JWT signed with `JWT_SECRET`; tokens expire and are validated on every request
- Role-based access control enforced server-side on all sensitive endpoints
- Presigned B2 URLs expire after 10 minutes
- n8n callbacks authenticated via `X-N8N-SECRET` header
- File uploads validated for type (PDF/DOCX) and size before parsing
- CORS restricted to `FRONTEND_ORIGIN`

---

## Health Checks

```
GET /          → {"status": "ok"}
GET /health/mongo → MongoDB connection status
```

---

## Contact

**Developer:** Jaith Sandiv Hemachandra
**Email:** jaithsandivhemachandra@gmail.com
**LinkedIn:** [linkedin.com/in/jaith-sandiv-hemachandra](https://linkedin.com/in/jaith-sandiv-hemachandra)
**GitHub:** [github.com/jaithsandiv](https://github.com/jaithsandiv)
