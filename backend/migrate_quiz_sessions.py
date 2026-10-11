"""
Database migration script to add quiz session tables.
Run this once to create the new tables.
"""

from database import engine, Base
from models import QuizSession, QuizAttempt

def migrate():
    print("Creating quiz session tables...")
    Base.metadata.create_all(bind=engine, tables=[
        QuizSession.__table__,
        QuizAttempt.__table__
    ])
    print("✓ Tables created successfully!")
    print("  - quiz_sessions")
    print("  - quiz_attempts")

if __name__ == "__main__":
    migrate()
