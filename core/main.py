"""
═══════════════════════════════════════════════════════════════
 REDGLYPH — AI Code Reviewer (FastAPI Backend)
 
 Features:
   • Serves the frontend as static files
   • Proxies review requests through LangGraph
   • Supports custom user API keys via X-Custom-API-Key header
   • Audit logging on every request
   • CORS enabled for local development
   • API key is NEVER exposed to the frontend
═══════════════════════════════════════════════════════════════
"""

import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.reviewer_graph import get_default_graph, create_graph
from core.config import config
from core.audit import log_review
from core.email_report import send_session_report, ReportRequest
import uvicorn


# ─── App Setup ───
app = FastAPI(
    title="RedGlyph — AI Code Reviewer",
    description="AI-powered code review using Google Gemini + LangGraph",
    version="2.0.0",
)

# ─── CORS (allows frontend to call API in dev) ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Schema ───
class CodeRequest(BaseModel):
    code: str


# ─── Review Endpoint ───
@app.post("/review")
async def review_code(request: CodeRequest, raw_request: Request):
    start_time = time.time()
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    custom_key = raw_request.headers.get("X-Custom-API-Key")
    api_mode = "custom" if custom_key else "default"

    try:
        print(f"🚀 Review request from {client_ip} (mode: {api_mode})")

        # Use custom API key if provided, otherwise use default graph
        if custom_key:
            custom_graph = create_graph(api_key=custom_key)
            result = custom_graph.invoke({"code_snippet": request.code})
        else:
            result = get_default_graph().invoke({"code_snippet": request.code})

        report = result["report"]
        duration_ms = (time.time() - start_time) * 1000

        # Audit log (no API keys logged!)
        log_review(
            request_ip=client_ip,
            language="auto",
            code_length=len(request.code),
            api_mode=api_mode,
            score=report.quality_score,
            issues_count=len(report.issues),
            duration_ms=duration_ms,
        )

        return report

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_review(
            request_ip=client_ip,
            language="auto",
            code_length=len(request.code),
            api_mode=api_mode,
            duration_ms=duration_ms,
            error=str(e),
        )

        if "429" in str(e):
            raise HTTPException(
                status_code=429,
                detail="AI is taking a coffee break (Rate Limit). Try again in 60s!"
            )
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Health Check ───
@app.get("/health")
@app.get("/")
def health_check():
    return {"status": "RedGlyph Reviewer API is Online 🟢", "version": "2.0.0"}


# ─── Session Report ───
@app.post("/send-report")
async def send_report(report_request: ReportRequest, raw_request: Request):
    client_ip = raw_request.client.host if raw_request.client else "unknown"

    if not report_request.reviews:
        raise HTTPException(status_code=400, detail="No reviews to report.")
    if not report_request.email or "@" not in report_request.email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    try:
        send_session_report(report_request)
        avg = round(sum(r.quality_score for r in report_request.reviews) / len(report_request.reviews), 1)
        print(f"📧 Session report sent to {report_request.email} | {len(report_request.reviews)} reviews | avg: {avg}")
        return {
            "status": "sent",
            "recipient": report_request.email,
            "total_reviews": len(report_request.reviews),
            "average_score": avg,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"❌ Email error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")



# ─── Webhook (GitHub integration) ───
@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    commit_msg = payload.get("commits", [{}])[0].get("message", "No message")
    repo_name = payload.get("repository", {}).get("full_name")
    print(f"📦 New Push in {repo_name}: {commit_msg}")
    return {"status": "Webhook Received 🟢"}


# ─── Serve Frontend (Static Files) ───
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    # Serve index.html at /app
    @app.get("/app")
    async def serve_frontend():
        return FileResponse(frontend_dir / "index.html")

    # Serve static assets (CSS, JS)
    app.mount("/css", StaticFiles(directory=frontend_dir / "css"), name="css")
    app.mount("/js", StaticFiles(directory=frontend_dir / "js"), name="js")


# ─── Entrypoint ───
if __name__ == "__main__":
    print(f"\n{'═'*50}")
    print(f"  🚀 RedGlyph AI Code Reviewer v2.0")
    print(f"  📡 API:      http://localhost:{config.PORT}")
    print(f"  🎨 Frontend: http://localhost:{config.PORT}/app")
    print(f"{'═'*50}\n")
    uvicorn.run(app, host=config.HOST, port=config.PORT)