from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(1024), nullable=False)
    size = Column(Integer, nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False, default="General")
    required_role_level = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    uploader = relationship("User", back_populates="uploaded_files")
