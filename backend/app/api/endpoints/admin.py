from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import models
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.api.deps import get_db, require_admin
from app.core.security import hash_password

# Every route in this router is admin-only
router = APIRouter(dependencies=[Depends(require_admin)])

def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/users", response_model=List[UserOut])
def read_users(
    search: Optional[str] = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List users. Optional ?search=text matches the name OR the email
    (case-insensitive, anywhere in the text). skip/limit page through the result."""
    query = db.query(models.User)

    term = (search or "").strip()
    if term:
        # Treat % and _ typed by the user as plain characters, not LIKE wildcards
        escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        query = query.filter(
            or_(
                models.User.name.ilike(pattern, escape="\\"),
                models.User.email.ilike(pattern, escape="\\"),
            )
        )

    # Sorting by name then id keeps the pages stable between requests
    return query.order_by(models.User.name, models.User.id).offset(skip).limit(limit).all()

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    db_user = models.User(
        name=user.name,
        email=user.email,
        role=user.role,
        hashed_password=hash_password(user.password),
        status=user.status,
        timezone=user.timezone,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    changes: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    user = get_user_or_404(db, user_id)

    # An admin cannot change their own role, so there is always at least one admin left
    if changes.role is not None and changes.role != user.role and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role. Ask another admin to do it.",
        )

    if changes.name is not None:
        user.name = changes.name
    if changes.role is not None:
        user.role = changes.role
    if changes.status is not None:
        user.status = changes.status
    if changes.timezone is not None:
        user.timezone = changes.timezone

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    user = get_user_or_404(db, user_id)

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)