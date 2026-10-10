from datetime import datetime
from sqlalchemy import Boolean, Column, Date, Integer, JSON, String, ForeignKey, DateTime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="employee") 
    department = Column(String, nullable=True)  # NEW: e.g., "HR", "IT", "Legal"
    hashed_password = Column(String, nullable=False)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True) # This now matches User.department
    linked_context = Column(JSON, nullable=False, default=list)
    upload_date = Column(Date, nullable=False)
    file_size = Column(String, nullable=False)
    author = Column(String, nullable=True) # Stores email
    starred = Column(Boolean, nullable=False, default=False)
    file_path = Column(String, nullable=True)
    content_type = Column(String, nullable=True)
    permitted_users = Column(JSON, nullable=False, default=list)

# NEW: Tracks requests to access restricted files
class AccessRequest(Base):
    __tablename__ = "access_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    requester_email = Column(String, nullable=False)
    status = Column(String, default="pending") # "pending", "approved", "rejected"

# NEW: In-app notification system
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow) # FIXME Need to fix the utcnow.