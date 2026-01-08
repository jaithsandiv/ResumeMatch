import networkx as nx


class SkillGraphRAG:
    """
    Graph-based Retrieval-Augmented Generation engine for skill matching.
    Uses NetworkX to build a skill relationship graph.
    """
    
    def __init__(self):
        """Initialize the skill graph."""
        self.graph = nx.Graph()
    
    def add_job_skills(self, job_id: str, skills: list):
        """
        Add job skills to the graph.
        
        Args:
            job_id: Unique identifier for the job
            skills: List of required skills for the job
        """
        job_node = f"job_{job_id}"
        self.graph.add_node(job_node, node_type="job")
        
        for skill in skills:
            skill_node = f"skill_{skill.lower()}"
            self.graph.add_node(skill_node, node_type="skill", name=skill)
            self.graph.add_edge(job_node, skill_node, relation="requires")
    
    def add_candidate_skills(self, candidate_id: str, skills: list):
        """
        Add candidate skills to the graph.
        
        Args:
            candidate_id: Unique identifier for the candidate
            skills: List of skills possessed by the candidate
        """
        candidate_node = f"candidate_{candidate_id}"
        self.graph.add_node(candidate_node, node_type="candidate")
        
        for skill in skills:
            skill_node = f"skill_{skill.lower()}"
            self.graph.add_node(skill_node, node_type="skill", name=skill)
            self.graph.add_edge(candidate_node, skill_node, relation="has")
    
    def compute_match_score(self, job_skills: list, candidate_skills: list) -> float:
        """
        Compute a match score between job requirements and candidate skills.
        
        Args:
            job_skills: List of required skills for the job
            candidate_skills: List of skills possessed by the candidate
            
        Returns:
            Match score between 0.0 and 1.0
        """
        if not job_skills:
            return 0.0
        
        # Convert to sets for comparison
        job_set = set(skill.lower() for skill in job_skills)
        candidate_set = set(skill.lower() for skill in candidate_skills)
        
        # Calculate overlap
        matched_skills = job_set.intersection(candidate_set)
        
        # Simple similarity: matched skills / required skills
        if len(job_set) == 0:
            return 0.0
        
        match_score = len(matched_skills) / len(job_set)
        
        return round(match_score, 2)
    
    def get_graph_stats(self) -> dict:
        """
        Get statistics about the skill graph.
        
        Returns:
            Dictionary with graph statistics
        """
        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "skill_nodes": len([n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "skill"]),
            "job_nodes": len([n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "job"]),
            "candidate_nodes": len([n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "candidate"])
        }
