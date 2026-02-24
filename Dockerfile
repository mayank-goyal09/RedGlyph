# ═══════════════════════════════════════════════
# Punki AI Code Reviewer — Dockerfile
# Multi-stage build for minimal image size
# ═══════════════════════════════════════════════

FROM python:3.11-slim AS base

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"

# Run server
ENV PYTHONPATH=/app
CMD ["python", "core/main.py"]
