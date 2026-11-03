from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db import models
from app.schemas.user import ProfileUpdate, StatusUpdate, UserOut
from app.services.profile_pictures import (
    MAX_PROFILE_PICTURE_BYTES,
    InvalidProfilePicture,
    save_profile_picture,
)

router = APIRouter()

@router.get("/directory", response_model=list[UserOut])
def read_directory(db: Session = Depends(get_db), me: models.User = Depends(get_current_user)):
    return db.query(models.User).filter(models.User.id != me.id).order_by(
        models.User.name, models.User.id
    ).all()

def _save(db: Session, user: models.User, changes: dict, notification_message: str | None = None) -> models.User:
    for field, value in changes.items():
        if value is not None:  # None means "leave this field as it is"
            setattr(user, field, value)
    if notification_message:
        db.add(models.Notification(user_id=user.id, message=notification_message))
    db.commit()
    db.refresh(user)
    return user

@router.put("/me/status", response_model=UserOut)  # heartbeat; the user comes from the JWT, never the body
def update_my_status(body: StatusUpdate, db: Session = Depends(get_db), me: models.User = Depends(get_current_user)):
    return _save(db, me, {"status": body.status, "last_active": datetime.utcnow(), "timezone": body.timezone})

@router.patch("/me", response_model=UserOut)  # no role field, so a user can never change their own role
def update_my_profile(body: ProfileUpdate, db: Session = Depends(get_db), me: models.User = Depends(get_current_user)):
    return _save(db, me, body.model_dump(exclude_unset=True), "Your profile details were updated.")

@router.post("/me/avatar", response_model=UserOut)
async def upload_my_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    content = await file.read(MAX_PROFILE_PICTURE_BYTES + 1)
    await file.close()
    try:
        save_profile_picture(me.id, content)
    except InvalidProfilePicture as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    db.add(models.Notification(user_id=me.id, message="Your profile picture was updated."))
    db.commit()
    db.refresh(me)
    return me