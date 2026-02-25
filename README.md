---
title: RedGlyph AI Code Reviewer
emoji: 🔍
colorFrom: green
colorTo: orange
sdk: docker
pinned: false
---

# 🔍 RedGlyph — AI Code Reviewer

> **Instant, AI-powered code reviews powered by Google Gemini.**
> Analyze bugs, performance issues, security flaws, and get actionable suggestions in seconds.

---

## ✨ Features

- 🤖 **AI-Powered Analysis** — Google Gemini reviews your code like a senior engineer
- 📊 **Quality Score** — Every review gives a score out of 10 with a visual ring
- 🔴 **Issue Detection** — Categorized by severity: High / Medium / Low
- 💡 **Fix Suggestions** — Every issue comes with a concrete suggestion
- 📧 **Session Report** — After multiple reviews, email yourself the full breakdown + average score
- 🔑 **BYO API Key** — Use your own Gemini key or the server default
- 🌙 **Dark Theme** — Premium green/orange/black UI

---

## 🚀 Usage

1. Paste your code into the editor
2. Select the language (Python, JS, Java, C++, Go, Rust, TypeScript)
3. Click **"Review Code"**
4. After one or more reviews, click **"Get Score Report"** to email yourself a full summary

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI** | Google Gemini 2.5 Flash via LangChain |
| **Backend** | FastAPI + LangGraph |
| **Frontend** | Vanilla HTML / CSS / JS |
| **Deployment** | Docker → HuggingFace Spaces |
| **CI/CD** | GitHub Actions |

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Google Gemini API key |
| `EMAIL_ADDRESS` | Gmail used to send session reports |
| `EMAIL_APP_PASSWORD` | Gmail App Password |

---

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/mayank-goyal09/RedGlyph.git
cd RedGlyph

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Add your API key
cp .env.example .env
# Edit .env and add GOOGLE_API_KEY

# Run the server
python core/main.py

# Open in browser
# http://localhost:8000/app
```

---

Made with ⚡ by **Mayank Goyal**
