"""
Fire-and-forget trigger for the ResumeMatch n8n workflow.

The n8n workflow exposes a single webhook (default path ``/webhook/resume-uploaded``)
which routes by ``$json.event``::

    {"event": "resume_uploaded", "data": {"resume_id": "...", "candidate_id": "..."}}
    {"event": "job_applied",     "data": {"resume_id": "...", "job_id": "...",
                                          "application_id": "...", "candidate_id": "..."}}

The HTTP call is dispatched on a daemon thread so the FastAPI request handler
that triggers it never blocks on n8n availability or latency.
"""

import threading
import logging
import requests

from app.config import N8N_WEBHOOK_URL, N8N_SHARED_SECRET

logger = logging.getLogger(__name__)

# Webhook timeouts: short connect timeout, longer read timeout to absorb
# n8n cold starts. Both fire on a background thread so they never block FastAPI.
_CONNECT_TIMEOUT = 3
_READ_TIMEOUT = 15


def _post_to_n8n(event_type: str, body: dict) -> None:
    """Perform the actual HTTP POST. Runs on a background thread."""
    headers = {"Content-Type": "application/json"}
    if N8N_SHARED_SECRET:
        # Forward the shared secret so the workflow can authenticate the caller
        # if it chooses to (n8n cannot verify a JWT on its own).
        headers["X-N8N-SECRET"] = N8N_SHARED_SECRET

    try:
        response = requests.post(
            N8N_WEBHOOK_URL,
            json=body,
            headers=headers,
            timeout=(_CONNECT_TIMEOUT, _READ_TIMEOUT),
        )
        response.raise_for_status()
        logger.info(
            "n8n webhook accepted — event=%s status=%s url=%s",
            event_type, response.status_code, N8N_WEBHOOK_URL,
        )

    except requests.exceptions.Timeout:
        logger.error("n8n webhook timed out — event=%s url=%s", event_type, N8N_WEBHOOK_URL)

    except requests.exceptions.ConnectionError:
        logger.error("n8n webhook unreachable — event=%s url=%s", event_type, N8N_WEBHOOK_URL)

    except requests.exceptions.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else "?"
        body_preview = ""
        if exc.response is not None:
            body_preview = (exc.response.text or "")[:300]
        logger.error(
            "n8n webhook returned an error — event=%s status=%s body=%s",
            event_type, status_code, body_preview,
        )

    except Exception as exc:
        logger.error("Unexpected error triggering n8n workflow — event=%s error=%s", event_type, exc)


def trigger_n8n_workflow(event_type: str, payload: dict) -> None:
    """
    Fire-and-forget trigger for the n8n webhook.

    Spawns a daemon thread that POSTs::

        {"event": "<event_type>", "data": <payload>}

    to ``N8N_WEBHOOK_URL``. Returns immediately; the caller is never blocked
    or affected by n8n being slow, offline, or returning errors.

    Args:
        event_type: Logical event name. Currently ``"resume_uploaded"`` or
            ``"job_applied"`` — must match a branch of the workflow's Switch node.
        payload:    Event-specific data. The workflow reads fields via
            ``$json.data.<field>`` (e.g. ``data.resume_id``, ``data.job_id``).
    """
    if not N8N_WEBHOOK_URL:
        logger.warning(
            "N8N_WEBHOOK_URL is not configured — skipping trigger for event=%s",
            event_type,
        )
        return

    body = {"event": event_type, "data": payload}

    logger.info(
        "Dispatching n8n workflow — event=%s payload_keys=%s",
        event_type, sorted(payload.keys()),
    )

    thread = threading.Thread(
        target=_post_to_n8n,
        args=(event_type, body),
        name=f"n8n-trigger-{event_type}",
        daemon=True,
    )
    thread.start()
