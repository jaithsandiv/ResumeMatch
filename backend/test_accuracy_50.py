"""
Accuracy comparison: ResumeMatch Graph-RAG vs naive keyword matching, 50 resumes.

Same methodology as test_accuracy_20.py, scaled up:
- 50 candidate resumes, each labelled 0-3 (None / Weak / Moderate / Strong)
- Both systems score every resume against the same Senior Software Engineer job
- Ranking quality measured via Spearman, NDCG@5, NDCG@10, P@5, P@10, R@10,
  misranked-pair count, and top-1 hit
"""

import math
from app.services.graph_rag_engine import SkillGraphRAG, compute_skill_weights

# ---------------------------------------------------------------------------
# Job posting (identical to the 20-resume test for comparability)
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# 50 resumes - distribution: 10 Strong, 12 Moderate, 14 Weak, 14 None
# Adversarial cases spread throughout: synonym users, keyword stuffers,
# near-duplicates with one missing critical skill, mislabelled job titles.
# ---------------------------------------------------------------------------
RESUMES = [
    # -- STRONG fits (10) --------------------------------------------------
    {"name": "Alice", "label": 3, "profile": "Perfect Python/FastAPI match",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy"]},
    {"name": "Henry", "label": 3, "profile": "Near-perfect, uses pytest",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "pytest"]},
    {"name": "Olivia", "label": 3, "profile": "Senior Python, full stack",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs",
                "Git", "Linux", "Unit Testing", "Redis", "Celery"]},
    {"name": "Quinn", "label": 3, "profile": "Strong Python + K8s ops",
     "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Kubernetes",
                "Docker", "Linux", "Git", "Unit Testing", "SQLAlchemy"]},
    {"name": "Nina", "label": 3, "profile": "Strong fit using synonyms",
     "skills": ["Python", "FastAPI", "Postgres", "Docker", "K8s",
                "REST", "Github", "Linux", "pytest", "SQLAlchemy"]},
    {"name": "Diego", "label": 3, "profile": "Senior backend, all stack",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
                "Redis", "RabbitMQ"]},
    {"name": "Priya", "label": 3, "profile": "Python lead, microservices",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "Microservices", "REST APIs", "Git", "Linux", "pytest",
                "GraphQL"]},
    {"name": "Lucas", "label": 3, "profile": "FastAPI specialist",
     "skills": ["Python", "FastAPI", "Pydantic", "PostgreSQL", "Docker",
                "Kubernetes", "REST APIs", "Git", "Linux", "Unit Testing",
                "SQLAlchemy", "Alembic"]},
    {"name": "Rosa", "label": 3, "profile": "Strong fit, abbreviation-heavy",
     "skills": ["Python", "FastAPI", "Postgres", "Docker", "K8s", "REST API",
                "Git", "Linux", "pytest", "SQLAlchemy"]},
    {"name": "Marcus", "label": 3, "profile": "Senior platform engineer",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
                "Terraform", "AWS"]},

    # -- MODERATE fits (12) ------------------------------------------------
    {"name": "Jack", "label": 2, "profile": "Python+Django, no FastAPI/K8s",
     "skills": ["Python", "Django", "PostgreSQL", "Docker", "Git",
                "Linux", "REST APIs"]},
    {"name": "Mia", "label": 2, "profile": "Python+Flask, partial DevOps",
     "skills": ["Python", "Flask", "MySQL", "Docker", "REST APIs",
                "Git", "Linux", "pytest"]},
    {"name": "Bob", "label": 2, "profile": "DevOps-strong, Python-light",
     "skills": ["Docker", "Kubernetes", "Terraform", "AWS", "Linux",
                "CI/CD", "Git", "Bash", "Ansible", "Prometheus", "Python"]},
    {"name": "Ryan", "label": 2, "profile": "Backend Python with gaps",
     "skills": ["Python", "Flask", "Postgres", "Docker", "REST",
                "Git", "Linux"]},
    {"name": "Emma", "label": 2, "profile": "Mid Python, no container ops",
     "skills": ["Python", "Django", "PostgreSQL", "REST APIs", "Git",
                "Linux", "Unit Testing", "SQLAlchemy"]},
    {"name": "Felix", "label": 2, "profile": "Python+SQLAlchemy, no K8s",
     "skills": ["Python", "Flask", "FastAPI", "PostgreSQL", "Docker",
                "REST APIs", "Git", "Linux", "SQLAlchemy"]},
    {"name": "Hannah", "label": 2, "profile": "FastAPI but small toolkit",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Git", "Linux",
                "REST APIs", "pytest"]},
    {"name": "Igor", "label": 2, "profile": "Python+Mongo backend",
     "skills": ["Python", "Flask", "MongoDB", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing"]},
    {"name": "Kara", "label": 2, "profile": "Python data engineer",
     "skills": ["Python", "Airflow", "PostgreSQL", "Docker", "REST APIs",
                "Git", "Linux", "Spark", "SQLAlchemy"]},
    {"name": "Luis", "label": 2, "profile": "Python, no Kubernetes",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs",
                "Git", "Linux", "Unit Testing"]},
    {"name": "Pablo", "label": 2, "profile": "Python+Django+K8s",
     "skills": ["Python", "Django", "DRF", "PostgreSQL", "Docker",
                "Kubernetes", "REST APIs", "Git", "Linux"]},
    {"name": "Yusuf", "label": 2, "profile": "Mid backend, partial match",
     "skills": ["Python", "Flask", "MySQL", "PostgreSQL", "Docker",
                "Git", "Linux", "REST APIs", "pytest"]},

    # -- WEAK fits (14) - transferable but wrong stack --------------------
    {"name": "Carol", "label": 1, "profile": "Java backend, transferable",
     "skills": ["Java", "Spring Boot", "Maven", "Hibernate", "MySQL",
                "REST APIs", "Git", "Linux", "JUnit", "Tomcat"]},
    {"name": "Dave", "label": 1, "profile": "Node.js dev, related stack",
     "skills": ["JavaScript", "Node.js", "Express", "MongoDB", "REST APIs",
                "Git", "Docker", "Jest", "TypeScript", "Linux"]},
    {"name": "Eve", "label": 1, "profile": "Junior Python - too thin",
     "skills": ["Python", "Flask", "SQLite", "Git", "HTML"]},
    {"name": "Sam", "label": 1, "profile": ".NET dev",
     "skills": ["C#", "ASP.NET", "SQL Server", "Azure", "Git",
                "Docker", "REST APIs", "xUnit"]},
    {"name": "Frank", "label": 1, "profile": "Keyword stuffer (10/10 + 10 noise)",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Github", "Linux", "Unit Testing", "SQLAlchemy",
                "Cooking", "Skydiving", "Photography", "Karate", "Painting",
                "Dancing", "Singing", "Knitting", "Surfing", "Chess"]},
    {"name": "Greta", "label": 1, "profile": "Mild keyword stuffer (8 noise)",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
                "Yoga", "Cooking", "Hiking", "Reading", "Travel", "Cycling",
                "Pottery", "Gardening"]},
    {"name": "Tom", "label": 1, "profile": "Go backend, language mismatch",
     "skills": ["Go", "gRPC", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux"]},
    {"name": "Iris", "label": 1, "profile": "Ruby/Rails dev",
     "skills": ["Ruby", "Rails", "PostgreSQL", "Redis", "Docker",
                "REST APIs", "Git", "Linux", "RSpec"]},
    {"name": "Otto", "label": 1, "profile": "PHP backend",
     "skills": ["PHP", "Laravel", "MySQL", "Docker", "REST APIs",
                "Git", "Linux", "PHPUnit"]},
    {"name": "Sofia", "label": 1, "profile": "Junior Python intern level",
     "skills": ["Python", "Flask", "SQLite", "Git"]},
    {"name": "Leo", "label": 1, "profile": "Scala backend",
     "skills": ["Scala", "Akka", "PostgreSQL", "Kafka", "Docker",
                "REST APIs", "Git", "Linux"]},
    {"name": "Hugo", "label": 1, "profile": "Heavy keyword stuffer (15 noise)",
     "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes",
                "REST APIs", "Git", "Linux", "Unit Testing", "SQLAlchemy",
                "Crochet", "Chess", "Astronomy", "Origami", "Calligraphy",
                "Beekeeping", "Sailing", "Fencing", "Archery", "Birding",
                "Botany", "Geology", "Numismatics", "Philately", "Falconry"]},
    {"name": "Zara", "label": 1, "profile": "Bootcamp grad, very junior",
     "skills": ["Python", "Django", "HTML", "CSS", "JavaScript", "Git"]},
    {"name": "Omar", "label": 1, "profile": "C++ systems dev",
     "skills": ["C++", "CMake", "Linux", "Docker", "Git", "Boost",
                "Unit Testing"]},

    # -- NONE (14) - clearly wrong fit ------------------------------------
    {"name": "Grace", "label": 0, "profile": "ML researcher",
     "skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn",
                "Pandas", "NumPy", "Jupyter", "Docker", "Git", "Linux"]},
    {"name": "Ivy", "label": 0, "profile": "Frontend specialist",
     "skills": ["React", "TypeScript", "Next.js", "CSS", "HTML",
                "Tailwind", "Git", "Jest", "Webpack", "GraphQL"]},
    {"name": "Tara", "label": 0, "profile": "iOS / mobile",
     "skills": ["Swift", "SwiftUI", "Xcode", "Core Data", "Combine",
                "Git", "REST APIs", "TestFlight"]},
    {"name": "Uma", "label": 0, "profile": "Data analyst",
     "skills": ["SQL", "Tableau", "Power BI", "Excel", "Python",
                "Statistics", "R"]},
    {"name": "Victor", "label": 0, "profile": "Pure designer",
     "skills": ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator",
                "User Research", "HTML", "CSS"]},
    {"name": "Wendy", "label": 0, "profile": "Product manager",
     "skills": ["Product Strategy", "Agile", "JIRA", "User Research",
                "SQL", "Roadmapping", "Git"]},
    {"name": "Adam", "label": 0, "profile": "Android developer",
     "skills": ["Kotlin", "Android Studio", "Jetpack Compose", "Room",
                "Retrofit", "Git", "Gradle"]},
    {"name": "Bella", "label": 0, "profile": "Marketing analyst",
     "skills": ["Google Analytics", "SEO", "Excel", "SQL", "Tableau",
                "Content Marketing"]},
    {"name": "Cyrus", "label": 0, "profile": "DBA, no app dev",
     "skills": ["Oracle", "PL/SQL", "Database Tuning", "Backup/Recovery",
                "Linux", "Shell Scripting"]},
    {"name": "Daria", "label": 0, "profile": "Embedded firmware",
     "skills": ["C", "Embedded C", "RTOS", "ARM", "I2C", "SPI", "Git"]},
    {"name": "Ethan", "label": 0, "profile": "QA test engineer",
     "skills": ["Selenium", "Cypress", "Jira", "TestRail", "Manual Testing",
                "Postman", "Git"]},
    {"name": "Fiona", "label": 0, "profile": "Game developer",
     "skills": ["Unity", "C#", "Unreal", "Blender", "Lua", "Game Design"]},
    {"name": "Gus", "label": 0, "profile": "Network engineer",
     "skills": ["Cisco", "BGP", "OSPF", "Wireshark", "Linux", "Python"]},
    {"name": "Hilda", "label": 0, "profile": "Technical writer",
     "skills": ["Technical Writing", "Markdown", "Docusaurus", "Git",
                "Information Architecture", "DITA"]},
]

assert len(RESUMES) == 50, f"Expected 50 resumes, got {len(RESUMES)}"


# ---------------------------------------------------------------------------
# Scoring functions
# ---------------------------------------------------------------------------
def keyword_score(job_skills, candidate_skills):
    if not job_skills:
        return 0.0
    job_set = {s.lower().strip() for s in job_skills}
    cand_set = {s.lower().strip() for s in candidate_skills}
    return round(len(job_set & cand_set) / len(job_set) * 100, 2)


def graph_rag_score(job_skills, candidate_skills, description):
    weights = compute_skill_weights(description, job_skills)
    engine = SkillGraphRAG(similarity_threshold=0.6)
    engine.add_job_skills(JOB_ID, job_skills)
    engine.add_candidate_skills("cand", candidate_skills)
    engine.connect_skills()
    return engine.compute_match_score(skill_weights=weights)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
def spearman(scores, labels):
    n = len(scores)
    def rank(values):
        order = sorted(range(n), key=lambda i: values[i])
        ranks = [0.0] * n
        i = 0
        while i < n:
            j = i
            while j + 1 < n and values[order[j + 1]] == values[order[i]]:
                j += 1
            avg_rank = (i + j) / 2 + 1
            for k in range(i, j + 1):
                ranks[order[k]] = avg_rank
            i = j + 1
        return ranks
    rs, rl = rank(scores), rank(labels)
    mrs, mrl = sum(rs) / n, sum(rl) / n
    num = sum((rs[i] - mrs) * (rl[i] - mrl) for i in range(n))
    ds = math.sqrt(sum((rs[i] - mrs) ** 2 for i in range(n)))
    dl = math.sqrt(sum((rl[i] - mrl) ** 2 for i in range(n)))
    return num / (ds * dl) if ds and dl else 0.0


def ndcg_at_k(scores, labels, k):
    n = len(scores)
    order = sorted(range(n), key=lambda i: scores[i], reverse=True)[:k]
    def dcg(seq):
        return sum(((2 ** lab) - 1) / math.log2(i + 2) for i, lab in enumerate(seq))
    actual = dcg([labels[i] for i in order])
    ideal = dcg(sorted(labels, reverse=True)[:k])
    return actual / ideal if ideal > 0 else 0.0


def precision_at_k(scores, labels, k, min_label=2):
    n = len(scores)
    order = sorted(range(n), key=lambda i: scores[i], reverse=True)[:k]
    hits = sum(1 for i in order if labels[i] >= min_label)
    return hits / k


def recall_at_k(scores, labels, k, min_label=2):
    n = len(scores)
    order = sorted(range(n), key=lambda i: scores[i], reverse=True)[:k]
    relevant_total = sum(1 for lab in labels if lab >= min_label)
    if relevant_total == 0:
        return 0.0
    hits = sum(1 for i in order if labels[i] >= min_label)
    return hits / relevant_total


def misranked_pairs(scores, labels):
    n = len(scores)
    bad = 0
    for i in range(n):
        for j in range(i + 1, n):
            if labels[i] != labels[j]:
                hi, lo = (i, j) if labels[i] > labels[j] else (j, i)
                if scores[hi] < scores[lo]:
                    bad += 1
    return bad


def total_meaningful_pairs(labels):
    n = len(labels)
    return sum(1 for i in range(n) for j in range(i + 1, n) if labels[i] != labels[j])


def top1_hit(scores, labels):
    top_idx = max(range(len(scores)), key=lambda i: scores[i])
    return labels[top_idx] == max(labels)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
def main():
    print("=" * 80)
    print("RESUMEMATCH GRAPH-RAG  vs  NAIVE KEYWORD MATCHING - 50-resume test")
    print("=" * 80)
    print(f"Job: {JOB_TITLE}")
    print(f"Required skills ({len(JOB_SKILLS)}): {', '.join(JOB_SKILLS)}")
    counts = {k: sum(1 for r in RESUMES if r['label'] == k) for k in (3, 2, 1, 0)}
    print(f"Resumes: {len(RESUMES)}  (Strong={counts[3]}, "
          f"Moderate={counts[2]}, Weak={counts[1]}, None={counts[0]})")
    print()

    rows = []
    for r in RESUMES:
        g = graph_rag_score(JOB_SKILLS, r["skills"], JOB_DESCRIPTION)
        k = keyword_score(JOB_SKILLS, r["skills"])
        rows.append({"name": r["name"], "profile": r["profile"],
                     "label": r["label"], "graph": g, "keyword": k})

    rows.sort(key=lambda x: x["graph"], reverse=True)

    LBL = {3: "Strong", 2: "Moderate", 1: "Weak", 0: "None"}
    print(f"{'Rk':<4}{'Name':<10}{'Profile':<38}{'Label':<12}{'Graph%':>8}{'Kw%':>8}")
    print("-" * 80)
    for i, row in enumerate(rows, 1):
        lab = f"{row['label']} {LBL[row['label']]}"
        print(f"{i:<4}{row['name']:<10}{row['profile'][:36]:<38}{lab:<12}"
              f"{row['graph']:>8.2f}{row['keyword']:>8.2f}")

    labels  = [r["label"]   for r in rows]
    graph_s = [r["graph"]   for r in rows]
    kw_s    = [r["keyword"] for r in rows]

    total_pairs = total_meaningful_pairs(labels)

    metrics = {
        "Spearman correlation":          (spearman(graph_s, labels),    spearman(kw_s, labels),    True,  "{:.3f}"),
        "NDCG@5":                        (ndcg_at_k(graph_s, labels, 5),    ndcg_at_k(kw_s, labels, 5),    True,  "{:.3f}"),
        "NDCG@10":                       (ndcg_at_k(graph_s, labels, 10),   ndcg_at_k(kw_s, labels, 10),   True,  "{:.3f}"),
        "Precision@5  (label>=Mod)":     (precision_at_k(graph_s, labels, 5),  precision_at_k(kw_s, labels, 5),  True,  "{:.2f}"),
        "Precision@10 (label>=Mod)":     (precision_at_k(graph_s, labels, 10), precision_at_k(kw_s, labels, 10), True,  "{:.2f}"),
        "Recall@10 (of all Mod+)":       (recall_at_k(graph_s, labels, 10), recall_at_k(kw_s, labels, 10), True,  "{:.2f}"),
        f"Misranked pairs (of {total_pairs})": (misranked_pairs(graph_s, labels), misranked_pairs(kw_s, labels), False, "{:d}"),
        "Top-1 is a Strong fit":         (int(top1_hit(graph_s, labels)),   int(top1_hit(kw_s, labels)),   True,  "{:d}"),
    }

    print()
    print("=" * 80)
    print("ACCURACY METRICS")
    print("=" * 80)
    print(f"{'Metric':<42}{'Graph-RAG':>14}{'Keyword':>14}  Winner")
    print("-" * 80)
    for name, (g, k, hib, fmt) in metrics.items():
        gs, ks = fmt.format(g), fmt.format(k)
        if g == k:
            w = "tie"
        elif (g > k) == hib:
            w = "Graph-RAG"
        else:
            w = "Keyword"
        print(f"{name:<42}{gs:>14}{ks:>14}  {w}")

    g_mis, k_mis = metrics[f"Misranked pairs (of {total_pairs})"][:2]
    g_acc = (1 - g_mis / total_pairs) * 100
    k_acc = (1 - k_mis / total_pairs) * 100

    print()
    print("=" * 80)
    print("HEADLINE PAIR-RANKING ACCURACY  (1 - misranked_pairs / total_pairs)")
    print("=" * 80)
    print(f"  Graph-RAG (ResumeMatch):  {g_acc:5.2f}%")
    print(f"  Naive keyword matching:   {k_acc:5.2f}%")
    print(f"  Difference:               {g_acc - k_acc:+5.2f} percentage points")

    # Adversarial cases - keyword stuffers
    print()
    print("=" * 80)
    print("ADVERSARIAL CASE BREAKDOWN")
    print("=" * 80)
    by_g = {r["name"]: i + 1 for i, r in enumerate(rows)}
    rows_by_kw = sorted(rows, key=lambda x: x["keyword"], reverse=True)
    by_k = {r["name"]: i + 1 for i, r in enumerate(rows_by_kw)}

    print("Keyword-stuffers (real fit = Weak):")
    for stuffer in ["Frank", "Greta", "Hugo"]:
        r = next(x for x in rows if x["name"] == stuffer)
        print(f"  {stuffer:<6}  Graph-RAG #{by_g[stuffer]:<2} ({r['graph']:.1f})  "
              f"Keyword #{by_k[stuffer]:<2} ({r['keyword']:.1f})  - "
              f"profile: {r['profile']}")

    print()
    print("Synonym users (real fit = Strong):")
    for syn in ["Nina", "Rosa"]:
        r = next(x for x in rows if x["name"] == syn)
        print(f"  {syn:<6}  Graph-RAG #{by_g[syn]:<2} ({r['graph']:.1f})  "
              f"Keyword #{by_k[syn]:<2} ({r['keyword']:.1f})  - "
              f"profile: {r['profile']}")


if __name__ == "__main__":
    main()
