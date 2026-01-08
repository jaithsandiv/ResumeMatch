import requests
import logging
from app.config import N8N_WEBHOOK_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def trigger_n8n_workflow(resume_id: str, candidate_id: str) -> dict:
    """
    Trigger n8n workflow by sending a POST request to the webhook URL.
    
    Args:
        resume_id: The ID of the uploaded resume
        candidate_id: The ID of the candidate
        
    Returns:
        Response from n8n webhook or error information
    """
    payload = {
        "resume_id": resume_id,
        "candidate_id": candidate_id,
        "event": "resume_uploaded"
    }
    
    try:
        logger.info(f"Triggering n8n workflow for resume_id={resume_id}, candidate_id={candidate_id}")
        
        response = requests.post(
            N8N_WEBHOOK_URL,
            json=payload,
            timeout=10
        )
        
        response.raise_for_status()
        
        logger.info(f"n8n workflow triggered successfully: {response.status_code}")
        
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json() if response.content else {}
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to trigger n8n workflow: {str(e)}")
        
        # Don't crash the application if n8n is offline
        return {
            "success": False,
            "error": str(e),
            "message": "n8n webhook is currently unavailable"
        }
    
    except Exception as e:
        logger.error(f"Unexpected error triggering n8n workflow: {str(e)}")
        
        return {
            "success": False,
            "error": str(e),
            "message": "Unexpected error occurred"
        }
