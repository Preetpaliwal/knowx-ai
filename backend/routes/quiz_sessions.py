"""
Quiz Sessions API - Shareable, time-limited quiz sessions with leaderboard
"""

import json
import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import QuizSession, QuizAttempt

router = APIRouter()
logger = logging.getLogger(__name__)


class CreateSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    topic: str
    difficulty: str
    questions: list[dict]  # Must include answer keys
    expiry_option: str = "1h"  # "30m", "1h", "24h", or "custom"
    custom_expiry: Optional[str] = None  # ISO datetime for custom
    max_participants: Optional[int] = None
    timer_minutes: Optional[int] = None
    show_leaderboard: bool = True
    created_by: str = "Teacher"


class JoinSessionRequest(BaseModel):
    participant_name: str = Field(..., min_length=1, max_length=100)


class SubmitAnswersRequest(BaseModel):
    answers: list[str]  # Student's selected answers
    time_taken_seconds: Optional[int] = None


def generate_join_token() -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(32)


def generate_join_code() -> str:
    """Generate a short, easy-to-type join code (6 uppercase alphanumeric)"""
    alphabet = string.ascii_uppercase + string.digits
    # Remove ambiguous characters
    alphabet = alphabet.replace('O', '').replace('0', '').replace('I', '').replace('1')
    return ''.join(secrets.choice(alphabet) for _ in range(6))


def calculate_expiry(expiry_option: str, custom_expiry: Optional[str]) -> datetime:
    """Calculate expiry datetime from option"""
    if expiry_option == "custom" and custom_expiry:
        try:
            return datetime.fromisoformat(custom_expiry.replace('Z', '+00:00'))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid custom expiry datetime")
    
    expiry_map = {
        "30m": timedelta(minutes=30),
        "1h": timedelta(hours=1),
        "24h": timedelta(hours=24),
    }
    
    delta = expiry_map.get(expiry_option)
    if not delta:
        raise HTTPException(status_code=400, detail="Invalid expiry option")
    
    return datetime.utcnow() + delta


def update_session_status(session: QuizSession, db: Session):
    """Update session status based on expiry"""
    if session.status == "active" and session.expires_at < datetime.utcnow():
        session.status = "expired"
        db.commit()


def calculate_ranks(db: Session, session_id: int):
    """Calculate and update ranks for all attempts in a session"""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.session_id == session_id,
        QuizAttempt.submitted_at.isnot(None)
    ).order_by(
        QuizAttempt.score.desc(),
        QuizAttempt.time_taken_seconds.asc(),
        QuizAttempt.submitted_at.asc()
    ).all()
    
    current_rank = 1
    for idx, attempt in enumerate(attempts):
        # Same rank for same scores
        if idx > 0 and attempt.score == attempts[idx - 1].score:
            attempt.rank = attempts[idx - 1].rank
        else:
            attempt.rank = current_rank
        current_rank += 1
    
    db.commit()


@router.post("/quiz-sessions/create")
async def create_session(request: CreateSessionRequest, db: Session = Depends(get_db)):
    """Create a new shareable quiz session"""
    
    # Validate questions
    if not request.questions or len(request.questions) < 1:
        raise HTTPException(status_code=400, detail="At least one question is required")
    
    for q in request.questions:
        if not all(k in q for k in ["question", "options", "answer", "explanation"]):
            raise HTTPException(status_code=400, detail="Each question must have question, options, answer, and explanation")
    
    # Generate unique token and code
    max_attempts = 10
    for _ in range(max_attempts):
        join_token = generate_join_token()
        join_code = generate_join_code()
        
        # Check uniqueness
        existing_token = db.query(QuizSession).filter(QuizSession.join_token == join_token).first()
        existing_code = db.query(QuizSession).filter(QuizSession.join_code == join_code).first()
        
        if not existing_token and not existing_code:
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique join credentials")
    
    # Calculate expiry
    expires_at = calculate_expiry(request.expiry_option, request.custom_expiry)
    
    # Create session
    session = QuizSession(
        title=request.title,
        topic=request.topic,
        difficulty=request.difficulty,
        questions_json=json.dumps(request.questions),
        join_token=join_token,
        join_code=join_code,
        expires_at=expires_at,
        max_participants=request.max_participants,
        timer_minutes=request.timer_minutes,
        status="active",
        show_leaderboard=1 if request.show_leaderboard else 0,
        created_by=request.created_by
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    logger.info(f"Created quiz session {session.id} with token {join_token[:8]}... and code {join_code}")
    
    return {
        "status": "success",
        "session": session.to_dict(include_answers=True)
    }


@router.get("/quiz-sessions/{token}/validate")
async def validate_session(token: str, db: Session = Depends(get_db)):
    """Validate a session token before joining"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    update_session_status(session, db)
    
    if session.status == "expired":
        return {
            "status": "error",
            "error": "expired",
            "message": "This quiz session has expired"
        }
    
    if session.status == "closed":
        return {
            "status": "error",
            "error": "closed",
            "message": "This quiz session has been closed by the teacher"
        }
    
    # Check participant limit
    if session.max_participants:
        participant_count = db.query(func.count(QuizAttempt.id)).filter(
            QuizAttempt.session_id == session.id
        ).scalar()
        
        if participant_count >= session.max_participants:
            return {
                "status": "error",
                "error": "full",
                "message": f"This quiz session is full (max {session.max_participants} participants)"
            }
    
    return {
        "status": "success",
        "session": session.to_dict(include_answers=False)
    }


@router.post("/quiz-sessions/{token}/join")
async def join_session(token: str, request: JoinSessionRequest, db: Session = Depends(get_db)):
    """Join a quiz session and start an attempt"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    update_session_status(session, db)
    
    if session.status != "active":
        raise HTTPException(status_code=400, detail=f"Session is {session.status}")
    
    # Check participant limit
    if session.max_participants:
        participant_count = db.query(func.count(QuizAttempt.id)).filter(
            QuizAttempt.session_id == session.id
        ).scalar()
        
        if participant_count >= session.max_participants:
            raise HTTPException(status_code=400, detail="Session is full")
    
    # Check for existing attempt by this participant
    existing = db.query(QuizAttempt).filter(
        QuizAttempt.session_id == session.id,
        QuizAttempt.participant_name == request.participant_name.strip()
    ).first()
    
    if existing:
        # Return existing attempt
        return {
            "status": "success",
            "attempt": existing.to_dict(),
            "session": session.to_dict(include_answers=False)
        }
    
    # Create new attempt
    attempt = QuizAttempt(
        session_id=session.id,
        participant_name=request.participant_name.strip(),
        answers_json=json.dumps([]),
        score=0,
        percentage=0.0,
        started_at=datetime.utcnow()
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    logger.info(f"Participant '{request.participant_name}' joined session {session.id}")
    
    return {
        "status": "success",
        "attempt": attempt.to_dict(),
        "session": session.to_dict(include_answers=False)
    }


@router.post("/quiz-sessions/{token}/attempts/{attempt_id}/submit")
async def submit_attempt(
    token: str,
    attempt_id: int,
    request: SubmitAnswersRequest,
    db: Session = Depends(get_db)
):
    """Submit answers for a quiz attempt"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    update_session_status(session, db)
    
    # Allow submission even if expired, but check it wasn't submitted before expiry
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.session_id == session.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.submitted_at:
        raise HTTPException(status_code=400, detail="Attempt already submitted")
    
    # Validate submission timing
    if session.status == "expired":
        # Check if attempt was started before expiry
        if attempt.started_at > session.expires_at:
            raise HTTPException(status_code=400, detail="Session expired before attempt started")
    
    # Load questions with answers
    questions = json.loads(session.questions_json)
    
    if len(request.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answer count does not match question count")
    
    # Calculate score (server-side validation)
    score = 0
    for i, (student_answer, question) in enumerate(zip(request.answers, questions)):
        if student_answer == question.get("answer"):
            score += 1
    
    percentage = (score / len(questions)) * 100 if questions else 0
    
    # Update attempt
    attempt.answers_json = json.dumps(request.answers)
    attempt.score = score
    attempt.percentage = percentage
    attempt.time_taken_seconds = request.time_taken_seconds
    attempt.submitted_at = datetime.utcnow()
    
    db.commit()
    
    # Recalculate all ranks
    calculate_ranks(db, session.id)
    
    db.refresh(attempt)
    
    logger.info(f"Attempt {attempt_id} submitted with score {score}/{len(questions)}")
    
    # Return result with correct answers and explanations
    result = attempt.to_dict()
    result["questions"] = questions  # Include full questions with answers for review
    
    return {
        "status": "success",
        "result": result
    }


@router.get("/quiz-sessions/{token}/leaderboard")
async def get_leaderboard(token: str, db: Session = Depends(get_db)):
    """Get leaderboard for a quiz session"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    update_session_status(session, db)
    
    if not session.show_leaderboard:
        raise HTTPException(status_code=403, detail="Leaderboard is disabled for this session")
    
    # Get all submitted attempts
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.session_id == session.id,
        QuizAttempt.submitted_at.isnot(None)
    ).order_by(
        QuizAttempt.rank.asc(),
        QuizAttempt.submitted_at.asc()
    ).all()
    
    total_participants = db.query(func.count(QuizAttempt.id)).filter(
        QuizAttempt.session_id == session.id
    ).scalar()
    
    return {
        "status": "success",
        "session": session.to_dict(include_answers=False),
        "leaderboard": [attempt.to_dict() for attempt in attempts],
        "totalParticipants": total_participants,
        "submittedCount": len(attempts)
    }


@router.get("/quiz-sessions/code/{code}/info")
async def get_session_by_code(code: str, db: Session = Depends(get_db)):
    """Get session info by join code (for quick access)"""
    
    session = db.query(QuizSession).filter(QuizSession.join_code == code.upper()).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid join code")
    
    update_session_status(session, db)
    
    return {
        "status": "success",
        "token": session.join_token,
        "session": session.to_dict(include_answers=False)
    }


@router.post("/quiz-sessions/{token}/close")
async def close_session(token: str, db: Session = Depends(get_db)):
    """Close a quiz session (teacher only)"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    if session.status == "closed":
        raise HTTPException(status_code=400, detail="Session already closed")
    
    session.status = "closed"
    session.closed_at = datetime.utcnow()
    db.commit()
    
    logger.info(f"Session {session.id} closed manually")
    
    return {
        "status": "success",
        "message": "Session closed successfully"
    }


@router.get("/quiz-sessions/{token}/dashboard")
async def get_teacher_dashboard(token: str, db: Session = Depends(get_db)):
    """Get teacher dashboard with all participants and statistics"""
    
    session = db.query(QuizSession).filter(QuizSession.join_token == token).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session link")
    
    update_session_status(session, db)
    
    # Get all attempts (submitted and in-progress)
    all_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.session_id == session.id
    ).order_by(
        QuizAttempt.rank.asc().nullsfirst(),
        QuizAttempt.started_at.asc()
    ).all()
    
    submitted_attempts = [a for a in all_attempts if a.submitted_at]
    in_progress_attempts = [a for a in all_attempts if not a.submitted_at]
    
    # Calculate statistics
    avg_score = 0
    if submitted_attempts:
        avg_score = sum(a.score for a in submitted_attempts) / len(submitted_attempts)
    
    return {
        "status": "success",
        "session": session.to_dict(include_answers=True),
        "participants": {
            "total": len(all_attempts),
            "submitted": len(submitted_attempts),
            "inProgress": len(in_progress_attempts)
        },
        "attempts": [a.to_dict() for a in all_attempts],
        "statistics": {
            "averageScore": round(avg_score, 2),
            "averagePercentage": round(avg_score / len(json.loads(session.questions_json)) * 100, 2) if json.loads(session.questions_json) else 0,
            "highestScore": max((a.score for a in submitted_attempts), default=0),
            "lowestScore": min((a.score for a in submitted_attempts), default=0)
        }
    }
