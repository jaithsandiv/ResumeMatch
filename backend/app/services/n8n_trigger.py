import requests
import logging
from app.config import N8N_WEBHOOK_URL

logger = logging.getLogger(__name__)


def trigger_n8n_workflow(event_type: str, payload: dict) -> None:
    """
    Fire-and-forget trigger for an n8n webhook.

    Sends an HTTP POST to ``N8N_WEBHOOK_URL`` with the body::

        {"event": "<event_type>", "data": payload}

    All exceptions are caught and logged; the caller is never affected by
    n8n being offline or slow.

    Args:
        event_type: Logical name for the event (e.g. ``"resume_uploaded"``).
        payload:    Arbitrary dict containing event-specific context.
    """
    if not N8N_WEBHOOK_URL:
        logger.warning("N8N_WEBHOOK_URL is not configured — skipping trigger for event=%s", event_type)
        return

    body = {"event": event_type, "data": payload}

    try:
        logger.info("Triggering n8n workflow — event=%s payload_keys=%s", event_type, list(payload.keys()))

        response = requests.post(N8N_WEBHOOK_URL, json=body, timeout=5)
        response.raise_for_status()

        logger.info("n8n webhook accepted — event=%s status=%s", event_type, response.status_code)

    except requests.exceptions.Timeout:
        logger.error("n8n webhook timed out — event=%s url=%s", event_type, N8N_WEBHOOK_URL)

    except requests.exceptions.ConnectionError:
        logger.error("n8n webhook unreachable — event=%s url=%s", event_type, N8N_WEBHOOK_URL)

    except requests.exceptions.HTTPError as exc:
        logger.error("n8n webhook returned an error — event=%s status=%s", event_type, exc.response.status_code)

    except Exception as exc:
        logger.error("Unexpected error triggering n8n workflow — event=%s error=%s", event_type, exc)
