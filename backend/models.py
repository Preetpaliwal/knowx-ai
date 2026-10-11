from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
import json
from database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Float, nullable=False)  # Size in bytes
    content = Column(Text, nullable=True)  # Extracted text content
    excerpt = Column(String(500), nullable=True)  # Short excerpt for preview
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "fileName": self.file_name,
            "fileType": self.file_type,
            "fileSize": self.file_size,
            "excerpt": self.excerpt,
            "content": self.content,
            "date": self.created_at.strftime("%b %d") if self.created_at else "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(20), nullable=False)
    question_count = Column(Integer, nullable=False)
    questions_json = Column(Text, nullable=False)
    answers_json = Column(Text, nullable=False)
    score = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        questions = json.loads(self.questions_json or "[]")
        answers = json.loads(self.answers_json or "[]")
        return {
            "id": str(self.id),
            "topic": self.topic,
            "difficulty": self.difficulty,
            "questionCount": self.question_count,
            "questions": questions,
            "answers": answers,
            "score": self.score,
            "percentage": round((self.score / self.question_count) * 100) if self.question_count else 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class RevisionTask(Base):
    __tablename__ = "revision_tasks"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(255), nullable=False)
    note_id = Column(Integer, nullable=True)
    due_date = Column(String(20), nullable=False)
    priority = Column(String(20), nullable=False, default="medium")
    estimated_minutes = Column(Integer, nullable=False, default=25)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id), "topic": self.topic, "noteId": str(self.note_id) if self.note_id else None,
            "date": self.due_date, "priority": self.priority, "estimatedMinutes": self.estimated_minutes,
            "status": self.status, "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class RevisionSession(Base):
    __tablename__ = "revision_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, nullable=True)
    minutes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    settings_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(100), nullable=False, default="default")
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    note_ids_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "role": self.role,
            "content": self.content,
            "noteIds": json.loads(self.note_ids_json or "[]"),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    host_name = Column(String(255), nullable=False, default="Host")
    quiz_topic = Column(String(255), nullable=False)
    quiz_difficulty = Column(String(20), nullable=False)
    questions_json = Column(Text, nullable=False)
    join_code = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="waiting")  # waiting, active, completed
    max_participants = Column(Integer, nullable=False, default=50)
    current_question = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "hostName": self.host_name,
            "quizTopic": self.quiz_topic,
            "quizDifficulty": self.quiz_difficulty,
            "questions": json.loads(self.questions_json or "[]"),
            "joinCode": self.join_code,
            "status": self.status,
            "maxParticipants": self.max_participants,
            "currentQuestion": self.current_question,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "endedAt": self.ended_at.isoformat() if self.ended_at else None,
        }


class CompetitionParticipant(Base):
    __tablename__ = "competition_participants"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, nullable=False, index=True)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    display_name = Column(String(100), nullable=False)
    avatar = Column(String(500), nullable=True)
    final_score = Column(Integer, nullable=False, default=0)
    final_rank = Column(Integer, nullable=True)
    correct_answers = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_connected = Column(Integer, nullable=False, default=1)  # SQLite uses int for boolean

    def to_dict(self):
        return {
            "id": str(self.id),
            "competitionId": str(self.competition_id),
            "sessionId": self.session_id,
            "displayName": self.display_name,
            "avatar": self.avatar,
            "finalScore": self.final_score,
            "finalRank": self.final_rank,
            "correctAnswers": self.correct_answers,
            "joinedAt": self.joined_at.isoformat() if self.joined_at else None,
            "isConnected": bool(self.is_connected),
        }


class CompetitionAnswer(Base):
    __tablename__ = "competition_answers"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, nullable=False, index=True)
    participant_id = Column(Integer, nullable=False, index=True)
    question_index = Column(Integer, nullable=False)
    selected_answer = Column(String(500), nullable=False)
    is_correct = Column(Integer, nullable=False)  # SQLite uses int for boolean
    response_time_ms = Column(Integer, nullable=False)  # milliseconds
    points = Column(Integer, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "competitionId": str(self.competition_id),
            "participantId": str(self.participant_id),
            "questionIndex": self.question_index,
            "selectedAnswer": self.selected_answer,
            "isCorrect": bool(self.is_correct),
            "responseTimeMs": self.response_time_ms,
            "points": self.points,
            "answeredAt": self.answered_at.isoformat() if self.answered_at else None,
        }


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(20), nullable=False)
    questions_json = Column(Text, nullable=False)  # Includes answers for validation
    join_token = Column(String(64), unique=True, nullable=False, index=True)
    join_code = Column(String(10), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    max_participants = Column(Integer, nullable=True)  # NULL means unlimited
    timer_minutes = Column(Integer, nullable=True)  # NULL means no timer
    status = Column(String(20), nullable=False, default="active")  # active, closed, expired
    show_leaderboard = Column(Integer, nullable=False, default=1)  # SQLite uses int for boolean
    created_by = Column(String(100), nullable=False, default="Teacher")
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    def to_dict(self, include_answers=False):
        questions = json.loads(self.questions_json or "[]")
        if not include_answers:
            # Remove answer keys from questions for public view
            questions = [
                {
                    "question": q.get("question"),
                    "options": q.get("options", []),
                    "explanation": q.get("explanation")  # Can be shown after submission
                }
                for q in questions
            ]
        
        return {
            "id": str(self.id),
            "title": self.title,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "questions": questions,
            "joinToken": self.join_token,
            "joinCode": self.join_code,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "maxParticipants": self.max_participants,
            "timerMinutes": self.timer_minutes,
            "status": self.status,
            "showLeaderboard": bool(self.show_leaderboard),
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "closedAt": self.closed_at.isoformat() if self.closed_at else None,
        }


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, index=True)
    participant_name = Column(String(100), nullable=False)
    answers_json = Column(Text, nullable=False)  # Student's selected answers
    score = Column(Integer, nullable=False, default=0)
    percentage = Column(Float, nullable=False, default=0.0)
    time_taken_seconds = Column(Integer, nullable=True)  # Time taken to complete
    rank = Column(Integer, nullable=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "sessionId": str(self.session_id),
            "participantName": self.participant_name,
            "answers": json.loads(self.answers_json or "[]"),
            "score": self.score,
            "percentage": round(self.percentage, 2),
            "timeTakenSeconds": self.time_taken_seconds,
            "rank": self.rank,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
        }
