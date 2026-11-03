from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./syncdesk.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

router = APIRouter(prefix="/api/presence", tags=["Presence"])

class UserPresence(Base):
    __tablename__ = "user_presence"

    user_id = Column(String, primary_key=True, index=True)
    status = Column(String(10), nullable=False, default="offline")
    timezone_name = Column(String(64), nullable=False, default="UTC")
    last_active = Column(DateTime, nullable=True)

class PresenceUpdate(BaseModel):
    user_id: str
    status: Literal["online", "away", "offline"]
    timezone: str = "UTC"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.on_event("startup")
def initialize_presence_table():
    Base.metadata.create_all(bind=engine)

@router.put("/status")
def update_presence(payload: PresenceUpdate, db: Session = Depends(get_db)):
    user = db.query(UserPresence).filter(UserPresence.user_id == payload.user_id).first()
    if user is None:
        user = UserPresence(user_id=payload.user_id)
        db.add(user)

    user.status = payload.status
    user.timezone_name = payload.timezone
    user.last_active = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(user)

    return {
        "user_id": user.user_id,
        "status": user.status,
        "timezone": user.timezone_name,
        "last_active": user.last_active,
    }

@router.get("/{user_id}")
def get_presence(user_id: str, db: Session = Depends(get_db)):
    user = db.query(UserPresence).filter(UserPresence.user_id == user_id).first()
    if user is None:
        return {"user_id": user_id, "status": "offline", "timezone": "UTC", "last_active": None}

    return {
        "user_id": user.user_id,
        "status": user.status,
        "timezone": user.timezone_name,
        "last_active": user.last_active,
    }
