import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from schemas.state import AgentState, ReviewReport
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
load_dotenv()


from core.config import config

def get_llm(api_key: str = None):
    """
    Create an LLM instance. 
    If a custom API key is provided, use it. Otherwise, use the server's default.
    This allows users to bring their own API key without touching the backend.
    """
    key = api_key or os.getenv("GOOGLE_API_KEY")
    return ChatGoogleGenerativeAI(
        model=config.DEFAULT_MODEL,
        temperature=config.TEMPERATURE,
        google_api_key=key,
    )


def create_graph(api_key: str = None):
    """Build a fresh LangGraph with the given API key (or default)."""

    llm = get_llm(api_key)
    structured_llm = llm.with_structured_output(ReviewReport)

    def code_reviewer_node(state: AgentState):
        print("🔍 Analyzing code with Gemini...")
        prompt = f"Review this code for bugs and efficiency:\n\n{state['code_snippet']}"
        result = structured_llm.invoke(prompt)
        return {"report": result}

    def email_notification_node(state: AgentState):
        sender_email = os.getenv("EMAIL_ADDRESS")
        receiver_email = sender_email
        password = os.getenv("EMAIL_APP_PASSWORD")
        report = state["report"]

        if not sender_email or not password:
            print("⏭️  Email not configured, skipping notification.")
            return state

        message = MIMEMultipart("alternative")
        message["Subject"] = f"🚀 AI Code Review: Score {report.quality_score}/10"
        message["From"] = sender_email
        message["To"] = receiver_email

        issues_html = "".join([
            f"<li><b>[{issue.severity}]</b>: {issue.description}<br><i>💡 Suggestion: {issue.suggestion}</i></li>"
            for issue in report.issues
        ])

        html = f"""
        <html>
          <body>
            <h2>Punki: AI Code Review Report</h2>
            <p><b>Quality Score:</b> {report.quality_score}/10</p>
            <hr>
            <h3>Identified Issues:</h3>
            <ul>{issues_html}</ul>
          </body>
        </html>
        """
        message.attach(MIMEText(html, "html"))

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, password)
                server.sendmail(sender_email, receiver_email, message.as_string())
            print("✅ Email sent successfully!")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")

        return state

    workflow = StateGraph(AgentState)
    workflow.add_node("reviewer", code_reviewer_node)
    workflow.add_node("notifier", email_notification_node)
    workflow.set_entry_point("reviewer")
    workflow.add_edge("reviewer", "notifier")
    workflow.add_edge("notifier", END)
    return workflow.compile()


# Lazy default graph — only created on first request, not at import time.
# This allows the server to start even without a valid API key (e.g. in CI).
_default_graph = None

def get_default_graph():
    """Get or create the default graph (lazy singleton)."""
    global _default_graph
    if _default_graph is None:
        _default_graph = create_graph()
    return _default_graph
