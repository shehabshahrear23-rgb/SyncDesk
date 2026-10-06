import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from fastapi.security import OAuth2PasswordRequestForm
from app.api.deps import get_db, SECRET_KEY, ALGORITHM
from app.db.models import User
from app.schemas.user import UserLogin, Token

router = APIRouter()

# --- Security Configuration ---
# Tells passlib to use bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Routes ---

@router.post("/login", response_model=Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Look up the user in the database
    # Note: OAuth2 strictly uses the field name 'username', so we map that to our email column
    user = db.query(User).filter(User.email == user_credentials.username.lower()).first()
    
    # 2. Verify the user exists AND the bcrypt hashed password matches
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )
    
    # 3. Create the real JWT session token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    # 4. Return the data package exactly as React expects it
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# --- TEMPORARY ROUTE FOR TESTING ---
@router.post("/register-test-user")
def create_test_user(db: Session = Depends(get_db)):
    """Run this once in the Swagger UI to create your CEO test account."""
    existing_user = db.query(User).filter(User.email == "ceo@syncdesk.io").first()
    if existing_user:
        return {"msg": "Test user already exists!"}
        
    # We MUST hash the password before inserting it into the database now!
    hashed_pw = get_password_hash("1234")
        
    test_user = User(
        email="ceo@syncdesk.io",
        hashed_password=hashed_pw,
        name="Elena Rostova",
        role="ceo",
        roleLabel="Executive / CEO",
        department="Executive",
        title="Chief Executive Officer",
        avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        defaultModule="dashboard",
        dashboardTitle="SyncDesk Executive Command & Digital Twin",
        status="online" # Initialize with an online status
    )
    db.add(test_user)
    db.commit()
    return {"msg": "Test CEO user created successfully with hashed password!"}