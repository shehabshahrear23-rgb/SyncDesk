"""Seed sample data for local testing: user accounts and Document Vault documents.

Run from the backend folder (the same folder you start uvicorn from), so it
writes to the same syncdesk.db the API reads:

    cd backend
    python seed.py

Safe to re-run: users whose email already exists and documents whose title
already exists are skipped.
"""
from app.core.security import hash_password
from app.db import models
from app.db.sample_documents import SAMPLE_DOCUMENTS, add_sample_documents
from app.db.session import SessionLocal, engine

SEED_USERS = [
    # name,              email,                    role,       password
    ("System Admin",     "admin@syncdesk.com",     "admin",    "admin123"),
    ("Hasan Rahman",     "hr@syncdesk.com",        "hr",       "hr1234"),
    ("Nadia Islam",      "nadia@syncdesk.com",     "employee", "employee123"),
    ("Tanvir Ahmed",     "tanvir@syncdesk.com",    "employee", "employee123"),
    ("Sara Chowdhury",   "sara@syncdesk.com",      "employee", "employee123"),
    ("Rafiq Hossain",    "rafiq@syncdesk.com",     "employee", "employee123"),
]

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created = 0
        for name, email, role, password in SEED_USERS:
            exists = db.query(models.User).filter(models.User.email == email).first()
            if exists:
                print(f"skip    {email} (already exists)")
                continue
            db.add(models.User(
                name=name,
                email=email,
                role=role,
                hashed_password=hash_password(password),
            ))
            created += 1
            print(f"create  {email}  role={role}  password={password}")

        db.commit()
        documents_created = add_sample_documents(db)
        print(f"\nDone. {created} user(s) created.")
        print(f"Documents: {documents_created} created, {len(SAMPLE_DOCUMENTS) - documents_created} already there.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()