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
    # Same email and password as the "System Administrator" quick demo button on the
    # login page, so that button signs in through the backend and opens the admin console.
    ("System Administrator", "admin@syncdesk.io",  "admin",    "1234"),
    ("Hasan Rahman",     "hr@syncdesk.com",        "hr",       "hr1234"),
    ("Nadia Islam",      "nadia@syncdesk.com",     "employee", "employee123"),
    ("Tanvir Ahmed",     "tanvir@syncdesk.com",    "employee", "employee123"),
    ("Sara Chowdhury",   "sara@syncdesk.com",      "employee", "employee123"),
    ("Rafiq Hossain",    "rafiq@syncdesk.com",     "employee", "employee123"),
    # These are the demo assignees shown in the task assignment UI.
    ("Elena Rostova",    "e.rostova@syncdesk.io", "employee", "employee123"),
    ("Marcus Vance",     "m.vance@syncdesk.io",   "employee", "employee123"),
    ("Sophia Lin",       "s.lin@syncdesk.io",     "employee", "employee123"),
    ("David Kim",        "d.kim@syncdesk.io",     "employee", "employee123"),
    ("Priya Sharma",     "p.sharma@syncdesk.io",  "employee", "employee123"),
    ("Alex Chen",        "a.chen@syncdesk.io",    "employee", "employee123"),
]

# Everyone in the demo team is in Dhaka; change a user's timezone later with the admin API.
DEFAULT_TIMEZONE = "Asia/Dhaka"

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
            user = models.User(
                name=name,
                email=email,
                role=role,
                hashed_password=hash_password(password),
                timezone=DEFAULT_TIMEZONE,
            )
            db.add(user)
            db.flush()
            db.add(models.Notification(
                user_id=user.id,
                message=f"Welcome to SyncDesk, {user.name}! Your {user.role} account is ready. We're glad to have you on the team.",
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