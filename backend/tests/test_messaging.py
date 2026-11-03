import unittest

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user, get_db
from app.api.endpoints.messaging import router
from app.db import models
from app.db.session import Base
from app.services.messaging_encryption import decrypt_message


class MessagingApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)
        Base.metadata.create_all(bind=self.engine)
        with self.session_factory() as db:
            db.add_all([
                models.User(name="Admin Sender", email="admin@example.com", role="admin", hashed_password="hash"),
                models.User(name="Employee Receiver", email="employee@example.com", role="employee", hashed_password="hash"),
                models.User(name="HR Receiver", email="hr@example.com", role="hr", hashed_password="hash"),
            ])
            db.commit()

        self.actor_id = 1
        app = FastAPI()

        def override_db():
            with self.session_factory() as db:
                yield db

        def override_user(db: Session = Depends(get_db)):
            return db.get(models.User, self.actor_id)

        app.include_router(router, prefix="/api/messaging")
        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = override_user
        self.client = TestClient(app)
        self.actor_id = 1

    def tearDown(self):
        self.client.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    @staticmethod
    def _message_body(content):
        return {"content": content}

    def test_direct_message_is_encrypted_and_notifies_unenrolled_recipient(self):
        conversation = self.client.post("/api/messaging/conversations/direct/2")
        self.assertEqual(conversation.status_code, 200, conversation.text)
        conversation_id = conversation.json()["id"]
        content = "Offline recipient message"

        sent = self.client.post(
            f"/api/messaging/conversations/{conversation_id}/messages",
            json=self._message_body(content),
        )
        self.assertEqual(sent.status_code, 201, sent.text)
        self.assertEqual(sent.json()["content"], content)
        self.assertIsNone(sent.json()["ciphertext"])

        with self.session_factory() as db:
            notification = db.query(models.Notification).filter_by(user_id=2).one()
            stored_message = db.query(models.Message).one()
            self.assertEqual(notification.message, "New message from Admin Sender")
            self.assertEqual(stored_message.key_envelopes, [])
            self.assertNotEqual(stored_message.ciphertext, content)
            self.assertEqual(decrypt_message(stored_message.nonce, stored_message.ciphertext), content)

        self.actor_id = 2
        received = self.client.get(f"/api/messaging/conversations/{conversation_id}/messages")
        self.assertEqual(received.status_code, 200, received.text)
        self.assertEqual(received.json()[0]["content"], content)
        conversation_list = self.client.get("/api/messaging/conversations")
        direct = next(item for item in conversation_list.json() if item["id"] == conversation_id)
        self.assertEqual(direct["unread_count"], 1)
        marked = self.client.post(
            f"/api/messaging/conversations/{conversation_id}/read",
            json={"message_id": sent.json()["id"]},
        )
        self.assertEqual(marked.status_code, 200, marked.text)
        refreshed = self.client.get("/api/messaging/conversations")
        direct = next(item for item in refreshed.json() if item["id"] == conversation_id)
        self.assertEqual(direct["unread_count"], 0)

        self.actor_id = 3
        forbidden = self.client.get(f"/api/messaging/conversations/{conversation_id}/messages")
        self.assertEqual(forbidden.status_code, 403)

    def test_group_and_broadcast_permissions_and_notifications(self):
        group_response = self.client.post(
            "/api/messaging/groups",
            json={"name": "Launch Team", "member_ids": [2]},
        )
        self.assertEqual(group_response.status_code, 201, group_response.text)
        group = group_response.json()

        self.actor_id = 2
        forbidden_group_send = self.client.post(
            f"/api/messaging/conversations/{group['id']}/messages",
            json=self._message_body("Group message"),
        )
        self.assertEqual(forbidden_group_send.status_code, 201, forbidden_group_send.text)
        self.assertEqual(forbidden_group_send.json()["content"], "Group message")
        with self.session_factory() as db:
            group_notification = db.query(models.Notification).filter_by(user_id=1).one()
            self.assertEqual(group_notification.message, "New message in Launch Team")

        forbidden_group_management = self.client.patch(
            f"/api/messaging/conversations/{group['id']}",
            json={"name": "Renamed by member"},
        )
        self.assertEqual(forbidden_group_management.status_code, 403)

        self.actor_id = 1
        conversations = self.client.get("/api/messaging/conversations")
        broadcast = next(item for item in conversations.json() if item["kind"] == "broadcast")

        self.actor_id = 2
        forbidden_broadcast = self.client.post(
            f"/api/messaging/conversations/{broadcast['id']}/messages",
            json=self._message_body("Forbidden broadcast"),
        )
        self.assertEqual(forbidden_broadcast.status_code, 403)

        self.actor_id = 1
        posted = self.client.post(
            f"/api/messaging/conversations/{broadcast['id']}/messages",
            json=self._message_body("Company update"),
        )
        self.assertEqual(posted.status_code, 201, posted.text)
        self.assertEqual(posted.json()["content"], "Company update")
        with self.session_factory() as db:
            notifications = db.query(models.Notification).filter_by(user_id=2).all()
            self.assertTrue(any(note.message == "New message in Company Broadcast" for note in notifications))

    def test_legacy_end_to_end_encrypted_message_remains_available(self):
        conversation = self.client.post("/api/messaging/conversations/direct/2")
        conversation_id = conversation.json()["id"]
        with self.session_factory() as db:
            db.add(models.Message(
                conversation_id=conversation_id,
                sender_id=1,
                nonce="n" * 16,
                ciphertext="Y2lwaGVydGV4dA==",
                key_envelopes=[{"recipient_id": 2, "encrypted_key": "k" * 200}],
            ))
            db.commit()

        self.actor_id = 2
        messages = self.client.get(f"/api/messaging/conversations/{conversation_id}/messages")
        self.assertEqual(messages.status_code, 200, messages.text)
        self.assertEqual(messages.json()[0]["ciphertext"], "Y2lwaGVydGV4dA==")
        self.assertEqual(messages.json()[0]["key_envelopes"][0]["recipient_id"], 2)


if __name__ == "__main__":
    unittest.main()
