import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import Note, QuizResult, RevisionSession, RevisionTask, UserSettings

router = APIRouter()
DEFAULTS = {
    "displayName": "Student",
    "email": "",
    "role": "student",
    "quizDifficulty": "medium",
    "questionCount": 5,
    "dailyRevisionGoal": 30,
    "preferredStudyTime": "18:00",
    "autoGenerateRevision": False,
    "theme": "light",
    "compactSidebar": False,
    "revisionReminders": True,
    "quizNotifications": True,
    "dailyReminder": True,
    "aiProvider": "Google Gemini",
    "model": "gemini-flash-latest",
    "answerStyle": "detailed",
    "strictNotesOnly": False
}

class SettingsRequest(BaseModel):
    displayName: str = Field(default="Student", max_length=100)
    email: str = Field(default="", max_length=255)
    role: str = Field(default="student")
    quizDifficulty: str = "medium"
    questionCount: int = 5
    dailyRevisionGoal: int = Field(default=30, ge=1, le=1440)
    preferredStudyTime: str = "18:00"
    autoGenerateRevision: bool = False
    theme: str = "light"
    compactSidebar: bool = False
    revisionReminders: bool = True
    quizNotifications: bool = True
    dailyReminder: bool = True
    answerStyle: str = "detailed"
    strictNotesOnly: bool = False


def get_settings(db: Session):
    row = db.query(UserSettings).first()
    if not row:
        return DEFAULTS.copy()
    data = json.loads(row.settings_json)
    return {**DEFAULTS, **data}


@router.get("/settings")
async def read_settings(db: Session = Depends(get_db)):
    return {"status": "success", "settings": get_settings(db)}


@router.put("/settings")
async def update_settings(request: SettingsRequest, db: Session = Depends(get_db)):
    if request.quizDifficulty not in {"easy", "medium", "hard"} or request.questionCount not in {5, 10, 15} or request.theme not in {"light", "dark", "system"} or request.answerStyle not in {"short", "detailed"} or request.role not in {"student", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid settings value.")
    payload = request.model_dump()
    row = db.query(UserSettings).first()
    if row:
        row.settings_json = json.dumps(payload)
    else:
        db.add(UserSettings(settings_json=json.dumps(payload)))
    db.commit()
    return {"status": "success", "settings": payload}


@router.post("/settings/export")
async def export_data(db: Session = Depends(get_db)):
    return {
        "status": "success",
        "data": {
            "notes": [note.to_dict() for note in db.query(Note).all()],
            "quizHistory": [result.to_dict() for result in db.query(QuizResult).all()],
            "revisionTasks": [task.to_dict() for task in db.query(RevisionTask).all()],
            "revisionSessions": [
                {
                    "id": session.id,
                    "taskId": session.task_id,
                    "minutes": session.minutes,
                    "createdAt": session.created_at.isoformat() if session.created_at else None
                }
                for session in db.query(RevisionSession).all()
            ]
        }
    }
