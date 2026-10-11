"""
Competition Routes - Live Quiz Competition API
"""
import json
import logging
import random
import string
from datetime import datetime
from typing import Any, Optional
from io import BytesIO
import base64

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Competition, CompetitionParticipant, CompetitionAnswer
from websocket_manager import ws_manager

router = APIRouter()
logger = logging.getLogger(__name__)

# QR Code generation
try:
    import qrcode
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False
    logger.warning("qrcode library not available - QR codes will be disabled")


def generate_join_code(length: int = 6) -> str:
    """Generate a unique random join code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def calculate_score(is_correct: bool, response_time_ms: int, max_time_ms: int = 30000) -> int:
    """
    Calculate score based on correctness and speed
    
    Scoring Algorithm:
    - Incorrect answer: 0 points
    - Correct answer: Base 1000 points + speed bonus (0-500 points)
    - Speed bonus decreases linearly with time
    - Maximum time: 30 seconds (30000ms)
    
    Examples:
    - Correct in 1s: 1000 + 483 = 1483 points
    - Correct in 15s: 1000 + 250 = 1250 points
    - Correct in 29s: 1000 + 17 = 1017 points
    - Incorrect: 0 points
    """
    if not is_correct:
        return 0
    
    base_score = 1000
    max_speed_bonus = 500
    
    # Clamp response time to max time
    response_time_ms = min(response_time_ms, max_time_ms)
    
    # Calculate speed bonus: decreases linearly from max_speed_bonus to 0
    time_ratio = response_time_ms / max_time_ms
    speed_bonus = int(max_speed_bonus * (1 - time_ratio))
    
    return base_score + speed_bonus


class CreateCompetitionRequest(BaseModel):
    host_name: str = Field(default="Host", max_length=255)
    quiz_topic: str = Field(..., max_length=255)
    quiz_difficulty: str
    questions: list[dict[str, Any]]


class JoinCompetitionRequest(BaseModel):
    join_code: str
    display_name: str = Field(..., max_length=100)
    avatar: Optional[str] = Field(None, max_length=500)


class SubmitAnswerRequest(BaseModel):
    competition_id: int
    participant_id: int
    question_index: int
    selected_answer: str
    response_time_ms: int


class StartCompetitionRequest(BaseModel):
    competition_id: int


class NextQuestionRequest(BaseModel):
    competition_id: int


class EndCompetitionRequest(BaseModel):
    competition_id: int


@router.post("/competition/create")
async def create_competition(request: CreateCompetitionRequest, db: Session = Depends(get_db)):
    """Create a new live competition"""
    try:
        # Validate questions
        if not request.questions or len(request.questions) == 0:
            raise HTTPException(status_code=400, detail="At least one question is required")
        
        # Generate unique join code
        max_attempts = 10
        join_code = None
        for _ in range(max_attempts):
            code = generate_join_code()
            existing = db.query(Competition).filter(Competition.join_code == code).first()
            if not existing:
                join_code = code
                break
        
        if not join_code:
            raise HTTPException(status_code=500, detail="Failed to generate unique join code")
        
        # Create competition
        competition = Competition(
            host_name=request.host_name,
            quiz_topic=request.quiz_topic,
            quiz_difficulty=request.quiz_difficulty,
            questions_json=json.dumps(request.questions),
            join_code=join_code,
            status="waiting",
            max_participants=50,
            current_question=0
        )
        
        db.add(competition)
        db.commit()
        db.refresh(competition)
        
        # Generate QR code if available
        qr_code_data = None
        if QR_AVAILABLE:
            try:
                join_url = f"http://localhost:3000/join/{join_code}"
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(join_url)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                qr_code_data = base64.b64encode(buffer.getvalue()).decode()
            except Exception as e:
                logger.warning(f"Failed to generate QR code: {e}")
        
        return {
            "status": "success",
            "competition": competition.to_dict(),
            "joinUrl": f"http://localhost:3000/join/{join_code}",
            "qrCode": qr_code_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating competition: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create competition")


@router.get("/competition/{join_code}")
async def get_competition(join_code: str, db: Session = Depends(get_db)):
    """Get competition details by join code"""
    competition = db.query(Competition).filter(Competition.join_code == join_code).first()
    
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Get participant count
    participant_count = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == competition.id
    ).count()
    
    # Get participants
    participants = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == competition.id
    ).all()
    
    return {
        "status": "success",
        "competition": competition.to_dict(),
        "participantCount": participant_count,
        "participants": [p.to_dict() for p in participants]
    }


@router.post("/competition/join")
async def join_competition(request: JoinCompetitionRequest, db: Session = Depends(get_db)):
    """Join a competition as a participant"""
    try:
        # Find competition
        competition = db.query(Competition).filter(
            Competition.join_code == request.join_code
        ).first()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        # Check if competition is still accepting participants
        if competition.status != "waiting":
            raise HTTPException(status_code=400, detail="Competition has already started or ended")
        
        # Check participant limit
        current_count = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == competition.id
        ).count()
        
        if current_count >= competition.max_participants:
            raise HTTPException(
                status_code=400,
                detail=f"Competition is full (maximum {competition.max_participants} participants)"
            )
        
        # Generate unique session ID
        session_id = f"participant_{competition.id}_{datetime.utcnow().timestamp()}_{random.randint(1000, 9999)}"
        
        # Create participant
        participant = CompetitionParticipant(
            competition_id=competition.id,
            session_id=session_id,
            display_name=request.display_name,
            avatar=request.avatar,
            final_score=0,
            correct_answers=0,
            is_connected=1
        )
        
        db.add(participant)
        db.commit()
        db.refresh(participant)
        
        # Broadcast participant joined event
        await ws_manager.broadcast_to_competition(
            str(competition.id),
            "participant_joined_lobby",
            {
                "participant": participant.to_dict(),
                "totalParticipants": current_count + 1
            }
        )
        
        return {
            "status": "success",
            "participant": participant.to_dict(),
            "competition": competition.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining competition: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to join competition")


@router.post("/competition/start")
async def start_competition(request: StartCompetitionRequest, db: Session = Depends(get_db)):
    """Start a competition (host only)"""
    try:
        competition = db.query(Competition).filter(
            Competition.id == request.competition_id
        ).first()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        if competition.status != "waiting":
            raise HTTPException(status_code=400, detail="Competition has already started")
        
        # Update competition status
        competition.status = "active"
        competition.started_at = datetime.utcnow()
        competition.current_question = 0
        
        db.commit()
        db.refresh(competition)
        
        # Get first question (without answer for participants)
        questions = json.loads(competition.questions_json)
        first_question = questions[0] if questions else None
        
        if first_question:
            # Remove answer from question sent to participants
            participant_question = {
                "question": first_question["question"],
                "options": first_question["options"],
                "questionIndex": 0,
                "totalQuestions": len(questions)
            }
            
            # Broadcast competition started with first question
            await ws_manager.broadcast_to_competition(
                str(competition.id),
                "competition_started",
                {
                    "competition": competition.to_dict(),
                    "question": participant_question,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        return {
            "status": "success",
            "competition": competition.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting competition: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to start competition")


@router.post("/competition/answer")
async def submit_answer(request: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    try:
        # Verify competition exists and is active
        competition = db.query(Competition).filter(
            Competition.id == request.competition_id
        ).first()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        if competition.status != "active":
            raise HTTPException(status_code=400, detail="Competition is not active")
        
        # Verify participant exists
        participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.id == request.participant_id,
            CompetitionParticipant.competition_id == request.competition_id
        ).first()
        
        if not participant:
            raise HTTPException(status_code=404, detail="Participant not found")
        
        # Check if already answered this question
        existing_answer = db.query(CompetitionAnswer).filter(
            CompetitionAnswer.competition_id == request.competition_id,
            CompetitionAnswer.participant_id == request.participant_id,
            CompetitionAnswer.question_index == request.question_index
        ).first()
        
        if existing_answer:
            raise HTTPException(status_code=400, detail="Already answered this question")
        
        # Get correct answer
        questions = json.loads(competition.questions_json)
        if request.question_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question index")
        
        correct_answer = questions[request.question_index]["answer"]
        is_correct = request.selected_answer == correct_answer
        
        # Calculate score
        points = calculate_score(is_correct, request.response_time_ms)
        
        # Save answer
        answer = CompetitionAnswer(
            competition_id=request.competition_id,
            participant_id=request.participant_id,
            question_index=request.question_index,
            selected_answer=request.selected_answer,
            is_correct=1 if is_correct else 0,
            response_time_ms=request.response_time_ms,
            points=points
        )
        
        db.add(answer)
        
        # Update participant score
        participant.final_score += points
        if is_correct:
            participant.correct_answers += 1
        
        db.commit()
        
        # Notify host of answer submission
        await ws_manager.emit_to_host(
            str(competition.id),
            "answer_submitted",
            {
                "participantId": str(participant.id),
                "displayName": participant.display_name,
                "questionIndex": request.question_index,
                "isCorrect": is_correct,
                "points": points
            }
        )
        
        return {
            "status": "success",
            "isCorrect": is_correct,
            "points": points,
            "correctAnswer": correct_answer,
            "explanation": questions[request.question_index].get("explanation", "")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit answer")


@router.post("/competition/next-question")
async def next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Move to the next question (host only)"""
    try:
        competition = db.query(Competition).filter(
            Competition.id == request.competition_id
        ).first()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        if competition.status != "active":
            raise HTTPException(status_code=400, detail="Competition is not active")
        
        questions = json.loads(competition.questions_json)
        next_index = competition.current_question + 1
        
        if next_index >= len(questions):
            # No more questions - end competition
            return await end_competition(EndCompetitionRequest(competition_id=request.competition_id), db)
        
        # Update current question
        competition.current_question = next_index
        db.commit()
        
        # Get leaderboard before showing next question
        leaderboard = await get_leaderboard(request.competition_id, db)
        
        # Broadcast leaderboard
        await ws_manager.broadcast_to_competition(
            str(competition.id),
            "show_leaderboard",
            {
                "leaderboard": leaderboard["leaderboard"],
                "questionIndex": next_index - 1,
                "nextQuestionIn": 5000  # 5 seconds
            }
        )
        
        # Send next question after a delay (handled by frontend)
        next_q = questions[next_index]
        participant_question = {
            "question": next_q["question"],
            "options": next_q["options"],
            "questionIndex": next_index,
            "totalQuestions": len(questions)
        }
        
        await ws_manager.broadcast_to_competition(
            str(competition.id),
            "next_question",
            {
                "question": participant_question,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return {
            "status": "success",
            "currentQuestion": next_index
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving to next question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to move to next question")


@router.post("/competition/end")
async def end_competition(request: EndCompetitionRequest, db: Session = Depends(get_db)):
    """End a competition and calculate final rankings"""
    try:
        competition = db.query(Competition).filter(
            Competition.id == request.competition_id
        ).first()
        
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        # Update competition status
        competition.status = "completed"
        competition.ended_at = datetime.utcnow()
        
        # Calculate rankings
        participants = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == request.competition_id
        ).order_by(CompetitionParticipant.final_score.desc()).all()
        
        for rank, participant in enumerate(participants, start=1):
            participant.final_rank = rank
        
        db.commit()
        
        # Get final leaderboard
        leaderboard = await get_leaderboard(request.competition_id, db)
        
        # Broadcast competition ended
        await ws_manager.broadcast_to_competition(
            str(competition.id),
            "competition_ended",
            {
                "competition": competition.to_dict(),
                "leaderboard": leaderboard["leaderboard"]
            }
        )
        
        return {
            "status": "success",
            "competition": competition.to_dict(),
            "leaderboard": leaderboard["leaderboard"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending competition: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to end competition")


@router.get("/competition/{competition_id}/leaderboard")
async def get_leaderboard(competition_id: int, db: Session = Depends(get_db)):
    """Get current leaderboard for a competition"""
    participants = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == competition_id
    ).order_by(CompetitionParticipant.final_score.desc()).all()
    
    leaderboard = []
    for rank, participant in enumerate(participants, start=1):
        leaderboard.append({
            "rank": rank,
            "participantId": str(participant.id),
            "displayName": participant.display_name,
            "avatar": participant.avatar,
            "score": participant.final_score,
            "correctAnswers": participant.correct_answers
        })
    
    return {
        "status": "success",
        "leaderboard": leaderboard
    }


@router.get("/competition/{competition_id}/analytics")
async def get_competition_analytics(competition_id: int, db: Session = Depends(get_db)):
    """Get detailed analytics for a competition (host only)"""
    competition = db.query(Competition).filter(Competition.id == competition_id).first()
    
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Get all participants
    participants = db.query(CompetitionParticipant).filter(
        CompetitionParticipant.competition_id == competition_id
    ).all()
    
    # Get all answers
    answers = db.query(CompetitionAnswer).filter(
        CompetitionAnswer.competition_id == competition_id
    ).all()
    
    # Calculate statistics
    total_participants = len(participants)
    avg_score = sum(p.final_score for p in participants) / total_participants if total_participants > 0 else 0
    highest_score = max((p.final_score for p in participants), default=0)
    
    total_answers = len(answers)
    correct_answers = sum(1 for a in answers if a.is_correct)
    avg_accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0
    
    # Question-wise performance
    questions = json.loads(competition.questions_json)
    question_stats = []
    
    for idx, question in enumerate(questions):
        q_answers = [a for a in answers if a.question_index == idx]
        q_correct = sum(1 for a in q_answers if a.is_correct)
        q_total = len(q_answers)
        
        question_stats.append({
            "questionIndex": idx,
            "question": question["question"],
            "totalAnswers": q_total,
            "correctAnswers": q_correct,
            "correctPercentage": round((q_correct / q_total * 100) if q_total > 0 else 0, 1)
        })
    
    # Calculate average response time
    avg_response_time = sum(a.response_time_ms for a in answers) / total_answers if total_answers > 0 else 0
    
    return {
        "status": "success",
        "analytics": {
            "totalParticipants": total_participants,
            "averageScore": round(avg_score, 2),
            "highestScore": highest_score,
            "averageAccuracy": round(avg_accuracy, 2),
            "averageResponseTime": round(avg_response_time / 1000, 2),  # in seconds
            "questionStats": question_stats,
            "participants": [
                {
                    **p.to_dict(),
                    "accuracy": round((p.correct_answers / len(questions) * 100), 2) if questions else 0
                }
                for p in sorted(participants, key=lambda x: x.final_score, reverse=True)
            ]
        }
    }
