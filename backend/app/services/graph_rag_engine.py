"""
Graph-RAG Skill Matching Engine

This module implements an explainable, deterministic skill matching system
using NetworkX graphs for transparent matching between job requirements
and candidate skills.
"""

import networkx as nx
from typing import List, Dict
from sentence_transformers import SentenceTransformer, util as st_util


_model: SentenceTransformer | None = None
_sim_cache: dict[tuple[str, str], float] = {}


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def semantic_similarity(skill_a: str, skill_b: str) -> float:
    if not skill_a or not skill_b:
        return 0.0
    key = (min(skill_a, skill_b).lower(), max(skill_a, skill_b).lower())
    if key in _sim_cache:
        return _sim_cache[key]
    model = _get_model()
    emb = model.encode([skill_a, skill_b], convert_to_tensor=True, show_progress_bar=False)
    score = float(st_util.cos_sim(emb[0], emb[1]))
    result = round(max(0.0, score), 4)
    _sim_cache[key] = result
    return result


SKILL_ALIAS_MAP: dict[str, str] = {
    "js": "javascript",
    "ts": "typescript",
    "node": "node.js",
    "nodejs": "node.js",
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "k8s": "kubernetes",
    "py": "python",
    "ml": "machine learning",
    "dl": "deep learning",
    "ai": "artificial intelligence",
    "rest api": "rest apis",
    "rest": "rest apis",
    "graphql api": "graphql",
    "aws cloud": "aws",
    "gcp": "google cloud",
    "nosql": "mongodb",
    "scss": "css",
    "sass": "css",
    "expressjs": "express",
    "express.js": "express",
    "nextjs": "next.js",
    "nuxtjs": "nuxt",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "tf": "tensorflow",
    "pytorch": "pytorch",
    "unit test": "unit testing",
    "unit tests": "unit testing",
    "pytest": "unit testing",
    "junit": "unit testing",
    "jest": "unit testing",
    "ci cd": "ci/cd",
    "ci/cd pipeline": "ci/cd",
    "vcs": "git",
    "github": "git",
    "gitlab": "git",
}


def normalise_skill(skill: str) -> str:
    key = skill.lower().strip()
    return SKILL_ALIAS_MAP.get(key, skill.strip())


REQUIRED_MARKERS = {"required", "must have", "must", "essential", "mandatory", "expert", "proficient", "strong"}
PREFERRED_MARKERS = {"preferred", "nice to have", "bonus", "optional", "familiar", "desirable", "advantageous"}


def compute_skill_weights(description: str, skills: list[str]) -> dict[str, float]:
    """
    Assign a weight 0.6–1.0 to each job skill based on proximity to
    required/preferred language in the job description.
    Defaults to 0.85 when no signal is found.
    """
    desc_lower = description.lower()
    weights: dict[str, float] = {}
    for skill in skills:
        skill_lower = skill.lower()
        idx = desc_lower.find(skill_lower)
        if idx >= 0:
            window = desc_lower[max(0, idx - 60): idx + 60]
        else:
            window = ""
        if any(m in window for m in REQUIRED_MARKERS):
            weights[skill] = 1.0
        elif any(m in window for m in PREFERRED_MARKERS):
            weights[skill] = 0.6
        else:
            weights[skill] = 0.85
    return weights


SKILL_ONTOLOGY: dict[str, list[str]] = {
    "docker": ["containerisation", "devops"],
    "kubernetes": ["container orchestration", "devops"],
    "react": ["frontend development", "javascript"],
    "vue": ["frontend development", "javascript"],
    "angular": ["frontend development", "typescript"],
    "next.js": ["frontend development", "react", "javascript"],
    "fastapi": ["backend development", "python", "rest apis"],
    "django": ["backend development", "python"],
    "flask": ["backend development", "python"],
    "express": ["backend development", "node.js", "javascript"],
    "spring boot": ["backend development", "java"],
    "node.js": ["backend development", "javascript"],
    "postgresql": ["databases", "sql"],
    "mysql": ["databases", "sql"],
    "mongodb": ["databases", "nosql"],
    "redis": ["databases", "caching"],
    "pytorch": ["machine learning", "deep learning", "python"],
    "tensorflow": ["machine learning", "deep learning", "python"],
    "scikit-learn": ["machine learning", "python"],
    "aws": ["cloud computing", "devops"],
    "azure": ["cloud computing", "devops"],
    "google cloud": ["cloud computing", "devops"],
    "terraform": ["infrastructure as code", "devops"],
    "ci/cd": ["devops", "automation"],
    "git": ["version control"],
    "linux": ["operating systems", "devops"],
    "unit testing": ["testing", "software quality"],
    "rest apis": ["api development", "backend development"],
    "graphql": ["api development", "backend development"],
    "sql": ["databases", "data"],
    "python": ["programming"],
    "java": ["programming"],
    "javascript": ["programming"],
    "typescript": ["programming", "javascript"],
}


def expand_via_ontology(skills: list[str]) -> list[str]:
    """
    Return the original skill list plus one level of parent categories
    from the ontology. Deduplicates. Original skills preserved exactly.
    """
    expanded: set[str] = set(skills)
    for skill in skills:
        parents = SKILL_ONTOLOGY.get(normalise_skill(skill).lower(), [])
        expanded.update(parents)
    return list(expanded)


class SkillGraphRAG:
    """
    Graph-based Retrieval-Augmented Generation engine for skill matching.
    
    This class builds a bipartite graph connecting job skills and candidate skills,
    with weighted edges representing similarity scores. It provides explainable
    and deterministic matching results.
    
    Node Types:
        - JobSkill: Skills required by a job posting
        - CandidateSkill: Skills possessed by a candidate
    
    Edge Attributes:
        - weight: Similarity score between connected skills (0.0 to 1.0)
    """
    
    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize the skill graph.
        
        Args:
            similarity_threshold: Minimum similarity score to create an edge (default: 0.6)
        """
        self.graph = nx.Graph()
        self.similarity_threshold = similarity_threshold
        self.job_skills_list = []
        self.candidate_skills_list = []
    
    def add_job_skills(self, job_id: str, skills: List[str]) -> None:
        """
        Add job skill nodes to the graph.
        
        Args:
            job_id: Unique identifier for the job
            skills: List of required skills for the job
        """
        for skill in skills:
            if not skill or not skill.strip():
                continue

            skill_normalized = normalise_skill(skill)
            node_id = f"job_{job_id}_{skill_normalized}"
            
            # Avoid duplicate nodes
            if not self.graph.has_node(node_id):
                self.graph.add_node(
                    node_id,
                    type="job",
                    skill_name=skill_normalized,
                    job_id=job_id
                )
                self.job_skills_list.append({
                    "node_id": node_id,
                    "skill_name": skill_normalized
                })
    
    def add_candidate_skills(self, candidate_id: str, skills: List[str]) -> None:
        """
        Add candidate skill nodes to the graph.
        
        Args:
            candidate_id: Unique identifier for the candidate
            skills: List of skills possessed by the candidate
        """
        for skill in skills:
            if not skill or not skill.strip():
                continue

            skill_normalized = normalise_skill(skill)
            node_id = f"candidate_{candidate_id}_{skill_normalized}"
            
            # Avoid duplicate nodes
            if not self.graph.has_node(node_id):
                self.graph.add_node(
                    node_id,
                    type="candidate",
                    skill_name=skill_normalized,
                    candidate_id=candidate_id
                )
                self.candidate_skills_list.append({
                    "node_id": node_id,
                    "skill_name": skill_normalized
                })
    
    def connect_skills(self) -> None:
        """
        Connect job skills with candidate skills based on semantic similarity.
        
        Creates edges between job and candidate skill nodes when similarity
        exceeds the threshold. Edge weight represents the similarity score.
        """
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                similarity = semantic_similarity(
                    job_skill["skill_name"],
                    candidate_skill["skill_name"]
                )
                
                if similarity >= self.similarity_threshold:
                    self.graph.add_edge(
                        job_skill["node_id"],
                        candidate_skill["node_id"],
                        weight=similarity
                    )
    
    def compute_match_score(self, skill_weights: dict[str, float] | None = None) -> float:
        """
        Compute overall match score between job and candidate.

        Returns:
            Match score normalized to 0-100 scale
            - Based on average edge weight of matched skills
            - Returns 0.0 if no skills match
        """
        if not self.job_skills_list:
            return 0.0

        # Get all edges and their weights
        edges_with_weights = []
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    edge_data = self.graph.get_edge_data(
                        job_skill["node_id"],
                        candidate_skill["node_id"]
                    )
                    weight = edge_data.get("weight", 0.0) * (skill_weights or {}).get(job_skill["skill_name"], 1.0)
                    edges_with_weights.append(weight)
        
        if not edges_with_weights:
            return 0.0
        
        # Compute average similarity score
        avg_similarity = sum(edges_with_weights) / len(edges_with_weights)
        
        # Factor in coverage (how many job skills are matched)
        matched_job_skills = set()
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    matched_job_skills.add(job_skill["node_id"])
                    break
        
        coverage = len(matched_job_skills) / len(self.job_skills_list) if self.job_skills_list else 0.0

        # Precision: fraction of candidate skills that are actually relevant.
        # Penalises keyword-stuffed resumes that pad real matches with noise.
        matched_candidate_node_ids: set[str] = set()
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    matched_candidate_node_ids.add(candidate_skill["node_id"])

        precision = (
            len(matched_candidate_node_ids) / len(self.candidate_skills_list)
            if self.candidate_skills_list else 0.0
        )

        # 60% coverage + 25% average similarity + 15% precision
        final_score = (coverage * 0.6 + avg_similarity * 0.25 + precision * 0.15) * 100

        return round(final_score, 2)
    
    def get_missing_skills(self) -> List[str]:
        """
        Get list of job skills with no matching candidate skills.
        
        Returns:
            List of skill names that have no edges (no matches)
        """
        missing = []
        
        for job_skill in self.job_skills_list:
            has_match = False
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    has_match = True
                    break
            
            if not has_match:
                missing.append(job_skill["skill_name"])
        
        return missing
    
    def get_explainability(self) -> List[Dict]:
        """
        Get explainable matching information for all connected skill pairs.
        
        Returns:
            List of dictionaries containing:
                - job_skill: Name of the job skill
                - candidate_skill: Name of the candidate skill
                - similarity: Similarity score (0.0 to 1.0)
        """
        explainability_data = []
        
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    edge_data = self.graph.get_edge_data(
                        job_skill["node_id"],
                        candidate_skill["node_id"]
                    )
                    weight = edge_data.get("weight", 0.0)
                    
                    explainability_data.append({
                        "job_skill": job_skill["skill_name"],
                        "candidate_skill": candidate_skill["skill_name"],
                        "similarity": round(weight, 2)
                    })
        
        # Sort by similarity (highest first)
        explainability_data.sort(key=lambda x: x["similarity"], reverse=True)
        
        return explainability_data
    
    def get_matched_skills(self) -> List[str]:
        """
        Get list of job skills that have matches.
        
        Returns:
            List of job skill names that have at least one edge
        """
        matched = []
        
        for job_skill in self.job_skills_list:
            for candidate_skill in self.candidate_skills_list:
                if self.graph.has_edge(job_skill["node_id"], candidate_skill["node_id"]):
                    matched.append(job_skill["skill_name"])
                    break
        
        return matched
