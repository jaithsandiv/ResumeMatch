"""
Skill extraction service using LLM-based extraction with keyword-based fallback.
"""

import logging
import json
from typing import List, Dict
from openai import OpenAI
from app.config import OPENAI_API_KEY

# Configure logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Predefined skill whitelist for fallback extraction
SKILL_WHITELIST = [
    # Programming Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl",
    
    # Web Frameworks
    "FastAPI", "Django", "Flask", "React", "Angular", "Vue.js", "Next.js",
    "Express.js", "Node.js", "Spring Boot", "ASP.NET", "Laravel",
    
    # Databases
    "MongoDB", "PostgreSQL", "MySQL", "SQL", "Redis", "Cassandra", "DynamoDB",
    "Oracle", "SQL Server", "MariaDB", "SQLite", "Elasticsearch",
    
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "GitLab CI",
    "GitHub Actions", "Terraform", "Ansible", "CircleCI", "Travis CI",
    
    # Data & AI/ML
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Keras",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Science",
    
    # APIs & Protocols
    "REST", "GraphQL", "gRPC", "WebSocket", "SOAP", "OAuth", "JWT",
    
    # Version Control & Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Jira", "Confluence",
    
    # Testing
    "Jest", "Pytest", "JUnit", "Selenium", "Cypress", "Mocha", "TestNG",
    
    # Message Queues
    "RabbitMQ", "Kafka", "ActiveMQ", "Redis Queue",
    
    # Mobile Development
    "React Native", "Flutter", "iOS", "Android", "Xamarin",
    
    # Other Technical Skills
    "Microservices", "Agile", "Scrum", "CI/CD", "Linux", "Unix", "Bash",
    "PowerShell", "Nginx", "Apache", "Spark", "Hadoop", "Airflow"
]


class SkillExtractionError(Exception):
    """Custom exception for skill extraction failures."""
    pass


def extract_skills_llm(text: str) -> List[str]:
    """
    Extract professional skills from text using OpenAI LLM.
    
    Args:
        text: Resume text to extract skills from
        
    Returns:
        List of extracted skill names
        
    Raises:
        SkillExtractionError: If LLM extraction fails or returns invalid output
    """
    if not client:
        raise SkillExtractionError("OpenAI API key not configured")
    
    if not text or not text.strip():
        raise SkillExtractionError("Empty text provided for skill extraction")
    
    # Construct prompt for skill extraction
    prompt = f"""Extract ONLY professional technical skills from the following resume text.

Requirements:
- Return a valid JSON array of strings
- Include ONLY hard/technical skills (e.g., programming languages, frameworks, tools)
- Exclude soft skills (e.g., "communication", "teamwork") unless they are technical certifications
- Normalize skill names (e.g., "Python" not "python programming")
- Remove duplicates
- No explanations, no sentences, ONLY the JSON array

Resume Text:
{text[:4000]}

Output format example: ["Python", "FastAPI", "Docker", "AWS"]

JSON Array:"""

    try:
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume parser that extracts technical skills. Always return valid JSON arrays only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500,
            timeout=30
        )
        
        # Extract response content
        content = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            skills = json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            skills = json.loads(content)
        
        # Validate response
        if not isinstance(skills, list):
            raise SkillExtractionError("LLM did not return a list")
        
        if not skills:
            raise SkillExtractionError("LLM returned empty skill list")
        
        # Clean and validate skill names
        cleaned_skills = []
        for skill in skills:
            if isinstance(skill, str) and skill.strip():
                cleaned_skills.append(skill.strip())
        
        if not cleaned_skills:
            raise SkillExtractionError("No valid skills after cleaning")
        
        logger.info(f"LLM extracted {len(cleaned_skills)} skills")
        return cleaned_skills
    
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON response: {str(e)}")
        raise SkillExtractionError(f"Invalid JSON from LLM: {str(e)}")
    
    except Exception as e:
        logger.error(f"LLM skill extraction failed: {str(e)}")
        raise SkillExtractionError(f"LLM extraction failed: {str(e)}")


def extract_skills_fallback(text: str) -> List[str]:
    """
    Extract skills using keyword-based matching against a predefined whitelist.
    
    This is a deterministic fallback method when LLM extraction fails.
    
    Args:
        text: Resume text to extract skills from
        
    Returns:
        List of matched skill names from whitelist
    """
    if not text or not text.strip():
        return []
    
    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Find matching skills
    matched_skills = set()
    
    for skill in SKILL_WHITELIST:
        # Case-insensitive search
        if skill.lower() in text_lower:
            matched_skills.add(skill)
    
    # Convert to sorted list for consistency
    result = sorted(list(matched_skills))
    
    logger.info(f"Fallback extraction found {len(result)} skills")
    return result


def extract_skills(text: str) -> Dict[str, any]:
    """
    Extract professional skills from resume text.
    
    Attempts LLM-based extraction first, falls back to keyword matching if needed.
    
    Args:
        text: Resume text to extract skills from
        
    Returns:
        Dictionary with:
        - method: "llm" or "fallback"
        - skills: List of skill names
    """
    if not text or not text.strip():
        logger.warning("Empty text provided for skill extraction")
        return {
            "method": "fallback",
            "skills": []
        }
    
    # Try LLM extraction first
    try:
        skills = extract_skills_llm(text)
        
        # Validate LLM results
        if isinstance(skills, list) and len(skills) > 0:
            logger.info(f"Successfully extracted {len(skills)} skills using LLM")
            return {
                "method": "llm",
                "skills": skills
            }
        else:
            logger.warning("LLM returned invalid or empty result, using fallback")
            raise SkillExtractionError("Invalid LLM result")
    
    except Exception as e:
        logger.warning(f"LLM extraction failed, using fallback: {str(e)}")
    
    # Fallback to keyword-based extraction
    skills = extract_skills_fallback(text)
    
    return {
        "method": "fallback",
        "skills": skills
    }
