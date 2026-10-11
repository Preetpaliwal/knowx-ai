import json
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Note, QuizResult, RevisionSession, RevisionTask, UserSettings
from routes.settings import get_settings

router = APIRouter()


def check_admin_access(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    settings = get_settings(db)
    current_role = x_user_role or settings.get("role", "student")
    if current_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Administrator privileges required.",
        )
    return current_role


@router.get("/admin/students")
async def get_students(
    db: Session = Depends(get_db),
    admin_role: str = Depends(check_admin_access),
) -> dict[str, Any]:
    notes_count = db.query(Note).count()
    quizzes = db.query(QuizResult).all()
    quiz_count = len(quizzes)
    avg_score = round(sum(q.percentage for q in quizzes) / quiz_count) if quiz_count else 0
    settings = get_settings(db)

    # Primary student is the workspace user, followed by cohort learners
    primary_student = {
        "id": "std-1",
        "name": settings.get("displayName") or "Primary Learner",
        "email": settings.get("email") or "student@studymate.ai",
        "role": "Student",
        "registrationDate": "2026-08-15",
        "notesCount": notes_count,
        "quizCount": quiz_count,
        "averageScore": avg_score,
        "lastActive": "Just now",
        "status": "Active",
    }

    cohort_students = [
        primary_student,
        {
            "id": "std-2",
            "name": "Sarah Jenkins",
            "email": "sarah.j@university.edu",
            "role": "Student",
            "registrationDate": "2026-08-20",
            "notesCount": 8,
            "quizCount": 14,
            "averageScore": 92,
            "lastActive": "2 hours ago",
            "status": "Active",
        },
        {
            "id": "std-3",
            "name": "David Chen",
            "email": "d.chen@collegestudy.org",
            "role": "Student",
            "registrationDate": "2026-08-22",
            "notesCount": 5,
            "quizCount": 9,
            "averageScore": 84,
            "lastActive": "Yesterday",
            "status": "Active",
        },
        {
            "id": "std-4",
            "name": "Amara Okafor",
            "email": "a.okafor@techacademy.io",
            "role": "Student",
            "registrationDate": "2026-08-28",
            "notesCount": 12,
            "quizCount": 19,
            "averageScore": 95,
            "lastActive": "3 hours ago",
            "status": "Active",
        },
        {
            "id": "std-5",
            "name": "Liam Patel",
            "email": "liam.p@studymate.org",
            "role": "Student",
            "registrationDate": "2026-09-02",
            "notesCount": 3,
            "quizCount": 4,
            "averageScore": 76,
            "lastActive": "3 days ago",
            "status": "Inactive",
        },
    ]

    total_uploaded_notes = notes_count + sum(s["notesCount"] for s in cohort_students[1:])
    total_quiz_sum = sum(s["averageScore"] for s in cohort_students)
    overall_avg = round(total_quiz_sum / len(cohort_students))

    return {
        "status": "success",
        "stats": {
            "totalStudents": len(cohort_students),
            "activeStudents": sum(1 for s in cohort_students if s["status"] == "Active"),
            "totalNotes": total_uploaded_notes,
            "averageQuizScore": overall_avg,
        },
        "students": cohort_students,
    }


@router.get("/admin/students/{student_id}")
async def get_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
    admin_role: str = Depends(check_admin_access),
) -> dict[str, Any]:
    notes = [note.to_dict() for note in db.query(Note).all()]
    quizzes = [q.to_dict() for q in db.query(QuizResult).order_by(QuizResult.created_at.desc()).all()]
    tasks = [t.to_dict() for t in db.query(RevisionTask).all()]
    settings = get_settings(db)

    student_name = settings.get("displayName") or "Primary Learner"
    student_email = settings.get("email") or "student@studymate.ai"

    if student_id != "std-1":
        # Mock cohort info
        names = {
            "std-2": ("Sarah Jenkins", "sarah.j@university.edu"),
            "std-3": ("David Chen", "d.chen@collegestudy.org"),
            "std-4": ("Amara Okafor", "a.okafor@techacademy.io"),
            "std-5": ("Liam Patel", "liam.p@studymate.org"),
        }
        name, email = names.get(student_id, ("Learner", "learner@studymate.ai"))
        return {
            "status": "success",
            "student": {
                "id": student_id,
                "name": name,
                "email": email,
                "registrationDate": "2026-08-20",
                "notesCount": 8,
                "quizCount": 14,
                "averageScore": 92,
                "lastActive": "Today",
                "status": "Active",
                "notes": [
                    {"id": "c1", "title": "Data Structures & Algorithms - Trees", "date": "Sep 10", "fileType": "PDF"},
                    {"id": "c2", "title": "Operating Systems - Virtual Memory", "date": "Sep 08", "fileType": "DOCX"}
                ],
                "quizzes": [
                    {"id": "q1", "topic": "Binary Search Trees", "score": 5, "total": 5, "percentage": 100, "date": "Sep 11"},
                    {"id": "q2", "topic": "Page Replacement", "score": 4, "total": 5, "percentage": 80, "date": "Sep 09"}
                ],
                "revisionProgress": {
                    "completed": 12,
                    "total": 15,
                    "streak": 7,
                    "studyMinutes": 240
                }
            }
        }

    return {
        "status": "success",
        "student": {
            "id": "std-1",
            "name": student_name,
            "email": student_email,
            "registrationDate": "2026-08-15",
            "notesCount": len(notes),
            "quizCount": len(quizzes),
            "averageScore": round(sum(q["percentage"] for q in quizzes) / len(quizzes)) if quizzes else 0,
            "lastActive": "Now",
            "status": "Active",
            "notes": notes,
            "quizzes": quizzes,
            "revisionProgress": {
                "completed": sum(1 for t in tasks if t["status"] == "completed"),
                "total": len(tasks),
                "streak": 5,
                "studyMinutes": sum(t["estimatedMinutes"] for t in tasks if t["status"] == "completed")
            }
        }
    }
