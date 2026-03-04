from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()

class Entry(Base):
    __tablename__ = "entries"

    id = Column(String, primary_key=True, index=True)
    date = Column(String, nullable=False) # ISO format string
    content = Column(Text, nullable=False)
    mood = Column(Integer, nullable=False)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=True)
    is_backdate = Column(Boolean, nullable=True)

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String, nullable=False) # week, month, year
    period_key = Column(String, nullable=False)
    date = Column(String, nullable=False) # ISO format string
    content = Column(Text, nullable=False)
    analysis_mode = Column(String, nullable=False)

class ProfileState(Base):
    __tablename__ = "profile_state"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./diary.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
