from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# 1. The Request: What React sends to FastAPI when they click "Sign In"
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 2. The Response: What FastAPI sends back to React to populate the Sidebar/Header
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    
    # RBAC & Enterprise Roles
    role: str
    roleLabel: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    
    # Profile & Org Chart (New)
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    manager_id: Optional[int] = None
    
    # Presence & Localization (New)
    status: str
    timezone: str
    last_active: Optional[datetime] = None
    
    # UI Preferences
    defaultModule: str = "dashboard"
    dashboardTitle: Optional[str] = None

    class Config:
        from_attributes = True

# 3. The Auth Package: The JWT Token + The User Profile
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# 4. The Request: What React sends to update a profile in the Directory (New)
class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    manager_id: Optional[int] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None