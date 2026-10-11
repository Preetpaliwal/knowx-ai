from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from dotenv import load_dotenv
from database import engine, Base
from routes import chat, notes, quiz, revision, settings, admin
from websocket_manager import socket_app, sio

BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(ENV_FILE)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
os.makedirs(BACKEND_DIR / "uploads", exist_ok=True)

app = FastAPI(
    title="StudyMate AI Backend",
    description="Backend API for StudyMate AI study assistant",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(revision.router, prefix="/api", tags=["revision"])
app.include_router(settings.router, prefix="/api", tags=["settings"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

# Import competition router
from routes import competition
app.include_router(competition.router, prefix="/api", tags=["competition"])

# Import quiz sessions router
from routes import quiz_sessions
app.include_router(quiz_sessions.router, prefix="/api", tags=["quiz-sessions"])


@app.on_event("startup")
async def check_gemini_configuration() -> None:
    print(f"Gemini API key configured: {bool(os.getenv('GEMINI_API_KEY'))}")

@app.get("/")
async def root():
    return {
        "message": "StudyMate AI Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount Socket.IO for WebSocket support
app.mount("/ws", socket_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
