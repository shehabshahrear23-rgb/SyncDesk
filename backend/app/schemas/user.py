import re
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

Role = Literal["admin", "hr", "employee"]

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class UserOut(BaseModel):
    # Only these four fields ever leave the API. hashed_password is not listed,
    # so it can never be serialized even if the ORM object carries it.
    id: int
    name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    """What the admin's "Add User" form sends."""
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=120)
    role: Role = "employee"
    password: str = Field(min_length=8, max_length=72)

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

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut