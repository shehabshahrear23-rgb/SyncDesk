from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import models
from app.schemas.document import DocumentCreate, DocumentOut
from app.api.deps import get_db

router = APIRouter()

MAX_DOCUMENTS = 500  # simple safety limit for this development stage

# Path "" (not "/") so the URLs are exactly /api/documents, with no redirect.
# Open like /api/items: the demo accounts in the app have no login token,
# and the Document Vault is visible to every signed-in user.
@router.get("", response_model=List[DocumentOut])
def read_documents(db: Session = Depends(get_db)):
    return (
        db.query(models.Document)
        .order_by(models.Document.upload_date.desc(), models.Document.id.desc())
        .all()
    )

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    """Adds a document record (title, category, tags, author, size).
    The file's contents are not stored at this stage, only its details."""
    if db.query(models.Document).count() >= MAX_DOCUMENTS:
        raise HTTPException(status_code=400, detail="The document library is full.")

    db_document = models.Document(
        title=document.title,
        category=document.category,
        linked_context=document.linked_context,
        upload_date=date.today(),
        file_size=document.file_size,
        author=document.author,
        starred=document.starred,
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document