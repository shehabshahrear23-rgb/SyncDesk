from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename =from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, String, Text, text
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


class UserEncryptionKey(Base):
    __tablename__ = "user_encryption_keys"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    public_key = Column(Text, nullable=False)
    encrypted_private_key = Column(Text, nullable=False)
    salt = Column(String(64), nullable=False)
    nonce = Column(String(64), nullable=False)
    kdf_iterations = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(20), nullable=False)  # direct | group | broadcast
    name = Column(String(100), nullable=False, default="")
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    unique_key = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_read_message_id = Column(Integer, nullable=False, default=0, server_default=text("0"))


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    nonce = Column(String(64), nullable=False)
    ciphertext = Column(Text, nullable=False)
    key_envelopes = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True) Column(String(255), nullable=False)
    filepath = Column(String(1024), nullable=False)
    size = Column(Integer, nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False, default="General")
    required_role_level = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    uploader = relationship("User", back_populates="uploaded_files")
