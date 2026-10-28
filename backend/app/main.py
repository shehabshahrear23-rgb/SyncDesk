import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import admin, ai, auth, documents, notifications, stats, tasks, users  # Removed items
from app.core.config import settings
from app.db import models
from app.db.migrations import upgrade_document_schema
from app.db.sample_documents import add_sample_documents_if_empty
from app.db.session import SessionLocal, engine
from app.services.profile_pictures import PROFILE_PICTURES_DIR, ensure_profile_picture_storage
from app.services.task_lifecycle import expire_overdue_tasks

logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)  # create the tables (in production, use Alembic)
upgrade_document_schema(engine)
ensure_profile_picture_storage()

with SessionLocal() as _db:  # a brand-new (empty) Document Vault gets the sample documents
    add_sample_documents_if_empty(_db)


async def _deadline_monitor() -> None:
    while True:
        with SessionLocal() as db:
            try:
                expire_overdue_tasks(db)
            except Exception:
                logger.exception("Could not process overdue tasks.")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    monitor = asyncio.create_task(_deadline_monitor())
    try:
        yield
    finally:
        monitor.cancel()
        try:
            await monitor
        except asyncio.CancelledError:
            pass


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.mount("/media/pp", StaticFiles(directory=str(PROFILE_PICTURES_DIR)), name="profile-pictures")

app.add_middleware(  # CORS for the frontend (in production, replace "*" with the frontend URL)
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# (url name, module): every router is mounted at /api/<url name>
# Removed ("items", items) from the list below
for name, module in [("auth", auth), ("admin", admin), ("admin", stats),
                     ("ai", ai), ("documents", documents), ("users", users), ("notifications", notifications),
                     ("tasks", tasks)]:
    app.include_router(module.router, prefix=f"/api/{name}", tags=[name])

@app.get("/")
def root():
    return {"message": "Welcome to the API. Go to /docs for the Swagger UI."}