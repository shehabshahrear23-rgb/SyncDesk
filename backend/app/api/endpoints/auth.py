from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.deps import get_db
from app.db.models import User
from app.schemas.user import UserLogin, Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Look up the user in the database by their email
    user = db.query(User).filter(User.email == user_credentials.email.lower()).first()
    
    # 2. Verify the user exists and the password matches
    # (Note: For this sprint, we are checking plain text to ensure the connection works. 
    # In Sprint 2, we will wrap this in bcrypt hashing).
    if not user or user.hashed_password != user_credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )
    
    # 3. Create a session token (Mocked JWT for Sprint 1)
    access_token = f"syncdesk_token_mock_{user.id}"
    
    # 4. Return the data package exactly as React expects it
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# --- TEMPORARY ROUTE FOR SPRINT 1 TESTING ---
@router.post("/register-test-user")
def create_test_user(db: Session = Depends(get_db)):
    """Run this once in the Swagger UI to create your CEO test account."""
    existing_user = db.query(User).filter(User.email == "ceo@syncdesk.io").first()
    if existing_user:
        return {"msg": "Test user already exists!"}
        
    test_user = User(
        email="ceo@syncdesk.io",
        hashed_password="1234",  # Matches your React mock data
        name="Elena Rostova",
        role="ceo",
        roleLabel="Executive / CEO",
        department="Executive",
        title="Chief Executive Officer",
        avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        defaultModule="dashboard",
        dashboardTitle="SyncDesk Executive Command & Digital Twin"
    )
    db.add(test_user)
    db.commit()
    return {"msg": "Test CEO user created successfully!"}