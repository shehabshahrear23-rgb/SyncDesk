from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import admin, ai, auth, documents, notifications, stats, users  # Removed items
from app.core.config import settings
from app.db import models
from app.db.sample_documents import add_sample_documents_if_empty
from app.db.session import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)  # create the tables (in production, use Alembic)

with SessionLocal() as _db:  # a brand-new (empty) Document Vault gets the sample documents
    add_sample_documents_if_empty(_db)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(  # CORS for the frontend (in production, replace "*" with the frontend URL)
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# (url name, module): every router is mounted at /api/<url name>
# Removed ("items", items) from the list below
for name, module in [("auth", auth), ("admin", admin), ("admin", stats),
                     ("ai", ai), ("documents", documents), ("users", users), ("notifications", notifications)]:
    app.include_router(module.router, prefix=f"/api/{name}", tags=[name])

@app.get("/")
def root():
    return {"message": "Welcome to the API. Go to /docs for the Swagger UI."}