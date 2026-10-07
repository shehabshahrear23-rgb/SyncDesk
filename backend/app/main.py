from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import items, auth, admin, ai, documents
from app.core.config import settings
from app.db import models
from app.db.sample_documents import add_sample_documents_if_empty
from app.db.session import SessionLocal, engine

# Create tables, including "users" and "documents" (In production, use Alembic)
models.Base.metadata.create_all(bind=engine)

# A brand-new (empty) Document Vault gets the sample documents, so it is never blank
_db = SessionLocal()
try:
    add_sample_documents_if_empty(_db)
finally:
    _db.close()

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/")
def root():
    return {"message": "Welcome to the API. Go to /docs for the Swagger UI."}