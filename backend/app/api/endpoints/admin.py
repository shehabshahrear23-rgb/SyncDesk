import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin
from app.core.security import hash_password
from app.db import models
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.documents import delete_document_file
from app.services.profile_pictures import delete_profile_picture

router = APIRouter(dependencies=[Depends(require_admin)])  # every route is admin-only
logger = logging.getLogger(__name__)

def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(404, "User not found")
    return user

@router.get("/users", response_model=List[UserOut])
def read_users(search: Optional[str] = Query(None, max_length=100), skip: int = Query(0, ge=0),
               limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    query = db.query(models.User)
    term = (search or "").strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    if term:  # % and _ typed by the user are treated as plain characters
        query = query.filter(or_(models.User.name.ilike(f"%{term}%", escape="\\"),
                                 models.User.email.ilike(f"%{term}%", escape="\\")))
    return query.order_by(models.User.name, models.User.id).offset(skip).limit(limit).all()

@router.post("/users", response_model=UserOut, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(409, "An account with this email already exists.")
    db_user = models.User(**user.model_dump(exclude={"password"}), hashed_password=hash_password(user.password))
    db.add(db_user)
    db.flush()
    db.add(models.Notification(
        user_id=db_user.id,
        message=f"Welcome to SyncDesk, {db_user.name}! Your {db_user.role} account is ready. We're glad to have you on the team.",
    ))
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, changes: UserUpdate, db: Session = Depends(get_db),
                admin: models.User = Depends(require_admin)):
    user = get_user_or_404(db, user_id)
    if changes.role not in (None, user.role) and user.id == admin.id:
        raise HTTPException(400, "You cannot change your own role. Ask another admin to do it.")
    for field, value in changes.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    user = get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise HTTPException(400, "You cannot delete your own account.")
    owned_documents = db.query(models.Document).filter(models.Document.owner_id == user.id).all()
    owned_document_ids = [document.id for document in owned_documents]
    storage_names = [document.storage_name for document in owned_documents if document.storage_name]
    db.query(models.DocumentStar).filter(models.DocumentStar.user_id == user.id).delete(
        synchronize_session=False
    )
    if owned_document_ids:
        db.query(models.DocumentStar).filter(
            models.DocumentStar.document_id.in_(owned_document_ids)
        ).delete(synchronize_session=False)
    for document in owned_documents:
        db.query(models.DocumentAccess).filter(
            models.DocumentAccess.document_id == document.id
        ).delete(synchronize_session=False)
        db.delete(document)
    db.query(models.DocumentAccess).filter(
        models.DocumentAccess.user_id == user.id
    ).delete(synchronize_session=False)
    db.query(models.Notification).filter(models.Notification.user_id == user.id).delete(synchronize_session=False)
    db.query(models.Task).filter(models.Task.assignee_id == user.id).delete(synchronize_session=False)
    db.query(models.Task).filter(models.Task.assigned_by_id == user.id).update(
        {models.Task.assigned_by_id: None},
        synchronize_session=False,
    )
    db.delete(user)
    db.commit()
    for storage_name in storage_names:
        try:
            delete_document_file(storage_name)
        except OSError:
            logger.exception("Could not remove a document file owned by deleted user %s", user_id)
    try:
        delete_profile_picture(user_id)
    except OSError:
        logger.exception("Could not remove profile picture for deleted user %s", user_id)
    return Response(status_code=204)