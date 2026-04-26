"""
Seed script to populate the jobs collection with sample job listings.
Run from the backend directory: python seed_jobs.py
"""

from dotenv import load_dotenv
from app.database import db
from datetime import datetime

load_dotenv()

JOBS = [
    {
        "title": "Senior Software Engineer",
        "company": "TechNova Solutions",
        "description": (
            "We are looking for a Senior Software Engineer to join our core platform team. "
            "You will design and build scalable backend services, collaborate with product and "
            "design teams, and mentor junior engineers. Strong problem-solving skills and a "
            "passion for clean, maintainable code are essential."
        ),
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "REST APIs"],
        "location": "Remote",
        "salary_range": "$120,000 – $160,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Frontend Developer",
        "company": "Pixel Labs",
        "description": (
            "Pixel Labs is seeking a Frontend Developer to craft beautiful, performant web "
            "experiences. You will work closely with our design team to implement pixel-perfect "
            "UIs using React and Next.js, integrate REST and GraphQL APIs, and champion "
            "accessibility best practices across our product suite."
        ),
        "required_skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "GraphQL"],
        "location": "New York, NY (Hybrid)",
        "salary_range": "$95,000 – $130,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Machine Learning Engineer",
        "company": "DataMind AI",
        "description": (
            "DataMind AI is hiring a Machine Learning Engineer to develop and productionise "
            "ML models that power our recommendation and ranking systems. You will work with "
            "large-scale datasets, build training pipelines, and collaborate with data scientists "
            "to turn research prototypes into reliable production services."
        ),
        "required_skills": ["Python", "PyTorch", "scikit-learn", "MLflow", "Kubernetes", "SQL"],
        "location": "San Francisco, CA",
        "salary_range": "$140,000 – $185,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "DevOps Engineer",
        "company": "CloudBridge Inc.",
        "description": (
            "CloudBridge is looking for a DevOps Engineer to own our CI/CD infrastructure and "
            "cloud operations. You will automate deployments, maintain observability tooling, "
            "and drive reliability improvements across our microservices architecture running "
            "on AWS and GCP."
        ),
        "required_skills": ["Terraform", "Kubernetes", "Docker", "GitHub Actions", "AWS", "GCP", "Prometheus"],
        "location": "Austin, TX (Hybrid)",
        "salary_range": "$110,000 – $145,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Full Stack Developer",
        "company": "StartupHub",
        "description": (
            "StartupHub needs a versatile Full Stack Developer who can own features end-to-end, "
            "from database schema design to polished UI. You'll work in a fast-paced environment, "
            "contribute to architectural decisions, and help shape the technical direction of our "
            "B2B SaaS platform."
        ),
        "required_skills": ["Node.js", "React", "MongoDB", "Express", "TypeScript", "Redis"],
        "location": "Remote",
        "salary_range": "$100,000 – $135,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Data Analyst",
        "company": "Insight Analytics Co.",
        "description": (
            "We are seeking a Data Analyst to transform raw data into actionable insights for "
            "our business stakeholders. You will build dashboards, write complex SQL queries, "
            "and partner with product managers to define and track key metrics that drive "
            "growth decisions."
        ),
        "required_skills": ["SQL", "Python", "Tableau", "Power BI", "Excel", "Statistics"],
        "location": "Chicago, IL",
        "salary_range": "$75,000 – $105,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Cybersecurity Analyst",
        "company": "SecureNet Systems",
        "description": (
            "SecureNet is hiring a Cybersecurity Analyst to monitor, detect, and respond to "
            "security threats across our enterprise environment. You will conduct vulnerability "
            "assessments, lead incident response efforts, and help develop security policies "
            "that protect our clients' critical infrastructure."
        ),
        "required_skills": ["SIEM", "Penetration Testing", "Networking", "Linux", "Python", "NIST Framework"],
        "location": "Washington, D.C.",
        "salary_range": "$90,000 – $125,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "iOS Developer",
        "company": "AppForge Mobile",
        "description": (
            "AppForge Mobile is looking for an iOS Developer to build and maintain our "
            "consumer-facing iOS applications used by over 2 million users. You will collaborate "
            "with backend engineers on API contracts, work with designers on smooth animations "
            "and transitions, and ensure high-quality app store releases."
        ),
        "required_skills": ["Swift", "SwiftUI", "UIKit", "Xcode", "Core Data", "REST APIs"],
        "location": "Seattle, WA",
        "salary_range": "$115,000 – $155,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Product Manager",
        "company": "Momentum Products",
        "description": (
            "Momentum Products is searching for a Product Manager to lead the development of "
            "our flagship enterprise product. You will define the product roadmap, gather and "
            "prioritise requirements from customers and internal stakeholders, and work hand-in-hand "
            "with engineering, design, and marketing to deliver outcomes that move the needle."
        ),
        "required_skills": ["Product Strategy", "Agile", "JIRA", "User Research", "SQL", "Roadmapping"],
        "location": "Remote",
        "salary_range": "$115,000 – $150,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Backend Engineer – Golang",
        "company": "StreamFlow Technologies",
        "description": (
            "StreamFlow is hiring a Backend Engineer with strong Golang expertise to build "
            "high-throughput data pipeline services. You'll work on real-time event processing, "
            "design resilient distributed systems, and optimise performance for our streaming "
            "platform handling millions of events per second."
        ),
        "required_skills": ["Go", "Kafka", "gRPC", "PostgreSQL", "Docker", "Kubernetes"],
        "location": "Boston, MA (Hybrid)",
        "salary_range": "$125,000 – $165,000",
        "status": "active",
        "created_at": datetime.utcnow(),
    },
]


def seed_jobs():
    inserted = 0
    skipped = 0

    for job in JOBS:
        exists = db.jobs.find_one({"title": job["title"], "company": job["company"]})
        if exists:
            print(f"  skip  {job['title']} @ {job['company']} (already exists)")
            skipped += 1
            continue

        db.jobs.insert_one(job)
        print(f"  added {job['title']} @ {job['company']}")
        inserted += 1

    print(f"\nDone — {inserted} inserted, {skipped} skipped.")


if __name__ == "__main__":
    seed_jobs()
