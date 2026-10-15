from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, String, text
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="employee")  # admin | hr | employee
    hashed_password = Column(String, nullable=False)
    # Presence (Ticket 2): who is online / away / offline, and where they are in the world
    status = Column(String, nullable=False, default="offline", server_default=text("'offline'"))  # online | away | offline
    timezone = Column(String, nullable=False, default="UTC", server_default=text("'UTC'"))  # IANA name, e.g. Asia/Dhaka
    last_active = Column(DateTime, nullable=True)  # UTC time of the last heartbeat

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # e.g. HR, IT, Legal, SOPs
    linked_context = Column(JSON, nullable=False, default=list)  # list of strings
    upload_date = Column(Date, nullable=False)
    file_size = Column(String, nullable=False)  # display text, e.g. "2.4 MB"
    author = Column(String, nullable=True)
    starred = Column(Boolean, nullable=False, default=False)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)