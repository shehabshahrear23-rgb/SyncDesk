import re
from datetime import datetime, timedelta
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Role = Literal["admin", "hr", "employee"]

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

Status = Literal["online", "away", "offline"]

# The browser sends a heartbeat every 60 seconds. If we have heard nothing for
# 2.5 heartbeats (closed tab, crashed browser, no internet), the user is offline.
STALE_AFTER = timedelta(seconds=150)

# "UTC", or an IANA name such as Asia/Dhaka or America/Argentina/Buenos_Aires.
# (Format check only, so no extra tz-database package is needed on Windows.)
TIMEZONE_PATTERN = re.compile(r"^(UTC|[A-Za-z]+(/[A-Za-z0-9_+\-]+){1,2})$")

def check_timezone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    if not TIMEZONE_PATTERN.match(value):
        raise ValueError("Timezone must be an IANA name such as Asia/Dhaka or UTC")
    return value

class UserOut(BaseModel):
    # Only these four fields ever leave the API. hashed_password is not listed,
    # so it can never be serialized even if the ORM object carries it.
    id: int
    name: str
    email: str
    role: str
    status: str = "offline"
    timezone: str = "UTC"
    last_active: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def offline_if_stale(self):
        # A user who says "online" but has not sent a heartbeat recently is really offline.
        if self.status != "offline":
            fresh = self.last_active is not None and datetime.utcnow() - self.last_active <= STALE_AFTER
            if not fresh:
                self.status = "offline"
        return self

# The ticket calls this schema "UserResponse"; in this project it is UserOut.
UserResponse = UserOut

class UserCreate(BaseModel):
    """What the admin's "Add User" form sends."""
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=120)
    role: Role = "employee"
    password: str = Field(min_length=8, max_length=72)
    status: Status = "offline"
    timezone: str = "UTC"

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        return check_timezone(value)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long")
        return value

class UserUpdate(BaseModel):
    """Fields an admin may change on an existing account. Omitted fields stay as they are."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    role: Optional[Role] = None
    status: Optional[Status] = None
    timezone: Optional[str] = None

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: Optional[str]) -> Optional[str]:
        return check_timezone(value)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value

class StatusUpdate(BaseModel):
    """Body of PUT /api/users/me/status (the heartbeat)."""
    status: Status
    timezone: Optional[str] = None  # optional: the browser's own timezone

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: Optional[str]) -> Optional[str]:
        return check_timezone(value)

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut