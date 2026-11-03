import re
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal, Optional
from pydantic import AfterValidator, BaseModel, ConfigDict, Field, computed_field, model_validator
from app.services.profile_pictures import profile_picture_url

Role = Literal["ceo", "admin", "hr", "team_lead", "project_manager", "employee"]
Status = Literal["online", "away", "offline"]

def _bytes_ok(value: str) -> str:
    if len(value.encode("utf-8")) > 72:  # bcrypt only accepts 72 bytes
        raise ValueError("Password is too long")
    return value

def _ok(pattern, message):  # validator: strip the text, then it must match the pattern
    def check(value: str) -> str:
        if not re.match(pattern, value := value.strip()):
            raise ValueError(message)
        return value
    return check

Name = Annotated[str, Field(min_length=1, max_length=80), AfterValidator(_ok(r".+", "Name must not be blank"))]
Email = Annotated[str, Field(min_length=3, max_length=120), AfterValidator(_ok(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", "Enter a valid email address")), AfterValidator(str.lower)]
Timezone = Annotated[str, AfterValidator(_ok(r"^(UTC|[A-Za-z]+(/[A-Za-z0-9_+\-]+){1,2})$", "Timezone must be an IANA name such as Asia/Dhaka or UTC"))]

Password = Annotated[str, Field(min_length=8, max_length=72), AfterValidator(_bytes_ok)]
CurrentPassword = Annotated[str, Field(min_length=1, max_length=72), AfterValidator(_bytes_ok)]

class UserOut(BaseModel):  # hashed_password is not listed, so it can never leave the API
    id: int
    name: str
    email: str
    role: str
    status: str = "offline"
    timezone: str = "UTC"
    last_active: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def avatar_url(self) -> str:
        return profile_picture_url(self.id)
    
    @model_validator(mode="after")
    def offline_if_stale(self):  # no heartbeat for 150 s (2.5 x 60 s) means offline
        if self.last_active is None:
            self.status = "offline"
            return self
            
        # Ensure last_active has timezone info before comparing
        last_active_aware = self.last_active
        if last_active_aware.tzinfo is None:
            last_active_aware = last_active_aware.replace(tzinfo=timezone.utc)
            
        # Safely compare timezone-aware datetimes
        if datetime.now(timezone.utc) - last_active_aware > timedelta(seconds=150):
            self.status = "offline"
            
        return self

UserResponse = UserOut  # the ticket's name for UserOut

class UserCreate(BaseModel):
    name: Name
    email: Email
    password: Password
    role: Role = "employee"
    status: Status = "offline"
    timezone: Timezone = "UTC"

class UserUpdate(BaseModel):  # omitted fields stay as they are
    name: Optional[Name] = None
    role: Optional[Role] = None
    status: Optional[Status] = None
    timezone: Optional[Timezone] = None

class StatusUpdate(BaseModel):  # body of PUT /api/users/me/status (the heartbeat)
    status: Status
    timezone: Optional[Timezone] = None

class ProfileUpdate(BaseModel):  # what a user may change about themselves (no role)
    name: Optional[Name] = None
    timezone: Optional[Timezone] = None

class ChangePasswordRequest(BaseModel):
    current_password: CurrentPassword
    new_password: Password
    confirm_new_password: Password

    @model_validator(mode="after")
    def new_passwords_must_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match")
        return self

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    user: UserOut
    token_type: str = "bearer"