from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import RevisionSession, RevisionTask

router = APIRouter()


class TaskRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=255)
    note_id: int | None = None
    date: str
    priority: str = "medium"
    estimated_minutes: int = Field(default=25, ge=1, le=1440)
    status: str = "pending"


class SessionRequest(BaseModel):
    task_id: int | None = None
    minutes: int = Field(ge=1, le=1440)


def validate_task(data: TaskRequest):
    if data.priority not in {"low", "medium", "high"} or data.status not in {"pending", "in_progress", "completed"}:
        raise HTTPException(status_code=400, detail="Invalid task priority or status.")


@router.get("/revision/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(RevisionTask).order_by(RevisionTask.due_date.asc(), RevisionTask.created_at.desc()).all()
    return {"status": "success", "tasks": [task.to_dict() for task in tasks]}


@router.post("/revision/tasks")
async def create_task(request: TaskRequest, db: Session = Depends(get_db)):
    validate_task(request)
    task = RevisionTask(topic=request.topic.strip(), note_id=request.note_id, due_date=request.date, priority=request.priority, estimated_minutes=request.estimated_minutes, status=request.status)
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"status": "success", "task": task.to_dict()}


@router.put("/revision/tasks/{task_id}")
async def update_task(task_id: int, request: TaskRequest, db: Session = Depends(get_db)):
    validate_task(request)
    task = db.query(RevisionTask).filter(RevisionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Revision task not found.")
    task.topic, task.note_id, task.due_date, task.priority, task.estimated_minutes, task.status = request.topic.strip(), request.note_id, request.date, request.priority, request.estimated_minutes, request.status
    db.commit()
    db.refresh(task)
    return {"status": "success", "task": task.to_dict()}


@router.delete("/revision/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(RevisionTask).filter(RevisionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Revision task not found.")
    db.delete(task)
    db.commit()
    return {"status": "success"}


@router.post("/revision/sessions")
async def create_session(request: SessionRequest, db: Session = Depends(get_db)):
    session = RevisionSession(task_id=request.task_id, minutes=request.minutes)
    db.add(session)
    if request.task_id:
        task = db.query(RevisionTask).filter(RevisionTask.id == request.task_id).first()
        if task:
            task.status = "completed"
    db.commit()
    return {"status": "success", "minutes": request.minutes}


@router.get("/revision/stats")
async def revision_stats(db: Session = Depends(get_db)):
    tasks = db.query(RevisionTask).all()
    sessions = db.query(RevisionSession).all()
    today = date.today().isoformat()
    completed = sum(task.status == "completed" for task in tasks)
    pending = sum(task.status != "completed" for task in tasks)
    study_days = {session.created_at.date() for session in sessions if session.created_at}
    streak = 0
    cursor = date.today()
    while cursor in study_days:
        streak += 1
        cursor -= timedelta(days=1)
    return {"status": "success", "stats": {"todayTasks": sum(task.due_date == today for task in tasks), "completedTasks": completed, "pendingTasks": pending, "streak": streak, "totalMinutes": sum(session.minutes for session in sessions)}}
