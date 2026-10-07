from typing import List, Literal, Optional

from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    # Only user/assistant turns come from the browser. The system prompt is set on the server.
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(min_length=1, max_length=20)
    model: Optional[str] = None
    mode: Optional[str] = None
    # Company data collected by the app (employees, tasks, finance...) as plain text
    company_context: Optional[str] = Field(default=None, max_length=20000)

class ChatResponse(BaseModel):
    reply: str
    model: str

class AIStatus(BaseModel):
    configured: bool
    model: str
