"""
Self-contained accuracy harness for the Graph-RAG skill matching engine.

Compares the new embedding-based Graph-RAG score against a naive keyword
(set-intersection) baseline across 10 candidate profiles for a single
Senior Software Engineer job.

Run with:
    cd backend && python test_accuracy.py

No live server, no database — imports the service layer directly.
"""

from app.services.graph_rag_engine import SkillGraphRAG, compute_skill_weights


JOB_ID = "job_senior_swe"
JOB_TITLE = "Senior Software Engineer"
JOB_SKILLS = [
    "Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
    "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
]
JOB_DESCRIPTION = (
    "We are hiring a Senior Software Engineer. "
    "Strong Python is required. FastAPI is required for our backend services. "
    "PostgreSQL is required for our primary data store. "
    "Docker is required for containerised deployment. "
    "Kubernetes is required for orchestration. "
    "REST APIs are required for service integration. "
    "Git is required for version control. "
    "Linux is required for production environments. "
    "Unit Testing is required for code quality. "
    "SQLAlchemy is required for ORM work."
)


RESUMES = [
    {
        "name": "Alice",
        "profile": "Perfect match",
        "skills": [
            "Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
            "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
        ],
    },
    {
        "name": "Bob",
        "profile": "DevOps-heavy",
        "skills": [
            "Docker", "Kubernetes", "Terraform", "AWS", "Linux",
            "CI/CD", "Git", "Bash", "Ansible", "Prometheus",
        ],
    },
    {
        "name": "Carol",
        "profile": "Java backend",
        "skills": [
            "Java", "Spring Boot", "Maven", "Hibernate", "MySQL",
            "REST APIs", "Git", "Linux", "JUnit", "Tomcat",
        ],
    },
    {
        "name": "Dave",
        "profile": "Node.js dev",
        "skills": [
            "JavaScript", "Node.js", "Express", "MongoDB", "REST APIs",
            "Git", "Docker", "Jest", "TypeScript", "Linux",
        ],
    },
    {
        "name": "Eve",
        "profile": "Junior Python",
        "skills": [
            "Python", "Flask", "SQLite", "Git", "HTML",
        ],
    },
    {
        "name": "Frank",
        "profile": "Keyword stuffer (10/20 match)",
        "skills": [
            "Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
            "REST APIs", "Github", "Linux", "Unit Testing", "SQLAlchemy",
            "Cooking", "Skydiving", "Photography", "Karate", "Painting",
            "Dancing", "Singing", "Knitting", "Surfing", "Chess",
        ],
    },
    {
        "name": "Grace",
        "profile": "ML engineer",
        "skills": [
            "Python", "PyTorch", "TensorFlow", "scikit-learn", "Pandas",
            "NumPy", "Jupyter", "Docker", "Git", "Linux",
        ],
    },
    {
        "name": "Henry",
        "profile": "Near-perfect match",
        "skills": [
            "Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
            "REST APIs", "Git", "Linux", "pytest",
        ],
    },
    {
        "name": "Ivy",
        "profile": "Frontend dev",
        "skills": [
            "React", "TypeScript", "Next.js", "CSS", "HTML",
            "Tailwind", "Git", "Jest", "Webpack", "GraphQL",
        ],
    },
    {
        "name": "Jack",
        "profile": "Partial match",
        "skills": [
            "Python", "Django", "PostgreSQL", "Docker", "Git",
            "Linux", "REST APIs",
        ],
    },
]


def keyword_score(job_skills: list[str], candidate_skills: list[str]) -> float:
    if not job_skills:
        return 0.0
    job_set = {s.lower().strip() for s in job_skills}
    cand_set = {s.lower().strip() for s in candidate_skills}
    matched = job_set.intersection(cand_set)
    return round(len(matched) / len(job_set) * 100, 2)


def graph_rag_score(job_skills: list[str], candidate_skills: list[str], description: str) -> float:
    weights = compute_skill_weights(description, job_skills)
    engine = SkillGraphRAG(similarity_threshold=0.6)
    engine.add_job_skills(JOB_ID, job_skills)
    engine.add_candidate_skills("cand", candidate_skills)
    engine.connect_skills()
    return engine.compute_match_score(skill_weights=weights)


def verdict(delta: float) -> str:
    if delta > 5:
        return "Graph-RAG better"
    if delta < -5:
        return "Keyword better"
    return "~equivalent"


def main() -> None:
    print(f"Job: {JOB_TITLE}")
    print(f"Required skills: {', '.join(JOB_SKILLS)}")
    print()
    print("NOTE: First run downloads the all-MiniLM-L6-v2 model (~80MB) and caches it locally.")
    print()

    rows = []
    for r in RESUMES:
        g = graph_rag_score(JOB_SKILLS, r["skills"], JOB_DESCRIPTION)
        k = keyword_score(JOB_SKILLS, r["skills"])
        delta = round(g - k, 2)
        rows.append({
            "name": r["name"],
            "profile": r["profile"],
            "graph": g,
            "keyword": k,
            "delta": delta,
            "verdict": verdict(delta),
        })

    rows.sort(key=lambda x: x["graph"], reverse=True)

    header = f"{'Rank':<5}{'Name':<8}{'Profile':<32}{'Graph-RAG%':>12}{'Keyword%':>11}{'Delta':>9}  {'Verdict'}"
    print(header)
    print("-" * len(header))
    for i, row in enumerate(rows, 1):
        print(
            f"{i:<5}{row['name']:<8}{row['profile']:<32}"
            f"{row['graph']:>12.2f}{row['keyword']:>11.2f}{row['delta']:>+9.2f}  {row['verdict']}"
        )

    n = len(rows)
    avg_g = sum(r["graph"] for r in rows) / n
    avg_k = sum(r["keyword"] for r in rows) / n
    graph_higher = sum(1 for r in rows if r["delta"] > 5)
    keyword_higher = sum(1 for r in rows if r["delta"] < -5)

    print()
    print("Summary")
    print("-------")
    print(f"Average Graph-RAG score: {avg_g:.2f}")
    print(f"Average keyword score:   {avg_k:.2f}")
    print(f"Cases where Graph-RAG ranked meaningfully higher (delta > 5): {graph_higher}/{n}")
    print(f"Cases where keyword ranked higher (delta < -5):                {keyword_higher}/{n}")


if __name__ == "__main__":
    main()
