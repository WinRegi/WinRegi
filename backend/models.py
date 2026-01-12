from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class CommandIntent(BaseModel):
    intent: str
    api_key: Optional[str] = None
    provider: Literal["ollama", "gemini"] = "ollama"

class CommandResult(BaseModel):
    id: str = Field(..., description="Unique ID for the command")
    intent: str
    description: str
    command: str
    type: str = Field("powershell", description="Type of command (powershell, cmd, bat)")
    requires_admin: bool = False
    safety_tier: int = Field(..., description="1: Trusted, 2: AI Generated, 3: Verified/Starred")
    source: str = Field(..., description="Source of the command (Local DB, Ollama, Gemini)")

class UserSettings(BaseModel):
    theme: str = "dark"
    gemini_api_key: Optional[str] = None
    ai_provider: str = "ollama"
    favorites: List[str] = []

class SummaryRequest(BaseModel):
    intent: str
    output: str
    api_key: Optional[str] = None
    provider: Literal["ollama", "gemini"] = "ollama"

class SummaryResult(BaseModel):
    summary: str
