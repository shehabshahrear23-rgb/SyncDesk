from typing import List

import os

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db import models
from app.schemas.notification import NotificationOut, TestNotification

router = APIRouter()

@router.get("", response_model=List[NotificationOut])
def read_my_notifications(
    unread: bool = False,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    query = db.query(models.Notification).filter(models.Notification.user_id == me.id)
    if unread:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc(), models.Notification.id.desc()).all()


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == me.id,
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


# Test-only sender. Anyone who knows the key can create a notification for a user.
# Set NOTIFY_TEST_KEY in the environment to change it, and remove this route before real use.
TEST_KEY = os.getenv("NOTIFY_TEST_KEY", "syncdesk-test-key")

@router.post("/test", response_model=NotificationOut, status_code=201)
def send_test_notification(
    body: TestNotification,
    x_api_key: str = Header(default=""),
    db: Session = Depends(get_db),
):
    if x_api_key != TEST_KEY:
        raise HTTPException(status_code=401, detail="Wrong or missing X-API-Key")
    target = db.query(models.User).filter(models.User.email == body.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="No user with that email")
    note = models.Notification(user_id=target.id, message=body.message)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note