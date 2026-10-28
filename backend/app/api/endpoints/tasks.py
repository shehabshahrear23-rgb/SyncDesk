from typing import List
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import get_current_user, get_db
from app.db import models
from app.schemas.task import TaskCreate, TaskOut, TaskReviewAction
from app.schemas.user import UserOut
from app.services.profile_pictures import profile_picture_url
from app.services.task_lifecycle import expire_overdue_tasks

router = APIRouter()

ASSIGNABLE_ROLES = {
    "ceo": None,
    "hr": {"team_lead", "project_manager"},
    "team_lead": {"employee"},
    "project_manager": {"employee"},
}
NEXT_STATUS = {
    "backlog": ("inProgress", 40),
    "inProgress": ("review", 85),
}
STATUS_LABELS = {
    "inProgress": "In Progress",
    "review": "In Review",
}


def _permitted_assignees(db: Session, user: models.User) -> List[models.User]:
    if user.role not in ASSIGNABLE_ROLES:
        raise HTTPException(403, "Your account role cannot assign tasks.")

    permitted_roles = ASSIGNABLE_ROLES[user.role]
    query = db.query(models.User)
    if permitted_roles is not None:
        query = query.filter(models.User.role.in_(permitted_roles))
    return query.order_by(models.User.name, models.User.id).all()


def _load_task(db: Session, task_id: int) -> models.Task:
    task = db.query(models.Task).options(
        joinedload(models.Task.assignee),
        selectinload(models.Task.history),
    ).filter(models.Task.id == task_id).first()
    if task is None:
        raise HTTPException(404, "Task not found.")
    return task


def _record_history(
    db: Session,
    task: models.Task,
    actor: models.User | None,
    event_type: str,
    note: str = "",
) -> None:
    db.add(models.TaskHistory(
        task_id=task.id,
        actor_id=actor.id if actor else None,
        actor_name=actor.name if actor else "System",
        event_type=event_type,
        note=note,
    ))


def _task_response(task: models.Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "project": task.project,
        "category": task.category,
        "status": task.status,
        "priority": task.priority,
        "assignee_id": task.assignee_id,
        "assignee_name": task.assignee.name,
        "assignee_email": task.assignee.email,
        "assignee_avatar": profile_picture_url(task.assignee_id),
        "assigned_by_id": task.assigned_by_id,
        "assigned_by_name": task.assigned_by_name,
        "progress": task.progress,
        "due_date": task.due_date,
        "tags": task.tags or [],
        "description": task.description,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
        "history": [
            {
                "id": item.id,
                "actor_id": item.actor_id,
                "actor_name": item.actor_name,
                "event_type": item.event_type,
                "note": item.note,
                "created_at": item.created_at.isoformat(),
            }
            for item in task.history
        ],
    }


@router.get("", response_model=List[TaskOut])
def read_tasks(
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    expire_overdue_tasks(db)
    query = db.query(models.Task).options(
        joinedload(models.Task.assignee),
        selectinload(models.Task.history),
    ).filter(~models.Task.status.in_(("ended", "expired")))
    if me.role != "ceo":
        query = query.filter(
            (models.Task.assignee_id == me.id)
            | (models.Task.assigned_by_id == me.id)
        )
    tasks = query.order_by(models.Task.created_at.desc(), models.Task.id.desc()).all()
    return [_task_response(task) for task in tasks]


@router.get("/performance/me")
def read_my_task_performance(
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    expire_overdue_tasks(db)
    successful = db.query(models.Task).filter(
        models.Task.assignee_id == me.id,
        models.Task.status == "ended",
    ).count()
    expired = db.query(models.Task).filter(
        models.Task.assignee_id == me.id,
        models.Task.status == "expired",
    ).count()
    total = successful + expired
    return {
        "successful": successful,
        "expired": expired,
        "total": total,
        "completion_rate": round(successful * 100 / total) if total else 0,
    }


@router.get("/assignees", response_model=List[UserOut])
def read_assignable_users(
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    return _permitted_assignees(db, me)


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    body: TaskCreate,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    permitted_users = _permitted_assignees(db, me)
    assignees_by_id = {user.id: user for user in permitted_users}
    assignee = assignees_by_id.get(body.assignee_id)
    if assignee is None:
        raise HTTPException(403, "You cannot assign a task to this user.")

    project = "Operations" if body.category == "operation" else "Sprint"
    task = models.Task(
        title=body.title,
        project=project,
        category=body.category,
        status="backlog",
        priority="Medium",
        assignee_id=assignee.id,
        assigned_by_id=me.id,
        assigned_by_name=me.name,
        description="",
        due_date=body.due_date.astimezone(timezone.utc).isoformat(),
        tags=[],
        progress=0,
    )
    db.add(task)
    db.flush()
    _record_history(db, task, me, "assigned", f"Assigned to {assignee.name}.")
    db.add(models.Notification(
        user_id=assignee.id,
        message=f"{me.name} assigned you a task: {task.title}",
    ))
    db.commit()
    return _task_response(_load_task(db, task.id))


@router.patch("/{task_id}/progress", response_model=TaskOut)
def progress_task(
    task_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    expire_overdue_tasks(db)
    task = _load_task(db, task_id)
    if task.assignee_id != me.id:
        raise HTTPException(403, "Only the assigned user can update this task.")

    next_step = NEXT_STATUS.get(task.status)
    if next_step is None:
        raise HTTPException(409, "This task cannot be progressed in its current state.")

    task.status, task.progress = next_step
    _record_history(db, task, me, "progressed", f"Moved to {STATUS_LABELS[task.status]}.")
    if task.assigned_by_id is not None and task.assigned_by_id != me.id:
        db.add(models.Notification(
            user_id=task.assigned_by_id,
            message=f'{me.name} progressed your task "{task.title}" to {STATUS_LABELS[task.status]}.',
        ))
    db.commit()
    return _task_response(_load_task(db, task.id))


@router.patch("/{task_id}/review", response_model=TaskOut)
def review_task(
    task_id: int,
    body: TaskReviewAction,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    expire_overdue_tasks(db)
    task = _load_task(db, task_id)
    if task.assigned_by_id != me.id:
        raise HTTPException(403, "Only the task assigner can review this task.")
    if task.status != "review":
        raise HTTPException(409, "Only tasks in review can be approved or returned.")

    if body.decision == "approve":
        task.status = "done"
        task.progress = 100
        event_type = "approved"
        message = f'{me.name} approved your task "{task.title}". You can now end it.'
        note = body.note or "Task approved."
    else:
        task.status = "backlog"
        task.progress = 0
        event_type = "returned"
        message = f'{me.name} returned your task "{task.title}" to backlog: {body.note}'
        note = body.note

    _record_history(db, task, me, event_type, note)
    db.add(models.Notification(user_id=task.assignee_id, message=message))
    db.commit()
    return _task_response(_load_task(db, task.id))


@router.patch("/{task_id}/end", response_model=TaskOut)
def end_task(
    task_id: int,
    db: Session = Depends(get_db),
    me: models.User = Depends(get_current_user),
):
    expire_overdue_tasks(db)
    task = _load_task(db, task_id)
    if task.assignee_id != me.id:
        raise HTTPException(403, "Only the assigned user can end this task.")
    if task.status != "done":
        raise HTTPException(409, "Only an approved task can be ended.")

    task.status = "ended"
    _record_history(db, task, me, "ended", "Task closed by the assigned user.")
    if task.assigned_by_id is not None and task.assigned_by_id != me.id:
        db.add(models.Notification(
            user_id=task.assigned_by_id,
            message=f'{me.name} ended the approved task "{task.title}".',
        ))
    db.commit()
    return _task_response(_load_task(db, task.id))
