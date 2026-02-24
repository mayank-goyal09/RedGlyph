"""
═══════════════════════════════════════════════════════
 REDGLYPH — Email Report Service
 Sends a session summary (all reviews + average score)
 to any user-provided email address.
═══════════════════════════════════════════════════════
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from pydantic import BaseModel, Field


class IssuePayload(BaseModel):
    severity: str
    description: str
    suggestion: str


class ReviewPayload(BaseModel):
    quality_score: float
    issues: List[IssuePayload]


class ReportRequest(BaseModel):
    email: str = Field(..., description="Recipient's email address")
    reviews: List[ReviewPayload] = Field(..., description="All code reviews in the session")


def _severity_color(severity: str) -> str:
    s = severity.lower()
    if s == "high":   return "#ef4444"
    if s == "medium": return "#f97316"
    return "#22c55e"


def _score_color(score: float) -> str:
    if score >= 8: return "#22c55e"
    if score >= 6: return "#f97316"
    if score >= 4: return "#f59e0b"
    return "#ef4444"


def _score_label(score: float) -> str:
    if score >= 8: return "Excellent ✨"
    if score >= 6: return "Good 👍"
    if score >= 4: return "Needs Improvement ⚠️"
    return "Critical Issues 🚨"


def build_html_report(reviews: List[ReviewPayload], recipient_email: str) -> str:
    """Build a premium HTML email with all reviews and average score."""
    avg_score = round(sum(r.quality_score for r in reviews) / len(reviews), 1)
    avg_color = _score_color(avg_score)
    avg_label = _score_label(avg_score)
    total = len(reviews)

    # Build each review block
    review_blocks = ""
    for idx, review in enumerate(reviews, start=1):
        score_color = _score_color(review.quality_score)
        issues_html = ""
        for issue in review.issues:
            c = _severity_color(issue.severity)
            issues_html += f"""
            <div style="margin:10px 0; padding:12px 16px; background:#1a1a1a;
                        border-left:3px solid {c}; border-radius:6px;">
                <span style="font-size:11px; font-weight:700; color:{c};
                             text-transform:uppercase; letter-spacing:0.05em;">
                    {issue.severity}
                </span>
                <p style="margin:6px 0 4px; color:#e0e0e0; font-size:14px;">
                    {issue.description}
                </p>
                <p style="margin:0; color:#888; font-size:13px;">
                    💡 {issue.suggestion}
                </p>
            </div>"""

        if not issues_html:
            issues_html = '<p style="color:#22c55e;">No issues found — clean code! ✅</p>'

        review_blocks += f"""
        <div style="margin:24px 0; padding:20px; background:#111; border:1px solid #222;
                    border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;
                        margin-bottom:16px;">
                <h3 style="margin:0; color:#f0f0f0; font-size:16px;">
                    Review #{idx}
                </h3>
                <span style="font-size:22px; font-weight:800; color:{score_color};
                             font-family:monospace;">
                    {review.quality_score}/10
                </span>
            </div>
            <h4 style="margin:0 0 8px; color:#888; font-size:12px;
                       text-transform:uppercase; letter-spacing:0.06em;">Issues Found</h4>
            {issues_html}
        </div>"""

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:0; background:#000; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000; padding:32px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0"
             style="background:#0a0a0a; border:1px solid #1f1f1f; border-radius:16px;
                    overflow:hidden; max-width:620px; width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:32px; background:linear-gradient(135deg,#14532d 0%,#15803d 100%);">
            <h1 style="margin:0; font-size:28px; font-weight:800; color:#fff;
                       letter-spacing:-0.5px;">
              RedGlyph<span style="color:#86efac;">.</span>
            </h1>
            <p style="margin:6px 0 0; color:#bbf7d0; font-size:14px;">
              AI Code Reviewer — Session Report
            </p>
          </td>
        </tr>

        <!-- Average Score Banner -->
        <tr>
          <td style="padding:28px 32px; border-bottom:1px solid #1f1f1f;">
            <p style="margin:0 0 6px; font-size:12px; font-weight:600; color:#555;
                      text-transform:uppercase; letter-spacing:0.06em;">
              Session Average Score
            </p>
            <div style="display:flex; align-items:baseline; gap:12px;">
              <span style="font-size:52px; font-weight:900; color:{avg_color};
                           font-family:monospace; line-height:1;">
                {avg_score}
              </span>
              <div>
                <span style="font-size:20px; color:#444;">/10</span><br>
                <span style="font-size:15px; font-weight:600; color:{avg_color};">
                  {avg_label}
                </span>
              </div>
            </div>
            <p style="margin:14px 0 0; font-size:14px; color:#555;">
              Based on <strong style="color:#888;">{total} code review{"s" if total > 1 else ""}</strong>
              in this session.
            </p>
          </td>
        </tr>

        <!-- Individual Reviews -->
        <tr>
          <td style="padding:24px 32px;">
            <h2 style="margin:0 0 4px; font-size:16px; font-weight:700; color:#f0f0f0;">
              Detailed Reviews
            </h2>
            <p style="margin:0 0 20px; font-size:13px; color:#555;">
              Each code snippet you submitted during this session:
            </p>
            {review_blocks}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px; border-top:1px solid #1f1f1f;
                     background:#050505; text-align:center;">
            <p style="margin:0; font-size:12px; color:#333;">
              Sent by <strong style="color:#22c55e;">RedGlyph AI Code Reviewer</strong>
              · Keep shipping great code! 🚀
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return html


def send_session_report(request: ReportRequest) -> bool:
    """Send the session summary email. Returns True on success, False on failure."""
    sender_email = os.getenv("EMAIL_ADDRESS")
    password = os.getenv("EMAIL_APP_PASSWORD")

    if not sender_email or not password:
        raise RuntimeError("Email credentials not configured on the server.")

    avg_score = round(sum(r.quality_score for r in request.reviews) / len(request.reviews), 1)

    message = MIMEMultipart("alternative")
    message["Subject"] = (
        f"📊 RedGlyph Session Report — {len(request.reviews)} Reviews | Avg Score: {avg_score}/10"
    )
    message["From"] = sender_email
    message["To"] = request.email

    html_body = build_html_report(request.reviews, request.email)
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, request.email, message.as_string())

    return True
