from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
from pypdf import PdfReader
from docx import Document
import io

from database import get_db
from models import Note
from routes.chat import build_prompt
from google import genai

router = APIRouter()
MODEL_NAME = "gemini-flash-latest"


class SummaryRequest(BaseModel):
    instruction: str | None = None

# Constants
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate file type and size"""
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file type. Only PDF, DOCX, and TXT files are allowed."
    
    return True, "Valid file"


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )


def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        docx_file = io.BytesIO(file_content)
        doc = Document(docx_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from DOCX: {str(e)}"
        )


def extract_text_from_txt(file_content: bytes) -> str:
    """Extract text from TXT file"""
    try:
        text = file_content.decode("utf-8")
        return text.strip()
    except UnicodeDecodeError:
        # Try with latin-1 encoding if utf-8 fails
        try:
            text = file_content.decode("latin-1")
            return text.strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read text file: {str(e)}"
            )


def generate_excerpt(text: str, max_length: int = 200) -> str:
    """Generate a short excerpt from text"""
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(" ", 1)[0] + "..."


def generate_title_from_filename(filename: str) -> str:
    """Generate a title from filename"""
    # Remove extension and replace underscores/hyphens with spaces
    title = os.path.splitext(filename)[0]
    title = title.replace("_", " ").replace("-", " ")
    # Capitalize words
    title = " ".join(word.capitalize() for word in title.split())
    return title


@router.post("/notes/upload")
async def upload_note(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a study note file (PDF, DOCX, or TXT)
    """
    # Validate file
    is_valid, message = validate_file(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10 MB limit. Your file is {file_size / 1024 / 1024:.2f} MB."
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Extract text based on file type
    try:
        if file_ext == ".pdf":
            text_content = extract_text_from_pdf(file_content)
            file_type = "application/pdf"
        elif file_ext == ".docx":
            text_content = extract_text_from_docx(file_content)
            file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif file_ext == ".txt":
            text_content = extract_text_from_txt(file_content)
            file_type = "text/plain"
        else:
            text_content = ""
            file_type = "application/octet-stream"
    except HTTPException:
        # Remove the saved file if text extraction fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    
    # Generate title and excerpt
    title = generate_title_from_filename(file.filename)
    excerpt = generate_excerpt(text_content)
    
    # Create note record in database
    note = Note(
        title=title,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        content=text_content,
        excerpt=excerpt
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {
        "status": "success",
        "message": "File uploaded successfully",
        "note": note.to_dict()
    }


@router.get("/notes")
async def get_notes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all notes with pagination
    """
    notes = db.query(Note).order_by(Note.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(Note).count()
    
    return {
        "status": "success",
        "total": total,
        "notes": [note.to_dict() for note in notes]
    }


@router.get("/notes/{note_id}")
async def get_note(note_id: int, db: Session = Depends(get_db)):
    """
    Get a specific note by ID
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID {note_id} not found"
        )
    
    return {
        "status": "success",
        "note": note.to_dict()
    }


@router.delete("/notes/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific note by ID
    """
    note = db.query(Note).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with ID {note_id} not found"
        )
    
    # Delete file from disk
    if os.path.exists(note.file_path):
        try:
            os.remove(note.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {note.file_path}: {str(e)}")
    
    # Delete from database
    db.delete(note)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Note {note_id} deleted successfully"
    }


@router.delete("/notes")
async def delete_all_notes(db: Session = Depends(get_db)):
    notes = db.query(Note).all()
    for note in notes:
        if os.path.exists(note.file_path):
            try:
                os.remove(note.file_path)
            except OSError:
                pass
        db.delete(note)
    db.commit()
    return {"status": "success", "deleted": len(notes)}


@router.post("/notes/{note_id}/summarize")
async def summarize_note(note_id: int, request: SummaryRequest | None = None, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    content = (note.content or note.excerpt or "").strip()
    if not content:
        raise HTTPException(status_code=422, detail="This note has no extracted text.")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured.")
    prompt = f"Summarize this study note in concise bullet points. Use only the note text.\n\nNOTE: {note.title}\n{content}"
    try:
        # Use context manager for proper client lifecycle management
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
            summary = (response.text or "").strip()
        if not summary:
            raise ValueError("Gemini returned an empty summary.")
        return {"status": "success", "summary": summary}
    except Exception as error:
        safe_error = str(error).replace(api_key, "[redacted]")
        raise HTTPException(status_code=502, detail=f"Summary generation failed: {safe_error}") from error
