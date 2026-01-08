"""
Graph-RAG Skill Matching Engine

This module implements an explainable, deterministic skill matching system
using NetworkX graphs for transparent matching between job requirements
and candidate skills.
"""

import networkx as nx
from typing import List, Dict


def semantic_similarity(skill_a: str, skill_b: str) -> float:
    """
    Compute semantic similarity between two skill strings.
    
    This is a placeholder implementation that will be replaced with 
    embeddings-based similarity in the future.
    
    Args:
        skill_a: First skill string
        skill_b: Second skill string
        
    Returns:
        Similarity score between 0.0 and 1.0
        - 1.0: Exact match (case-insensitive)
        - 0.7: Partial match (one skill contains the other)
        - 0.0: No match
    """
    if not skill_a or not skill_b:
        return 0.0
    
    # Normalize to lowercase for comparison
    skill_a_lower = skill_a.lower().strip()
    skill_b_lower = skill_b.lower().strip()
    
    # Exact match
    if skill_a_lower == skill_b_lower:
        return 1.0
    
    # Partial match (substring detection)
    if skill_a_lower in skill_b_lower or skill_b_lower in skill_a_lower:
        return 0.7
    
    # No match
    return 0.0


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
            
            skill_normalized = skill.strip()
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
            
            skill_normalized = skill.strip()
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
    
    def compute_match_score(self) -> float:
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
                    weight = edge_data.get("weight", 0.0)
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
        
        # Weighted score: 70% coverage + 30% average similarity
        final_score = (coverage * 0.7 + avg_similarity * 0.3) * 100
        
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
