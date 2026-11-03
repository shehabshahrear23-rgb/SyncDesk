import logging
from datetime import date, datetime, time, timezone

from sqlalchemy.orm import Session, joinedload

from app.db import models

EXPIRABLE_STATUSES = ("backlog", "inProgress", "review")
logger = logging.getLogger(__name__)
_invalid_deadline_warnings: set[int] = set()


def expire_overdue_tasks(
    db: Session,
    now: datetime | None = None,
    today: date | None = None,
) -> int:
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None or current_time.utcoffset() is None:
        raise ValueError("Deadline checks require a timezone-aware current time.")
    current_time = current_time.astimezone(timezone.utc)
    if today is not None:
        current_time = datetime.combine(today, time.min, tzinfo=timezone.utc)
    tasks = db.query(models.Task).options(
        joinedload(models.Task.assignee),
    ).filter(
        models.Task.status.in_(EXPIRABLE_STATUSES),
        models.Task.due_date != "",
    ).all()

    expired_count = 0
    for task in tasks:
        try:
            deadline = datetime.fromisoformat(task.due_date.replace("Z", "+00:00"))
            if deadline.tzinfo is None or deadline.utcoffset() is None:
                raise ValueError("Stored deadline is missing its timezone.")
            deadline = deadline.astimezone(timezone.utc)
        except ValueError:
            try:
                legacy_date = date.fromisoformat(task.due_date)
            except ValueError:
                try:
                    legacy_date = datetime.strptime(task.due_date, "%b %d, %Y").date()
                except ValueError:
                    if task.id not in _invalid_deadline_warnings:
                        logger.warning("Task %s has an unsupported legacy deadline %r; it was not expired.", task.id, task.due_date)
                        _invalid_deadline_warnings.add(task.id)
                    continue
            deadline = datetime.combine(legacy_date, time.max, tzinfo=timezone.utc)
        if deadline >= current_time:
            continue

        task.status = "expired"
        db.add(models.TaskHistory(
            task_id=task.id,
            actor_name="System",
            event_type="expired",
            note=f"Deadline passed on {task.due_date} before the task was approved.",
        ))
        db.add(models.Notification(
            user_id=task.assignee_id,
            message=f'The task "{task.title}" ended because its deadline passed.',
        ))
        if task.assigned_by_id is not None and task.assigned_by_id != task.assignee_id:
            db.add(models.Notification(
                user_id=task.assigned_by_id,
                message=f'The task "{task.title}" assigned to {task.assignee.name} ended after its deadline.',
            ))
        expired_count += 1

    if expired_count:
        db.commit()
    return expired_count
