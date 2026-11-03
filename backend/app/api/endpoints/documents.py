from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db import models
from app.schemas.document import (
    DocumentAccessUpdate,
    DocumentCreate,
    DocumentOut,
    DocumentUserOut,
)
from app.services.documents import (
    ALLOWED_DOCUMENT_EXTENSIONS,
    DOCUMENT_STORAGE_DIR,
    MAX_DOCUMENT_BYTES,
    InvalidDocument,
    delete_document_file,
    save_document,
)

router = APIRouter()


def _accessible_document(db: Session, document_id: int, user: models.User) -> models.Document:
    document = db.get(models.Document, document_id)
    if document is None:
        raise HTTPException(404, "Document not found")
    if document.owner_id == user.id:
        return document

    granted = db.query(models.DocumentAccess).filter_by(
        document_id=document.id, user_id=user.id
    ).first()
    if granted:
        return document

    has_uploaded_documents = db.query(models.Document.id).filter(
        models.Document.is_sample.is_(False)
    ).first() is not None
    if document.is_sample and not has_uploaded_documents:
        return document
    raise HTTPException(404, "Document not found")


def _owned_document(db: Session, document_id: int, user: models.User) -> models.Document:
    document = db.query(models.Document).filter_by(
        id=document_id, owner_id=user.id, is_sample=False
    ).first()
    if document is None:
        raise HTTPException(404, "Document not found")
    return document


def _document_out(document: models.Document, starred: bool = False) -> DocumentOut:
    return DocumentOut.model_validate(document).model_copy(update={"starred": starred})


@router.get("", response_model=List[DocumentOut])
def read_documents(
    search: str = "",
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    has_uploaded_documents = db.query(models.Document.id).filter(
        models.Document.is_sample.is_(False)
    ).first() is not None
    granted_document = db.query(models.DocumentAccess.document_id).filter(
        models.DocumentAccess.document_id == models.Document.id,
        models.DocumentAccess.user_id == me.id,
    ).exists()
    visibility = or_(
        models.Document.owner_id == me.id,
        granted_document,
    )
    if not has_uploaded_documents:
        visibility = or_(visibility, models.Document.is_sample.is_(True))

    query = db.query(models.Document).filter(
        visibility,
        models.Document.title.ilike(f"%{search.strip()}%"),
    )
    if category:
        query = query.filter(models.Document.category == category)
    documents = query.order_by(models.Document.upload_date.desc(), models.Document.id.desc()).all()
    starred_ids = {
        row.document_id
        for row in db.query(models.DocumentStar.document_id).filter_by(user_id=me.id).all()
    }
    return [_document_out(document, document.id in starred_ids) for document in documents]


@router.get("/users", response_model=List[DocumentUserOut])
def read_users_for_sharing(
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    return db.query(models.User).filter(models.User.id != me.id).order_by(
        models.User.name, models.User.id
    ).limit(500).all()


@router.get("/{document_id}/access", response_model=List[DocumentUserOut])
def read_document_access(
    document_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    document = _owned_document(db, document_id, me)
    return db.query(models.User).join(
        models.DocumentAccess, models.DocumentAccess.user_id == models.User.id
    ).filter(models.DocumentAccess.document_id == document.id).order_by(
        models.User.name, models.User.id
    ).all()


@router.put("/{document_id}/access", response_model=List[DocumentUserOut])
def update_document_access(
    document_id: int,
    body: DocumentAccessUpdate,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    document = _owned_document(db, document_id, me)
    requested_ids = set(body.user_ids) - {me.id}
    users = db.query(models.User).filter(models.User.id.in_(requested_ids)).all() if requested_ids else []
    if len(users) != len(requested_ids):
        raise HTTPException(400, "One or more selected users no longer exist.")

    existing = db.query(models.DocumentAccess).filter_by(document_id=document.id).all()
    existing_by_user = {access.user_id: access for access in existing}
    for user_id, access in existing_by_user.items():
        if user_id not in requested_ids:
            db.delete(access)

    users_by_id = {user.id: user for user in users}
    for user_id in requested_ids:
        if user_id not in existing_by_user:
            db.add(models.DocumentAccess(document_id=document.id, user_id=user_id))
            db.add(models.Notification(
                user_id=user_id,
                message=f"{me.name} gave you access to the document: {document.title}",
            ))

    db.commit()
    return [users_by_id[user_id] for user_id in sorted(requested_ids, key=lambda uid: users_by_id[uid].name.lower())]


@router.patch("/{document_id}/star", response_model=DocumentOut)
def toggle_star(
    document_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    document = _accessible_document(db, document_id, me)
    star = db.get(models.DocumentStar, (document.id, me.id))
    if star is None:
        db.add(models.DocumentStar(document_id=document.id, user_id=me.id))
        starred = True
    else:
        db.delete(star)
        starred = False
    db.commit()
    return _document_out(document, starred)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    document = _accessible_document(db, document_id, me)
    if not document.storage_name:
        raise HTTPException(404, "This sample document has no uploaded file.")
    path = DOCUMENT_STORAGE_DIR / Path(document.storage_name).name
    if not path.is_file():
        raise HTTPException(404, "The document file is no longer available.")
    return FileResponse(path, filename=document.title, media_type="application/octet-stream")


@router.post("", response_model=DocumentOut, status_code=201)
async def create_document(
    file: UploadFile = File(...),
    title: str = Form(..., min_length=1, max_length=200),
    category: str = Form(..., min_length=1, max_length=60),
    linked_context: str = Form(""),
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    if db.query(models.Document.id).count() >= 500:
        raise HTTPException(400, "The document library is full.")

    filename = file.filename or ""
    if Path(filename).suffix.lower() not in ALLOWED_DOCUMENT_EXTENSIONS:
        await file.close()
        raise HTTPException(400, "Upload a PDF, TXT, DOC, or DOCX file.")
    content = await file.read(MAX_DOCUMENT_BYTES + 1)
    await file.close()
    if len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(400, "Documents must be 25 MB or smaller.")

    linked_tags = []
    for tag in linked_context.split(","):
        cleaned = tag.strip()[:40]
        if cleaned and cleaned.lower() not in {existing.lower() for existing in linked_tags}:
            linked_tags.append(cleaned)
    if len(linked_tags) > 8:
        raise HTTPException(422, "Please use at most 8 linked context tags.")

    size = len(content)
    file_size = f"{max(1, round(size / 1024))} KB" if size < 1024 * 1024 else f"{size / (1024 * 1024):.1f} MB"
    try:
        details = DocumentCreate.model_validate({
            "title": title,
            "category": category,
            "linked_context": linked_tags,
            "file_size": file_size,
            "author": me.name,
        })
    except ValidationError as error:
        raise HTTPException(422, detail=error.errors()) from error

    try:
        storage_name = save_document(content, filename)
    except InvalidDocument as error:
        raise HTTPException(400, str(error)) from error

    db_document = models.Document(
        **details.model_dump(),
        owner_id=me.id,
        upload_date=date.today(),
        is_sample=False,
        storage_name=storage_name,
    )
    try:
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
    except Exception:
        db.rollback()
        delete_document_file(storage_name)
        raise
    return db_document
