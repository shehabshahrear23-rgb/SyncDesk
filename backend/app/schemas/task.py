from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TaskCategory = Literal["sprint", "operation"]
TaskReviewDecision = Literal["approve", "return"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: TaskCategory = "sprint"
    assignee_id: int = Field(gt=0)
    due_date: datetime

    @field_validator("title")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("title")
    @classmethod
    def required_title(cls, value: str) -> str:
        if not value:
            raise ValueError("Task title must not be blank.")
        return value

    @field_validator("due_date")
    @classmethod
    def require_future_aware_deadline(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Deadline must include a timezone.")
        if value <= datetime.now(timezone.utc):
            raise ValueError("Deadline must be in the future.")
        return value.astimezone(timezone.utc)


class TaskReviewAction(BaseModel):
    decision: TaskReviewDecision
    note: str = Field(default="", max_length=2000)

    @field_validator("note")
    @classmethod
    def trim_note(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def return_requires_note(self):
        if self.decision == "return" and not self.note:
            raise ValueError("Add a review note before returning the task.")
        return self


class TaskHistoryOut(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: str
    event_type: str
    note: str
    created_at: str


class TaskOut(BaseModel):
    id: int
    title: str
    project: str
    category: str
    status: str
    priority: str
    assignee_id: int
    assignee_name: str
    assignee_email: str
    assignee_avatar: str
    assigned_by_id: Optional[int] = None
    assigned_by_name: str
    progress: int
    due_date: str
    tags: List[str]
    description: str
    created_at: str
    updated_at: str
    history: List[TaskHistoryOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
