"""
═══════════════════════════════════════════════════════
 REDGLYPH — Audit Logging Middleware
 Logs every review request with timestamp & metadata.
═══════════════════════════════════════════════════════
"""

import json
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from core.config import config

# Setup file-based audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

log_path = Path(config.AUDIT_LOG_FILE)
handler = logging.FileHandler(log_path, encoding="utf-8")
handler.setFormatter(logging.Formatter("%(message)s"))
audit_logger.addHandler(handler)


def log_review(request_ip: str, language: str, code_length: int, api_mode: str, 
               score: float = None, issues_count: int = None, 
               duration_ms: float = None, error: str = None):
    """Log a review event to the audit file."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "code_review",
        "ip": request_ip,
        "language": language,
        "code_chars": code_length,
        "api_mode": api_mode,
        "score": score,
        "issues_count": issues_count,
        "duration_ms": round(duration_ms, 2) if duration_ms else None,
        "error": error,
    }
    audit_logger.info(json.dumps(entry))


def log_auth_event(request_ip: str, event_type: str, detail: str = ""):
    """Log authentication / security events."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_type,
        "ip": request_ip,
        "detail": detail,
    }
    audit_logger.info(json.dumps(entry))
