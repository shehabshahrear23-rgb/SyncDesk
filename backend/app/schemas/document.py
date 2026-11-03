from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

class DocumentOut(BaseModel):
    id: int
    title: str
    category: str
    linked_context: List[str] = []
    upload_date: date  # sent as "YYYY-MM-DD"
    file_size: str
    author: Optional[str] = None
    starred: bool = False
    owner_id: Optional[int] = None
    is_sample: bool = False
    storage_name: Optional[str] = Field(default=None, exclude=True)

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def has_file(self) -> bool:
        return bool(getattr(self, "storage_name", None))


class DocumentUserOut(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DocumentAccessUpdate(BaseModel):
    user_ids: List[int] = Field(max_length=500)

    @field_validator("user_ids")
    @classmethod
    def remove_duplicate_users(cls, user_ids: List[int]) -> List[int]:
        return list(dict.fromkeys(user_ids))


class DocumentCreate(BaseModel):
    """What the Upload Document form sends. The upload date is set by the server."""
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=60)
    linked_context: List[str] = Field(default_factory=list, max_length=8)
    file_size: str = Field(min_length=1, max_length=20)
    author: Optional[str] = Field(default=None, max_length=80)
    starred: bool = False

    @field_validator("title", "category", "file_size")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("author")
    @classmethod
    def clean_author(cls, value: Optional[str]) -> Optional[str]:
        value = (value or "").strip()
        return value or None

    @field_validator("linked_context")
    @classmethod
    def clean_contexts(cls, values: List[str]) -> List[str]:
        cleaned = []
        for value in values:
            value = str(value).strip()[:40]
            if value and value.lower() not in [c.lower() for c in cleaned]:
                cleaned.append(value)
        return cleaned