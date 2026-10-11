import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Calculate absolute path for SQLite file so execution directory doesn't matter
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///./"):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_file = db_url.replace("sqlite:///./", "")
    abs_db_path = os.path.join(base_dir, db_file)
    db_url = f"sqlite:///{abs_db_path}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
