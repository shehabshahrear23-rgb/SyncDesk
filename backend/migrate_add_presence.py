"""One-time migration for Ticket 2: adds status, timezone and last_active to the users table.

Run from the backend folder (the folder that holds syncdesk.db):

    python migrate_add_presence.py

Safe to run twice: a column that already exists is skipped. Existing rows keep
all their data and get status='offline', timezone='UTC'.
"""
import sqlite3

DB_FILE = "syncdesk.db"

COLUMNS = [
    ("status", "VARCHAR NOT NULL DEFAULT 'offline'"),
    ("timezone", "VARCHAR NOT NULL DEFAULT 'UTC'"),
    ("last_active", "DATETIME"),
]

conn = sqlite3.connect(DB_FILE)
try:
    existing = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
    if not existing:
        print("No 'users' table yet - nothing to migrate. Start the backend once and it will be created.")
    for name, definition in COLUMNS:
        if existing and name not in existing:
            conn.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")
            print(f"added   users.{name}")
        elif existing:
            print(f"skip    users.{name} (already there)")
    conn.commit()
finally:
    conn.close()
