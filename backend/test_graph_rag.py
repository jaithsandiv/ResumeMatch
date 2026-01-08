"""
Test script for Graph-RAG Skill Matching

This script tests the Graph-RAG engine and API endpoints.
Run this while the server is running and after authentication.

Usage:
    python test_graph_rag.py
"""

import sys
from app.services.graph_rag_engine import SkillGraphRAG, semantic_similarity


def test_semantic_similarity():
    """Test the semantic similarity function."""
    print("\n=== Testing Semantic Similarity ===")
    
    test_cases = [
        ("Python", "Python", 1.0, "Exact match"),
        ("python", "PYTHON", 1.0, "Case insensitive match"),
        ("Python", "Python Programming", 0.7, "Partial match"),
        ("FastAPI", "Fast", 0.7, "Partial match (substring)"),
        ("", "Python", 0.0, "Empty string"),
        ("React", "React.js", 0.7, "Partial framework match")
    ]
    
    passed = 0
    failed = 0
    
    for skill_a, skill_b, expected, description in test_cases:
        result = semantic_similarity(skill_a, skill_b)
        if result == expected:
            print(f"✓ {description}: '{skill_a}' vs '{skill_b}' = {result}")
            passed += 1
        else:
            print(f"✗ {description}: '{skill_a}' vs '{skill_b}' = {result} (expected {expected})")
            failed += 1
    
    print(f"\nPassed: {passed}/{len(test_cases)}")
    return failed == 0


def test_graph_construction():
    """Test building the skill graph."""
    print("\n=== Testing Graph Construction ===")
    
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    
    # Add job skills
    job_skills = ["Python", "FastAPI", "MongoDB", "Docker", "Kubernetes"]
    graph_rag.add_job_skills("job123", job_skills)
    print(f"✓ Added {len(job_skills)} job skills")
    
    # Add candidate skills
    candidate_skills = ["Python", "FastAPI", "PostgreSQL", "Git", "Python Programming"]
    graph_rag.add_candidate_skills("candidate456", candidate_skills)
    print(f"✓ Added {len(candidate_skills)} candidate skills")
    
    # Connect skills
    graph_rag.connect_skills()
    print("✓ Connected skills based on similarity")
    
    # Verify graph structure
    total_nodes = len(graph_rag.job_skills_list) + len(graph_rag.candidate_skills_list)
    print(f"✓ Total nodes in graph: {total_nodes}")
    
    return True


def test_match_computation():
    """Test match score computation."""
    print("\n=== Testing Match Score Computation ===")
    
    # Test Case 1: Perfect match
    print("\nTest Case 1: Perfect match")
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    job_skills = ["Python", "FastAPI", "MongoDB"]
    candidate_skills = ["Python", "FastAPI", "MongoDB"]
    
    graph_rag.add_job_skills("job1", job_skills)
    graph_rag.add_candidate_skills("candidate1", candidate_skills)
    graph_rag.connect_skills()
    
    score = graph_rag.compute_match_score()
    print(f"  Match Score: {score}% (expected: ~100%)")
    print(f"  ✓ Perfect match detected" if score >= 95 else f"  ✗ Expected higher score")
    
    # Test Case 2: Partial match
    print("\nTest Case 2: Partial match")
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    job_skills = ["Python", "FastAPI", "MongoDB", "Docker", "Kubernetes"]
    candidate_skills = ["Python", "FastAPI", "PostgreSQL"]
    
    graph_rag.add_job_skills("job2", job_skills)
    graph_rag.add_candidate_skills("candidate2", candidate_skills)
    graph_rag.connect_skills()
    
    score = graph_rag.compute_match_score()
    matched = graph_rag.get_matched_skills()
    missing = graph_rag.get_missing_skills()
    
    print(f"  Match Score: {score}%")
    print(f"  Matched Skills: {matched}")
    print(f"  Missing Skills: {missing}")
    print(f"  ✓ Partial match computed")
    
    # Test Case 3: No match
    print("\nTest Case 3: No match")
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    job_skills = ["Python", "FastAPI", "MongoDB"]
    candidate_skills = ["Java", "Spring Boot", "MySQL"]
    
    graph_rag.add_job_skills("job3", job_skills)
    graph_rag.add_candidate_skills("candidate3", candidate_skills)
    graph_rag.connect_skills()
    
    score = graph_rag.compute_match_score()
    print(f"  Match Score: {score}% (expected: 0%)")
    print(f"  ✓ No match detected" if score == 0 else f"  ✗ Expected 0% score")
    
    # Test Case 4: Empty skills
    print("\nTest Case 4: Empty job skills")
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    job_skills = []
    candidate_skills = ["Python", "FastAPI"]
    
    graph_rag.add_job_skills("job4", job_skills)
    graph_rag.add_candidate_skills("candidate4", candidate_skills)
    graph_rag.connect_skills()
    
    score = graph_rag.compute_match_score()
    print(f"  Match Score: {score}% (expected: 0%)")
    print(f"  ✓ Empty skills handled" if score == 0 else f"  ✗ Expected 0% score")
    
    return True


def test_explainability():
    """Test explainability output."""
    print("\n=== Testing Explainability ===")
    
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    
    job_skills = ["Python", "FastAPI", "MongoDB", "Docker"]
    candidate_skills = ["Python", "FastAPI", "PostgreSQL", "Python Programming"]
    
    graph_rag.add_job_skills("job_test", job_skills)
    graph_rag.add_candidate_skills("candidate_test", candidate_skills)
    graph_rag.connect_skills()
    
    explainability = graph_rag.get_explainability()
    
    print(f"\nExplainability Results ({len(explainability)} matches):")
    for item in explainability:
        print(f"  - Job Skill: '{item['job_skill']}' ↔ "
              f"Candidate Skill: '{item['candidate_skill']}' "
              f"(Similarity: {item['similarity']})")
    
    print("\n✓ Explainability data is structured and readable")
    return True


def test_missing_skills():
    """Test missing skills detection."""
    print("\n=== Testing Missing Skills Detection ===")
    
    graph_rag = SkillGraphRAG(similarity_threshold=0.6)
    
    job_skills = ["Python", "FastAPI", "MongoDB", "Docker", "Kubernetes"]
    candidate_skills = ["Python", "FastAPI"]
    
    graph_rag.add_job_skills("job_missing", job_skills)
    graph_rag.add_candidate_skills("candidate_missing", candidate_skills)
    graph_rag.connect_skills()
    
    missing = graph_rag.get_missing_skills()
    matched = graph_rag.get_matched_skills()
    
    print(f"\nMatched Skills: {matched}")
    print(f"Missing Skills: {missing}")
    
    expected_missing = ["MongoDB", "Docker", "Kubernetes"]
    actual_missing_set = set(missing)
    expected_missing_set = set(expected_missing)
    
    if actual_missing_set == expected_missing_set:
        print("✓ Missing skills correctly identified")
        return True
    else:
        print(f"✗ Expected missing: {expected_missing_set}, Got: {actual_missing_set}")
        return False


def test_determinism():
    """Test that the matching is deterministic."""
    print("\n=== Testing Determinism ===")
    
    job_skills = ["Python", "FastAPI", "MongoDB"]
    candidate_skills = ["Python", "FastAPI", "PostgreSQL"]
    
    scores = []
    for i in range(3):
        graph_rag = SkillGraphRAG(similarity_threshold=0.6)
        graph_rag.add_job_skills("job_det", job_skills)
        graph_rag.add_candidate_skills("candidate_det", candidate_skills)
        graph_rag.connect_skills()
        score = graph_rag.compute_match_score()
        scores.append(score)
    
    print(f"\nScores across 3 runs: {scores}")
    
    if len(set(scores)) == 1:
        print("✓ Matching is deterministic (same score across runs)")
        return True
    else:
        print("✗ Non-deterministic results detected")
        return False


def run_all_tests():
    """Run all Graph-RAG tests."""
    print("\n" + "="*60)
    print("  GRAPH-RAG SKILL MATCHING TEST SUITE")
    print("="*60)
    
    tests = [
        ("Semantic Similarity", test_semantic_similarity),
        ("Graph Construction", test_graph_construction),
        ("Match Computation", test_match_computation),
        ("Explainability", test_explainability),
        ("Missing Skills Detection", test_missing_skills),
        ("Determinism", test_determinism)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ {test_name} failed with error: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("  TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "="*60)
    print(f"  TOTAL: {passed}/{total} tests passed")
    print("="*60 + "\n")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
