from sqlalchemy import Boolean, Column, Date, Integer, JSON, String
from app.db.session import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="employee")  # admin | hr | employee
    hashed_password = Column(String, nullable=False)

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