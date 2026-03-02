"""
Counterfactual Skill Improvement Reasoning Engine

This module answers the question:
  "If the candidate improves skill X, how much would their match score increase?"

It simulates hypothetical skill additions, recomputes Graph-RAG match scores,
and ranks improvements by their impact delta — entirely deterministically,
without any LLM or external API calls.
"""

import logging
from typing import List, Dict

from app.services.graph_rag_engine import SkillGraphRAG

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Improvement action knowledge base
# Maps normalised skill keywords → actionable, realistic learning advice.
# Rules: NO fake experience, NO resume edits, only real skill-building actions.
# ---------------------------------------------------------------------------
IMPROVEMENT_ACTION_MAP: Dict[str, str] = {
    # Programming languages
    "python": "Improve Python by building backend APIs with FastAPI or Django.",
    "javascript": "Strengthen JavaScript by building interactive UIs with Vanilla JS or React.",
    "typescript": "Learn TypeScript by adding strict type annotations to an existing JavaScript project.",
    "java": "Practice Java by implementing data-structure algorithms and Spring Boot REST services.",
    "c++": "Deepen C++ skills by solving competitive programming problems on Codeforces.",
    "c#": "Learn C# by building a .NET console application or Unity game prototype.",
    "go": "Learn Go by building a concurrent REST microservice using the standard library.",
    "rust": "Learn Rust by completing the official Rust Book exercises and building a CLI tool.",
    "ruby": "Practice Ruby by building a simple web app with Ruby on Rails.",
    "php": "Strengthen PHP skills by creating a CRUD web app with Laravel.",
    "swift": "Learn Swift by building a basic iOS app using SwiftUI tutorials.",
    "kotlin": "Learn Kotlin by converting a Java Android project to idiomatic Kotlin.",
    "scala": "Learn Scala by working through the Functional Programming in Scala course on Coursera.",
    "r": "Improve R skills by completing exploratory data analysis projects on Kaggle datasets.",
    "matlab": "Practice MATLAB by implementing signal processing or numerical methods exercises.",
    "perl": "Practise Perl by writing text-processing scripts for log analysis tasks.",
    "haskell": "Learn Haskell by working through the 'Real World Haskell' textbook exercises.",
    "elixir": "Learn Elixir by building a real-time Phoenix LiveView web application.",
    "lua": "Learn Lua by scripting game logic in a LÖVE2D or Roblox Studio project.",

    # Web & frontend
    "html": "Build HTML proficiency by creating fully structured, semantic web pages from scratch.",
    "css": "Improve CSS by recreating popular UI layouts using Flexbox and Grid without frameworks.",
    "react": "Improve React by building a full CRUD single-page app with hooks and context.",
    "vue": "Learn Vue.js by rebuilding a small project using Vue 3 Composition API.",
    "angular": "Learn Angular by completing the official Tour of Heroes tutorial and adding a feature.",
    "svelte": "Learn Svelte by building a reactive to-do application using SvelteKit.",
    "next.js": "Deepen Next.js knowledge by deploying a server-side-rendered blog on Vercel.",
    "nuxt": "Learn Nuxt by building a SEO-friendly Vue application with server-side rendering.",
    "tailwind": "Practise Tailwind CSS by designing a responsive dashboard without writing custom CSS.",
    "bootstrap": "Strengthen Bootstrap skills by building a fully responsive multi-page website.",
    "jquery": "Practise jQuery by converting a vanilla JS project to use jQuery DOM manipulation.",
    "graphql": "Learn GraphQL by building a schema with queries, mutations, and resolvers using Apollo.",
    "rest": "Strengthen REST API design by building and documenting a RESTful service with OpenAPI.",
    "webpack": "Learn Webpack by hand-configuring a JavaScript bundler for a multi-entry project.",

    # Backend & frameworks
    "fastapi": "Build FastAPI expertise by creating a production-ready REST API with OAuth2 and tests.",
    "django": "Improve Django skills by building a full-stack blog with user authentication.",
    "flask": "Learn Flask by building and deploying a REST API with SQLAlchemy and JWT auth.",
    "express": "Strengthen Express.js skills by building a Node.js REST API with middleware and routing.",
    "spring": "Learn Spring Boot by building a microservice with JPA, REST endpoints, and unit tests.",
    "rails": "Deepen Rails knowledge by adding real-time features to an app using Action Cable.",
    "laravel": "Improve Laravel skills by building a multi-role web app with Eloquent ORM.",
    "node.js": "Strengthen Node.js skills by building a real-time chat server using WebSockets.",
    "node": "Strengthen Node.js skills by building a real-time chat server using WebSockets.",

    # Databases
    "sql": "Practice SQL by designing and querying relational schemas with complex joins and CTEs.",
    "mysql": "Improve MySQL skills by optimising slow queries using EXPLAIN and proper indexing.",
    "postgresql": "Strengthen PostgreSQL knowledge by implementing full-text search and JSONB queries.",
    "mongodb": "Learn MongoDB by designing a document model and writing aggregation pipeline queries.",
    "redis": "Learn Redis by implementing caching and pub/sub patterns in an existing backend service.",
    "sqlite": "Practise SQLite by building an embedded database for a local Python application.",
    "cassandra": "Learn Cassandra by modelling a time-series data table and running CQL queries.",
    "elasticsearch": "Learn Elasticsearch by indexing a dataset and implementing full-text search queries.",
    "oracle": "Improve Oracle SQL skills by practising PL/SQL stored procedures and performance tuning.",

    # DevOps & cloud
    "docker": "Learn Docker by containerising an existing project and publishing it to Docker Hub.",
    "kubernetes": "Learn Kubernetes by deploying a multi-container app on a local Minikube cluster.",
    "aws": "Gain AWS proficiency by completing the AWS Cloud Practitioner certification pathway.",
    "azure": "Learn Azure by completing the AZ-900 fundamentals learning path on Microsoft Learn.",
    "gcp": "Learn GCP by completing the Google Cloud Associate Cloud Engineer study guide.",
    "terraform": "Learn Terraform by provisioning cloud infrastructure as code for a small web app.",
    "ansible": "Learn Ansible by writing playbooks to automate a multi-server deployment.",
    "jenkins": "Learn Jenkins by setting up a CI/CD pipeline for a Python project with automated tests.",
    "github actions": "Practise GitHub Actions by creating a CI workflow that lints, tests, and builds on push.",
    "ci/cd": "Strengthen CI/CD skills by configuring a full pipeline with build, test, and deploy stages.",
    "linux": "Improve Linux skills by administering a VPS including user management and cron jobs.",
    "bash": "Improve Bash scripting by automating routine server tasks and writing reusable shell functions.",
    "git": "Deepen Git skills by practising branching strategies, rebasing, and conflict resolution.",
    "nginx": "Learn Nginx by configuring reverse proxying, SSL termination, and load balancing.",

    # Data science & ML
    "machine learning": "Advance machine learning skills by completing a Kaggle competition end-to-end.",
    "deep learning": "Strengthen deep learning by implementing and training a CNN on an image dataset.",
    "tensorflow": "Learn TensorFlow by building and training a neural network for a classification task.",
    "pytorch": "Learn PyTorch by implementing a custom training loop for a computer vision model.",
    "scikit-learn": "Improve scikit-learn skills by building a full ML pipeline with preprocessing and tuning.",
    "pandas": "Strengthen pandas skills by performing exploratory data analysis on a real-world dataset.",
    "numpy": "Improve NumPy proficiency by implementing matrix operations and linear algebra routines.",
    "data analysis": "Build data analysis skills by completing a guided analysis project using Python and pandas.",
    "data visualisation": "Improve data visualisation by building interactive dashboards using Plotly or Tableau.",
    "statistics": "Strengthen statistics knowledge by working through an applied statistics online course.",
    "nlp": "Learn NLP by building a sentiment analysis model using Hugging Face Transformers.",
    "computer vision": "Learn computer vision by training an object detection model with YOLO or OpenCV.",

    # Testing
    "testing": "Improve testing skills by adding unit and integration tests to an existing project.",
    "unit testing": "Practise unit testing by writing comprehensive test suites with pytest or JUnit.",
    "pytest": "Strengthen pytest skills by adding fixtures, parametrize decorators, and coverage reports.",
    "selenium": "Learn Selenium by automating end-to-end browser tests for a web application.",
    "cypress": "Learn Cypress by writing end-to-end tests for a React or Vue web application.",
    "tdd": "Practise TDD by implementing a new feature using a strict red-green-refactor cycle.",

    # Security
    "cybersecurity": "Build cybersecurity skills by completing CTF challenges on platforms like HackTheBox.",
    "oauth": "Learn OAuth by implementing an OAuth2 authorisation code flow in a web application.",
    "jwt": "Strengthen JWT knowledge by implementing token issuance, refresh, and revocation patterns.",
    "encryption": "Learn encryption by implementing AES and RSA algorithms in a hands-on security project.",
    "penetration testing": "Learn penetration testing by completing TryHackMe beginner pathways.",

    # Architecture & design
    "microservices": "Learn microservices by decomposing a monolith into independently deployable services.",
    "system design": "Improve system design skills by practising design problems from 'Designing Data-Intensive Applications'.",
    "design patterns": "Strengthen design patterns knowledge by refactoring a project to apply GOF patterns.",
    "api design": "Improve API design by building and documenting a versioned REST API with OpenAPI 3.",
    "agile": "Strengthen Agile understanding by running a personal project using a Scrum sprint structure.",
    "scrum": "Practise Scrum by managing a side project using sprint planning and retrospectives.",

    # Soft & productivity tools
    "communication": "Strengthen communication by writing technical documentation or giving internal knowledge-sharing sessions.",
    "project management": "Improve project management by completing the Google Project Management Certificate.",
    "jira": "Learn Jira by managing a personal or open-source project using Scrum or Kanban boards.",
    "confluence": "Practise Confluence by documenting the architecture and decisions of a personal project.",
}

# Fallback template for skills not in the map
_FALLBACK_TEMPLATE = "Build {skill} proficiency by completing an online course and applying it in a hands-on personal project."


def get_improvement_action(skill: str) -> str:
    """
    Return a realistic, actionable improvement suggestion for a given skill.

    Looks up a curated knowledge base first; falls back to a sensible
    generic template for skills not explicitly listed.

    Args:
        skill: The skill name (case-insensitive).

    Returns:
        A single-sentence, actionable improvement suggestion.
    """
    key = skill.lower().strip()
    return IMPROVEMENT_ACTION_MAP.get(key, _FALLBACK_TEMPLATE.format(skill=skill))


class CounterfactualEngine:
    """
    Counterfactual Skill Improvement Reasoning Engine.

    Simulates the effect of adding individual missing skills to a candidate's
    profile and quantifies the resulting improvement in Graph-RAG match score.

    This engine is purely deterministic — it uses the same SkillGraphRAG
    scoring logic as the main matching pipeline, ensuring consistency.

    Usage::

        engine = CounterfactualEngine(
            job_skills=["Python", "Docker", "SQL"],
            candidate_skills=["Python"],
            missing_skills=["Docker", "SQL"],
            baseline_match_score=35.0,
        )
        results = engine.run_counterfactuals(top_k=5)
    """

    def __init__(
        self,
        job_skills: List[str],
        candidate_skills: List[str],
        missing_skills: List[str],
        baseline_match_score: float,
        job_id: str = "cf_job",
        resume_id: str = "cf_resume",
        similarity_threshold: float = 0.6,
    ) -> None:
        """
        Initialise the counterfactual engine.

        Args:
            job_skills: Skills required by the job posting.
            candidate_skills: Skills currently held by the candidate.
            missing_skills: Skills in job_skills not matched by candidate.
            baseline_match_score: The match score computed before any changes.
            job_id: Internal identifier used for Graph-RAG node naming (default safe).
            resume_id: Internal identifier used for Graph-RAG node naming (default safe).
            similarity_threshold: Minimum similarity to form an edge (matches main pipeline).
        """
        self.job_skills = list(job_skills)
        self.candidate_skills = list(candidate_skills)        # never mutated
        self.missing_skills = list(missing_skills)
        self.baseline_match_score = float(baseline_match_score)
        self.job_id = job_id
        self.resume_id = resume_id
        self.similarity_threshold = similarity_threshold

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _compute_score_for_skills(self, augmented_skills: List[str]) -> float:
        """
        Build a fresh SkillGraphRAG instance for the given candidate skill list
        and return the computed match score.

        This is the same scoring pipeline used in /ai/graph-match, ensuring
        counterfactual deltas are logically consistent with real scores.

        Args:
            augmented_skills: Candidate skill list to evaluate.

        Returns:
            Match score (0–100).
        """
        graph_rag = SkillGraphRAG(similarity_threshold=self.similarity_threshold)
        graph_rag.add_job_skills(self.job_id, self.job_skills)
        graph_rag.add_candidate_skills(self.resume_id, augmented_skills)
        graph_rag.connect_skills()
        return graph_rag.compute_match_score()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def simulate_skill_addition(self, skill: str) -> dict:
        """
        Simulate adding a single skill to the candidate profile and
        measure the resulting change in match score.

        The original candidate_skills list is never mutated.

        Args:
            skill: The skill to hypothetically add.

        Returns:
            A dict with keys:
                - skill (str): The simulated skill.
                - new_match_score (float): Score after hypothetically adding the skill.
                - score_delta (float): Improvement over baseline (new_score − baseline).
                - improvement_action (str): Actionable advice to acquire the skill.
        """
        # Build augmented skill list without mutating the original
        augmented = list(self.candidate_skills) + [skill]

        new_score = self._compute_score_for_skills(augmented)
        delta = round(new_score - self.baseline_match_score, 2)

        return {
            "skill": skill,
            "new_match_score": round(new_score, 2),
            "score_delta": delta,
            "improvement_action": get_improvement_action(skill),
        }

    def run_counterfactuals(self, top_k: int = 5) -> List[dict]:
        """
        Run counterfactual simulations for all missing skills and return
        the top-k ranked by score improvement.

        Args:
            top_k: Maximum number of counterfactuals to return (default: 5).

        Returns:
            List of counterfactual dicts (see simulate_skill_addition),
            sorted descending by score_delta, capped at top_k.
        """
        if not self.missing_skills:
            logger.info(
                "CounterfactualEngine: no missing skills to simulate "
                "(job_id=%s, resume_id=%s)", self.job_id, self.resume_id
            )
            return []

        results: List[dict] = []

        for skill in self.missing_skills:
            try:
                result = self.simulate_skill_addition(skill)
                results.append(result)
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "CounterfactualEngine: simulation failed for skill '%s': %s",
                    skill, exc
                )

        # Sort by highest delta first (deterministic: secondary sort by skill name)
        results.sort(key=lambda r: (-r["score_delta"], r["skill"].lower()))

        # Return only top_k results
        return results[:top_k]
