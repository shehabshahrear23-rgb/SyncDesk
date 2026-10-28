from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.db import models
from app.schemas.user import ChangePasswordRequest, LoginRequest, Token, UserOut

router = APIRouter()

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email.strip().lower()).first()
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")  # same message: emails can't be probed
    return {"access_token": create_access_token(user.id, user.role), "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/change-password")
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db),
                    me: models.User = Depends(get_current_user)):
    if not verify_password(body.current_password, me.hashed_password):
        raise HTTPException(400, "Incorrect current password")
    me.hashed_password = hash_password(body.new_password)
    db.add(models.Notification(user_id=me.id, message="Your password was changed successfully."))
    db.commit()
    return {"message": "Password updated"}