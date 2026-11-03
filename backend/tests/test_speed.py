
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models
import seed


@pytest.fixture
def test_database(monkeypatch):

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        expire_on_commit=False
    )

    models.Base.metadata.create_all(bind=engine)

    monkeypatch.setattr(seed, "engine", engine)
    monkeypatch.setattr(seed, "SessionLocal", TestingSessionLocal)

    monkeypatch.setattr(
        seed, "add_sample_documents", lambda db: 0
    )
    monkeypatch.setattr(seed, "SAMPLE_DOCUMENTS", [])

    yield TestingSessionLocal

    models.Base.metadata.drop_all(bind=engine)
    engine.dispose()


def test_seed_creates_users_and_notifications(test_database):

    seed.seed()

    with test_database() as db:
        users = db.query(models.User).all()
        notifications = db.query(models.Notification).all()

        assert len(users) == 13
        assert len(notifications) == 13


def test_seed_assigns_correct_roles_and_timezone(test_database):

    seed.seed()

    with test_database() as db:
        admin = db.query(models.User).filter_by(
            email="admin@syncdesk.com"
        ).one()

        assert admin.role == "admin"
        assert admin.timezone == "Asia/Dhaka"


def test_seed_hashes_password(test_database):

    seed.seed()

    with test_database() as db:
        user = db.query(models.User).filter_by(
            email="admin@syncdesk.com"
        ).one()

        assert user.hashed_password != "admin123"


def test_seed_does_not_create_duplicate_users(test_database):

    seed.seed()
    seed.seed()

    with test_database() as db:
        users = db.query(models.User).all()

        assert len(users) == 13
