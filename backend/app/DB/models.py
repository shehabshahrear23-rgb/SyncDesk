from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, String, text
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="employee")  # ceo | admin | hr | team_lead | project_manager | employee
    hashed_password = Column(String, nullable=False)
    # Presence (Ticket 2): who is online / away / offline, and where they are in the world
    status = Column(String, nullable=False, default="offline", server_default=text("'offline'"))  # online | away | offline
    timezone = Column(String, nullable=False, default="UTC", server_default=text("'UTC'"))  # IANA name, e.g. Asia/Dhaka
    last_active = Column(DateTime, nullable=True)  # UTC time of the last heartbeat

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # e.g. HR, IT, Legal, SOPs
    linked_context = Column(JSON, nullable=False, default=list)  # list of strings
    upload_date = Column(Date, nullable=False)
    file_size = Column(String, nullable=False)  # display text, e.g. "2.4 MB"
    author = Column(String, nullable=True)
    starred = Column(Boolean, nullable=False, default=False)
    is_sample = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    storage_name = Column(String, nullable=True)

class DocumentAccess(Base):
    __tablename__ = "document_access"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

class DocumentStar(Base):
    __tablename__ = "document_stars"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    project = Column(String(120), nullable=False)
    category = Column(String(20), nullable=False, default="sprint")
    status = Column(String(20), nullable=False, default="backlog")
    priority = Column(String(20), nullable=False, default="Medium")
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_by_name = Column(String(80), nullable=False)
    description = Column(String(2000), nullable=False, default="")
    due_date = Column(String(80), nullable=False, default="")
    tags = Column(JSON, nullable=False, default=list)
    progress = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = relationship("User", foreign_keys=[assignee_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    history = relationship(
        "TaskHistory",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="(TaskHistory.created_at, TaskHistory.id)",
    )


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_name = Column(String(80), nullable=False)
    event_type = Column(String(30), nullable=False)
    note = Column(String(2000), nullable=False, default="")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    task = relationship("Task", back_populates="history")
    actor = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)