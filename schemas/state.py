from typing import List, TypedDict
from pydantic import BaseModel, Field

class ReviewIssue(BaseModel):
    severity: str = Field(description="Severity: Low, Medium, or High")
    description: str = Field(description="What is the issue?")
    suggestion: str = Field(description="How to fix it?")

class ReviewReport(BaseModel):
    issues: List[ReviewIssue] = Field(description="List of all identified issues")
    quality_score: float = Field(description="Overall code quality score from 0.0 to 10.0")

class AgentState(TypedDict):
    code_snippet: str
    report: ReviewReport