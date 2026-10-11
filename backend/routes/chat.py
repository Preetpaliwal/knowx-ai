import os
import logging
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage, Note

router = APIRouter()
logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-flash-latest"
FALLBACK_MODEL_NAME = "gemini-3.6-flash"


class ChatRequest(BaseModel):
    question: str
    note_ids: list[int] = Field(default_factory=list)
    conversation_id: str = "default"


def select_relevant_notes(question: str, notes: list[Note]) -> list[Note]:
    if not notes:
        return []
    question_words = {word.lower() for word in question.split() if len(word) > 2}

    def relevance(note: Note) -> int:
        searchable_text = f"{note.title} {note.content or ''}".lower()
        return sum(word in searchable_text for word in question_words)

    ranked_notes = sorted(notes, key=relevance, reverse=True)
    matching_notes = [note for note in ranked_notes if relevance(note) > 0]
    return matching_notes or ranked_notes[:3]


def build_prompt(question: str, notes: list[Note]) -> str:
    if notes:
        study_notes = "\n\n".join(
            f"--- NOTE: {note.title} ---\n{(note.content or note.excerpt or '').strip()}"
            for note in notes
        )
        return (
            "You are StudyMate AI, a friendly, modern AI educational mentor.\n"
            "The student has provided the following study notes:\n"
            f"{study_notes}\n\n"
            "Instructions:\n"
            "1. Ground your answer in the provided notes whenever relevant.\n"
            "2. If the user asks a general conceptual question (like explaining recursion, comparison, revision guidance, or study plans), provide a clear, thorough, and engaging response while relating to their notes where applicable.\n"
            "3. Format your response cleanly using Markdown, bullet points, and code blocks with syntax highlighting where relevant.\n\n"
            f"Student's Question: {question}"
        )
    else:
        return (
            "You are StudyMate AI, a friendly, modern AI educational mentor.\n"
            "Instructions:\n"
            "Answer the student's question thoroughly, accurately, and engagingly. "
            "Use clear Markdown structure, bullet points, and code blocks with language tags if applicable.\n\n"
            f"Student's Question: {question}"
        )


@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    question = request.question
    if not question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    # Fetch notes if requested or available
    notes_query = db.query(Note).order_by(Note.created_at.desc())
    if request.note_ids:
        notes = notes_query.filter(Note.id.in_(request.note_ids)).all()
    else:
        notes = notes_query.limit(5).all()

    notes_with_text = [
        note for note in notes if (note.content or note.excerpt or "").strip()
    ]

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured.",
        )

    relevant_notes = select_relevant_notes(question, notes_with_text) if notes_with_text else []
    source_notes = [note.title for note in relevant_notes]
    prompt = build_prompt(question, relevant_notes)

    logger.info(
        "Gemini chat request: model=%s notes=%d prompt_chars=%d",
        MODEL_NAME,
        len(relevant_notes),
        len(prompt),
    )

    try:
        db.add(ChatMessage(
            conversation_id=request.conversation_id,
            role="user",
            content=question,
            note_ids_json=json.dumps([note.id for note in relevant_notes]),
        ))
        client = genai.Client(api_key=api_key)
        try:
            response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        except Exception as primary_error:
            if "503" not in str(primary_error) and "UNAVAILABLE" not in str(primary_error):
                raise
            logger.warning("Primary Gemini model unavailable; trying fallback model=%s", FALLBACK_MODEL_NAME)
            response = client.models.generate_content(model=FALLBACK_MODEL_NAME, contents=prompt)
        
        answer = (response.text or "").strip()
        if not answer:
            raise RuntimeError("Gemini returned an empty response.")
        
        db.add(ChatMessage(
            conversation_id=request.conversation_id,
            role="assistant",
            content=answer,
            note_ids_json=json.dumps([note.id for note in relevant_notes]),
        ))
        db.commit()
    except Exception as error:
        safe_error = str(error).replace(api_key, "[redacted]").strip()
        if not safe_error:
            safe_error = "Unknown Gemini API error."
        logger.error("Gemini API request failed: %s", safe_error)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini request failed: {safe_error}",
        ) from error

    return {"answer": answer, "source_notes": source_notes}


@router.get("/chat/history")
async def chat_history(conversation_id: str = "default", db: Session = Depends(get_db)) -> dict[str, Any]:
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )
    total_messages = db.query(ChatMessage).count()
    return {"messages": [message.to_dict() for message in messages], "totalCount": total_messages}