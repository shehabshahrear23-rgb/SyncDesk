from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db import models
from app.schemas.user import StatusUpdate, UserOut

router = APIRouter()

@router.put("/me/status", response_model=UserOut)
def update_my_status(
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Heartbeat. Sets the logged-in user's status and refreshes last_active.
    The user always comes from the JWT, never from the request body, so nobody
    can change another person's status."""
    current_user.status = body.status
    current_user.last_active = datetime.utcnow()
    if body.timezone:
        current_user.timezone = body.timezone
    db.commit()
    db.refresh(current_user)
    return current_user
