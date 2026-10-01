from pydantic import BaseModel, EmailStr
from typing import Optional

# 1. The Request: What React sends to FastAPI when they click "Sign In"
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 2. The Response: What FastAPI sends back to React to populate the Sidebar/Header
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    roleLabel: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    avatar: Optional[str] = None
    defaultModule: str = "dashboard"
    dashboardTitle: Optional[str] = None

    class Config:
        from_attributes = True

# 3. The Auth Package: The JWT Token + The User Profile
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse