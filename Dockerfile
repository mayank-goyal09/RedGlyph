# ═══════════════════════════════════════════════
# RedGlyph AI Code Reviewer — Dockerfile
# HuggingFace Spaces compatible (port 7860)
# ═══════════════════════════════════════════════

FROM python:3.11-slim AS base

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# HuggingFace Spaces requires port 7860
# PORT env var is respected by core/config.py
EXPOSE 7860

# Health check — uses $PORT (defaults to 7860 on HF, 8000 locally)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\",\"7860\")}/')"

# Run server
ENV PYTHONPATH=/app
ENV PORT=7860
CMD ["python", "core/main.py"]
