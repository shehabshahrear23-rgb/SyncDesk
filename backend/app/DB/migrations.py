from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.db.models import DocumentStar
from app.db.sample_documents import SAMPLE_DOCUMENTS


def upgrade_document_schema(engine: Engine) -> None:
    columns = {column["name"] for column in inspect(engine).get_columns("documents")}
    additions = {
        "owner_id": "INTEGER REFERENCES users(id) ON DELETE SET NULL",
        "is_sample": "BOOLEAN NOT NULL DEFAULT false",
        "storage_name": "VARCHAR",
    }

    with engine.begin() as connection:
        DocumentStar.__table__.create(connection, checkfirst=True)

        for name, definition in additions.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE documents ADD COLUMN {name} {definition}"))

        for sample in SAMPLE_DOCUMENTS:
            connection.execute(
                text("UPDATE documents SET is_sample = true WHERE title = :title"),
                {"title": sample["title"]},
            )
