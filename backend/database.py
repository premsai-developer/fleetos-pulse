import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Determine base directory for SQLite fallback
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'fleetos_pulse.db')}"

# Get database URL from environment or fallback to SQLite
raw_db_url = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# Fix legacy Heroku/Railway/Render postgres:// prefix for SQLAlchemy
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = raw_db_url

# Configure engine connect_args based on DB dialect
engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

