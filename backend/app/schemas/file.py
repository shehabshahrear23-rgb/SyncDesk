from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

class FileCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    filepath: str = Field(min_length=1, max_length=1024)
    size: int = Field(ge=0)
    category: str = Field(default="General", max_length=50)
    required_role_level: int = Field(default=10, ge=10)

class FileResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    size: int
    uploader_id: int
    category: str
    required_role_level: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
