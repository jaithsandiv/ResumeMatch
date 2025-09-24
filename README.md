# Modular LLM Framework for Responsible Retrieval-Augmented Job Matching

A modular, extensible pipeline that combines semantic retrieval (FAISS), a small domain Knowledge Graph (Neo4j), and controllable LLM reasoning to produce transparent job-matching results and actionable counterfactual resume suggestions. Designed for reproducible research, demos, and responsible evaluation.

---

## 🚀 What this repository contains
This project implements a reusable pipeline and demo for job matching using Retrieval-Augmented Generation (RAG) + a Knowledge Graph (Graph-RAG) and a counterfactual suggestion module.

Key components:
- Robust resume ingestion and section parsing (PDF/DOCX, OCR fallback)
- Semantic retriever (Sentence-Transformer embeddings + FAISS)
- Small domain Knowledge Graph (Neo4j) for bridging skills & roles
- LLM Orchestrator (prompt templates + safety validators)
- Counterfactual generator (bounded discrete edits + optional LLM polish)
- FastAPI backend + Streamlit demo UI + Docker compose for easy deployment
- Evaluation scripts (Precision@k, NDCG) and a small recruiter survey harness

