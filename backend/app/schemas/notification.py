from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

class NotificationOut(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestNotification(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=1, max_length=300)