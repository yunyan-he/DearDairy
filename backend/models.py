from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("SUPABASE_URL", "sqlite:///./diary.db")
is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if is_sqlite else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # Custom API settings
    api_key = Column(String, nullable=True) # User's own DeepSeek-compatible API key
    api_base_url = Column(String, nullable=True)
    api_model = Column(String, nullable=True)
    usage_count = Column(Integer, default=0) # Tracks free usages (up to 10)
    is_unlimited = Column(Boolean, default=False) # Skip quota if True
    
    # Relationships
    entries = relationship("Entry", back_populates="owner")
    summaries = relationship("Summary", back_populates="owner")
    profile = relationship("ProfileState", back_populates="owner", uselist=False)
    profile_snapshots = relationship("ProfileSnapshot", back_populates="owner", cascade="all, delete-orphan")
    observations = relationship("RecentObservation", back_populates="owner", cascade="all, delete-orphan")
    memory_items = relationship("MemoryItem", back_populates="owner", cascade="all, delete-orphan")

class Entry(Base):
    __tablename__ = "entries"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False) # ISO format string
    content = Column(Text, nullable=False)
    mood = Column(Integer, nullable=False)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=True)
    is_backdate = Column(Boolean, nullable=True)
    
    owner = relationship("User", back_populates="entries")

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False) # week, month, year
    period_key = Column(String, nullable=False)
    date = Column(String, nullable=False) # ISO format string
    content = Column(Text, nullable=False)
    analysis_mode = Column(String, nullable=False)
    
    owner = relationship("User", back_populates="summaries")

class ProfileState(Base):
    __tablename__ = "profile_state"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    version = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="profile")

class ProfileSnapshot(Base):
    __tablename__ = "profile_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    version = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    change_note = Column(Text, nullable=True)
    source = Column(String, nullable=True) # onboarding, week_review, month_review, year_review, manual
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="profile_snapshots")

class RecentObservation(Base):
    __tablename__ = "recent_observations"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    content      = Column(Text, nullable=False)          # the observation text
    created_at   = Column(DateTime, default=datetime.utcnow)  # when first observed
    last_seen_at = Column(DateTime, default=datetime.utcnow)  # updated each time it's seen again
    times_seen   = Column(Integer, default=1)            # increments when monthly review finds it repeated

    owner = relationship("User", back_populates="observations")

class ObservationSnapshot(Base):
    __tablename__ = "observation_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    observation_id = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    event = Column(String, nullable=False) # created, seen_again, promoted, expired, deleted
    summary_period_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MemoryItem(Base):
    __tablename__ = "memory_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    source_type = Column(String, nullable=False) # entry, summary, observation, profile
    source_id = Column(String, nullable=True)
    date = Column(String, nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    importance = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="memory_items")

def init_db():
    Base.metadata.create_all(bind=engine)
