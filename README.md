# Modular LLM Framework for Responsible Retrieval-Augmented Job Matching

**A reusable framework that combines semantic retrieval (FAISS), an optional domain Knowledge Graph (Neo4j), and controlled LLM reasoning to produce grounded job-matching outputs and actionable, realistic counterfactual resume suggestions.**

This repo is a starter framework for a final-year project that shows how to build a practical, auditable LLM + RAG pipeline for hiring support.

---

## Table of contents

1. [Project overview (plain English)](#project-overview-plain-english)
2. [Features](#features)
3. [Architecture (high level)](#architecture-high-level)
4. [Quickstart (dev)](#quickstart-dev)
5. [Environment & configuration](#environment--configuration)
6. [Run with Docker (recommended for demo)](#run-with-docker-recommended-for-demo)
7. [API & example requests](#api--example-requests)
8. [Prompts & LLM orchestration](#prompts--llm-orchestration)
9. [Evaluation & experiments](#evaluation--experiments)
10. [Ethics, safety & PII handling](#ethics-safety--pii-handling)
11. [Project structure](#project-structure)
12. [Contributing](#contributing)
13. [License & contact](#license--contact)
14. [Useful references](#useful-references)

---

## Project overview (plain English)

Give the system a job description and resumes (PDF/DOCX). The system:

* extracts and normalizes resume text (OCR fallback for scanned docs),
* builds/queries a semantic index (Sentence-Transformers + FAISS),
* Consults a small Knowledge Graph (Neo4j) to bridge related skills/roles,
* uses an LLM (via controlled prompts) to produce a grounded match summary and concise, realistic counterfactual suggestions, showing the **expected improvement** in match score,
* presents ranked results + evidence + suggested edits in a UI and via an API.

The system is explicitly **a hiring aid** — humans make decisions. Counterfactual suggestions are **suggestions only** and limited to verifiable, realistic actions.

---

## Features

* Resume ingestion: PDF/DOCX parsing + Tesseract OCR fallback (for scans)
* Semantic retrieval: Sentence-Transformers + FAISS index for fast JD→resume retrieval
* Knowledge Graph (Neo4j): Roles, Skills, Tools + relations (synonyms, transferable skills) to produce KG bridging evidence
* LLM orchestration: prompt templates that combine retrieved snippets + KG facts to produce match summaries, rationales, and counterfactual suggestions
* Counterfactual generator: discrete edit search (plausible edits) + LLM polishing (clearly labeled) with Δscore estimation
* Simple FastAPI backend + Streamlit demo UI (Dockerized)
* Evaluation scripts for IR metrics and a small human-study template
* Ethics & fairness checks and PII redaction utilities

---

## Architecture (high level)

```
[Uploader / UI] -> [Parser (pdf/docx, OCR)] -> [Indexer (embeddings -> FAISS)] 
      \                                           |
       -> [KG connector (Neo4j)]                   v
            \--------------------------------> [RAG Orchestrator (LLM)]
                                               -> [Ranker (embeddings + KG + classifier)]
                                               -> [Counterfactual generator]
                                               -> [API / UI]
```

* Retriever returns top-k evidence snippets.
* KG connector returns short paths linking resume skills to JD requirements.
* Orchestrator feeds both into LLM prompt templates for grounded reasoning.

---

## Quickstart (dev)

### Prereqs

* Python 3.10+
* git, Docker (optional but recommended)
* (Optional) Neo4j desktop / Docker if enabling KG

---

## Prompts & LLM orchestration (guidelines + example)

**Guidelines**

* Always include evidence snippets and KG facts in the prompt.
* Use concise system messages to constrain the model (no hallucinations, stick to evidence).
* Post-validate LLM outputs (check suggested edits for plausibility).

**Example match-summary prompt**

```
System: You are a concise assistant. Only use the provided evidence and KG facts. Do not make claims not in evidence.

User:
Job description: {JD}
Evidence snippets: {snippets}
KG facts: {kg_facts}

Produce:
1) a 1-sentence match summary
2) 3 supporting evidence bullets (point to snippets)
3) a confidence score in [0-1]
4) up to 3 concise candidate suggestions (<=20 words each) that are realistic and verifiable.
```

**Post-validation**

* Ensure suggestions contain only allowed action types (add project, take course, list certification) and do not assert unverifiable years/achievements.
* Label suggested text clearly: `Suggested — verify before use`.

---

## Counterfactual generation (brief)

* **Discrete edits** are generated first (e.g., add-skill, add-project, bump-experience-by-1-year bounded).
* Each edit is applied to a copy of candidate features and re-scored by the ranker to compute `Δscore`.
* Top edits are optionally polished into human-friendly bullets by the LLM and presented with Δscore and a verification note.

---

## Evaluation & experiments

* **IR metrics**: Precision\@10, Recall\@10, NDCG\@k, MAP. (Scripts in `eval/compute_metrics.py`.)
* **Ablation study**: Evaluate three configurations:

  1. FAISS baseline (semantic retrieval only)
  2. FAISS + LLM RAG
  3. FAISS + LLM RAG + KG bridging
* **Human study**: small survey (8–12 recruiters/peers) to rate:

  * usefulness of explanations (1–5),
  * realism and usefulness of counterfactuals (1–5).
* **Fairness checks**: run group-wise FNR/FPR if group labels exist; document limitations.

---

## Ethics, safety & PII handling

**This system is a decision-aid only.** Do not use outputs to make automated rejections.

Key safeguards:

* **PII redaction**: scripts to pseudonymize names/emails before sharing artifacts (`scripts/pseudonymize.py`).
* **Counterfactual constraints**: suggestions limited to verifiable actions (courses, short projects, certificates). No fabricated claims.
* **Transparency**: present evidence snippets + KG paths used to make decisions; log model outputs and inputs for audit.
* **Fairness audit**: compute disparity metrics and include findings in the final report.
* **Human-in-the-loop**: include an override and manual review step in any workflow.

Document all limitations in `ETHICS.md`.

---

## Project structure

```
/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ api/
│  │  ├─ parsers/
│  │  ├─ retriever/
│  │  ├─ kg_connector/
│  │  ├─ llm_orchestrator/
│  │  └─ ranker.py
├─ frontend/
│  └─ streamlit_app.py
├─ data/
│  ├─ sample_resumes/
│  └─ kg_seed.csv
├─ scripts/
│  ├─ build_faiss_index.py
│  └─ pseudonymize.py
├─ eval/
│  ├─ compute_metrics.py
│  └─ human_survey_template.md
├─ docker-compose.yml
├─ requirements.txt
├─ README.md
└─ ETHICS.md
```

---

## Useful references

* Sentence-Transformers: [https://www.sbert.net/](https://www.sbert.net/)
* FAISS: [https://github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)
* Neo4j: [https://neo4j.com/](https://neo4j.com/)
* Hugging Face Transformers: [https://huggingface.co/transformers/](https://huggingface.co/transformers/)
* SHAP (explainability): [https://github.com/slundberg/shap](https://github.com/slundberg/shap)
