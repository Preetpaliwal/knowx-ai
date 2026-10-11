import json
import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Note, QuizResult

router = APIRouter()
logger = logging.getLogger(__name__)
MODEL_NAME = "gemini-flash-latest"  # Match working notes summarization model


class QuizGenerateRequest(BaseModel):
    note_ids: list[int] = Field(default_factory=list)
    difficulty: str = "medium"
    question_count: int = 5


class QuizSubmitRequest(BaseModel):
    topic: str
    difficulty: str
    questions: list[dict[str, Any]]
    answers: list[str]


def _notes_text(notes: list[Note]) -> str:
    return "\n\n".join(f"NOTE: {note.title}\n{(note.content or note.excerpt or '').strip()}" for note in notes)


def _parse_questions(text: str, expected: int) -> list[dict[str, Any]]:
    cleaned = text.strip().removeprefix("```json").removesuffix("```").strip()
    data = json.loads(cleaned)
    questions = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(questions, list) or len(questions) != expected:
        raise ValueError("Gemini returned an invalid question count.")
    validated = []
    for item in questions:
        if not isinstance(item, dict):
            raise ValueError("Gemini returned an invalid question.")
        question = str(item.get("question", "")).strip()
        options = item.get("options")
        answer = str(item.get("answer", "")).strip()
        explanation = str(item.get("explanation", "")).strip()
        if not question or not isinstance(options, list) or len(options) != 4 or not answer or answer not in options or not explanation:
            raise ValueError("Gemini returned malformed question data.")
        validated.append({"question": question, "options": [str(option) for option in options], "answer": answer, "explanation": explanation})
    return validated


@router.post("/quiz/generate")
async def generate_quiz(request: QuizGenerateRequest, db: Session = Depends(get_db)):
    if request.difficulty not in {"easy", "medium", "hard"} or request.question_count not in {5, 10, 15}:
        raise HTTPException(status_code=400, detail="Invalid difficulty or question count.")
    
    query = db.query(Note).order_by(Note.created_at.desc())
    notes = query.filter(Note.id.in_(request.note_ids)).all() if request.note_ids else query.all()
    notes = [note for note in notes if (note.content or note.excerpt or "").strip()]
    
    if not notes:
        raise HTTPException(status_code=422, detail="Select notes with extracted text before generating a quiz.")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured.")
    
    topic = ", ".join(note.title for note in notes)
    prompt = f"Create exactly {request.question_count} multiple-choice questions at {request.difficulty} difficulty using only these study notes. Do not use outside facts. Return JSON only with this shape: {{\"questions\":[{{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer\":\"one exact option\",\"explanation\":\"...\"}}]}}. If a fact is not in the notes, do not ask about it.\n\n{_notes_text(notes)}"
    
    try:
        # Create client with proper lifecycle management using context manager
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
            questions = _parse_questions(response.text or "", request.question_count)
        return {"status": "success", "topic": topic, "difficulty": request.difficulty, "questions": questions}
    except json.JSONDecodeError as error:
        logger.error("Quiz response was not valid JSON: %s", error)
        raise HTTPException(status_code=502, detail="Gemini returned an invalid quiz format. Please try again.") from error
    except Exception as error:
        safe_error = str(error).replace(api_key, "[redacted]")
        logger.error("Quiz generation failed: %s", safe_error, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Quiz generation failed: {safe_error[:200]}") from error


@router.post("/quiz/submit")
async def submit_quiz(request: QuizSubmitRequest, db: Session = Depends(get_db)):
    if not request.questions or len(request.answers) != len(request.questions):
        raise HTTPException(status_code=400, detail="Quiz answers are incomplete.")
    score = sum(1 for question, answer in zip(request.questions, request.answers) if answer == question.get("answer"))
    result = QuizResult(topic=request.topic, difficulty=request.difficulty, question_count=len(request.questions), questions_json=json.dumps(request.questions), answers_json=json.dumps(request.answers), score=score)
    db.add(result)
    db.commit()
    db.refresh(result)
    return {"status": "success", "result": result.to_dict()}


@router.get("/quiz/history")
async def quiz_history(db: Session = Depends(get_db)):
    results = db.query(QuizResult).order_by(QuizResult.created_at.desc()).limit(50).all()
    return {"status": "success", "history": [result.to_dict() for result in results]}
