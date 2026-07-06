import os
import re
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt

from models import (
    SessionLocal,
    engine,
    init_db,
    Entry,
    Summary,
    ProfileState,
    ProfileSnapshot,
    User,
    RecentObservation,
    ObservationSnapshot,
    MemoryItem,
)

load_dotenv()

# --- Security Config ---
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
DEFAULT_AI_BASE_URL = "https://api.deepseek.com/v1"
DEFAULT_AI_MODEL = "deepseek-chat"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- App Setup ---
app = FastAPI(title="Personalized Diary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    ensure_schema()

def ensure_schema():
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    with engine.begin() as conn:
        if "users" in table_names:
            user_cols = {c["name"] for c in inspector.get_columns("users")}
            if "api_base_url" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN api_base_url VARCHAR"))
            if "api_model" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN api_model VARCHAR"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Dependency ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


# ---- Schemas ----
class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class EntryBase(BaseModel):
    id: str
    date: str
    content: str
    mood: int
    question: Optional[str] = None
    answer: Optional[str] = None
    is_backdate: Optional[bool] = None

class EntryUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None

class ProfileBase(BaseModel):
    version: str
    content: str
    change_note: Optional[str] = None
    source: Optional[str] = None

class ProfileSnapshotOut(ProfileBase):
    id: int
    created_at: str

class SummaryBase(BaseModel):
    type: str # week, month, year
    period_key: str
    date: str
    content: str
    analysis_mode: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    system: str
    messages: List[ChatMessage]
    max_tokens: int = 800
    use_memory: bool = True

class ObservationCreate(BaseModel):
    content: str

class ObservationOut(BaseModel):
    id: int
    content: str
    created_at: str
    last_seen_at: str
    times_seen: int

class MemoryOut(BaseModel):
    id: int
    source_type: str
    source_id: Optional[str]
    date: Optional[str]
    title: Optional[str]
    content: str
    importance: int
    created_at: str

def add_memory(
    db: Session,
    user_id: int,
    source_type: str,
    content: str,
    source_id: Optional[str] = None,
    date: Optional[str] = None,
    title: Optional[str] = None,
    importance: int = 1,
):
    if not content:
        return
    clipped = content.strip()[:2400]
    item = MemoryItem(
        user_id=user_id,
        source_type=source_type,
        source_id=source_id,
        date=date,
        title=title,
        content=clipped,
        importance=importance,
    )
    db.add(item)

def tokenize_for_memory(text_value: str):
    return set(re.findall(r"[\w\u4e00-\u9fff]{2,}", (text_value or "").lower()))

def retrieve_memory(db: Session, user_id: int, query: str, limit: int = 6):
    tokens = tokenize_for_memory(query)
    items = db.query(MemoryItem).filter(MemoryItem.user_id == user_id).order_by(MemoryItem.created_at.desc()).limit(200).all()
    scored = []
    for item in items:
        haystack = " ".join([item.title or "", item.content or "", item.source_type or ""])
        overlap = len(tokens & tokenize_for_memory(haystack))
        recency_bonus = 1 if item.source_type in {"entry", "summary"} else 0
        score = overlap * 3 + (item.importance or 1) + recency_bonus
        if score > 1:
            scored.append((score, item))
    scored.sort(key=lambda pair: (pair[0], pair[1].created_at), reverse=True)
    return [item for _, item in scored[:limit]]

def memory_to_text(items: List[MemoryItem]):
    if not items:
        return ""
    lines = []
    for item in items:
        label = item.title or item.source_type
        when = f" · {item.date}" if item.date else ""
        lines.append(f"- [{label}{when}] {item.content[:700]}")
    return "\n".join(lines)

# ---- API Endpoints ----

@app.get("/")
def health_check():
    return {"status": "active", "message": "Keeping the AI brain awake!"}

@app.post("/api/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "api_key": current_user.api_key,
        "api_base_url": current_user.api_base_url or os.environ.get("AI_BASE_URL", DEFAULT_AI_BASE_URL),
        "api_model": current_user.api_model or os.environ.get("AI_MODEL", DEFAULT_AI_MODEL),
        "usage_count": current_user.usage_count,
        "is_unlimited": current_user.is_unlimited
    }

@app.post("/api/me/apikey")
def update_api_key(api_key: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.api_key = api_key
    db.commit()
    return {"status": "success"}

@app.get("/api/entries", response_model=List[EntryBase])
def get_entries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = db.query(Entry).filter(Entry.user_id == current_user.id).all()
    return sorted(entries, key=lambda e: e.date, reverse=True)

@app.post("/api/entries", response_model=EntryBase)
def create_or_update_entry(entry: EntryBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(Entry).filter(Entry.id == entry.id, Entry.user_id == current_user.id).first()
    if db_entry:
        db_entry.date = entry.date
        db_entry.content = entry.content
        db_entry.mood = entry.mood
        db_entry.question = entry.question
        db_entry.answer = entry.answer
        db_entry.is_backdate = entry.is_backdate
    else:
        # Prevent users from overwriting another user's entry if they guess the ID
        existing = db.query(Entry).filter(Entry.id == entry.id).first()
        if existing:
            raise HTTPException(status_code=403, detail="Not authorized to modify this entry")
            
        data = entry.model_dump()
        db_entry = Entry(**data, user_id=current_user.id)
        db.add(db_entry)
    add_memory(
        db,
        current_user.id,
        "entry",
        f"日记：{entry.content}\n反思问题：{entry.question or '无'}\n回答：{entry.answer or '未作答'}",
        source_id=entry.id,
        date=entry.date,
        title=f"日记 mood={entry.mood}",
        importance=2,
    )
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_entry = db.query(Entry).filter(Entry.id == entry_id, Entry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"ok": True}

@app.get("/api/profile", response_model=Optional[ProfileBase])
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(ProfileState).filter(ProfileState.user_id == current_user.id).order_by(ProfileState.id.desc()).first()
    if profile:
        return {"version": profile.version, "content": profile.content}
    return None

@app.post("/api/profile", response_model=ProfileBase)
def update_profile(profile: ProfileBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(ProfileState).filter(ProfileState.user_id == current_user.id).first()
    if existing:
        existing.version = profile.version
        existing.content = profile.content
    else:
        new_state = ProfileState(version=profile.version, content=profile.content, user_id=current_user.id)
        db.add(new_state)
    snapshot = ProfileSnapshot(
        version=profile.version,
        content=profile.content,
        change_note=profile.change_note,
        source=profile.source or "manual",
        user_id=current_user.id,
    )
    db.add(snapshot)
    add_memory(
        db,
        current_user.id,
        "profile",
        profile.content,
        source_id=profile.version,
        date=datetime.utcnow().isoformat(),
        title=f"Persona {profile.version}",
        importance=4,
    )
    db.commit()
    return profile

@app.get("/api/profile/history", response_model=List[ProfileSnapshotOut])
def get_profile_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshots = db.query(ProfileSnapshot).filter(ProfileSnapshot.user_id == current_user.id).order_by(ProfileSnapshot.created_at.desc()).all()
    return [{
        "id": s.id,
        "version": s.version,
        "content": s.content,
        "change_note": s.change_note,
        "source": s.source,
        "created_at": s.created_at.isoformat(),
    } for s in snapshots]

@app.get("/api/summaries", response_model=List[SummaryBase])
def get_summaries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    summaries = db.query(Summary).filter(Summary.user_id == current_user.id).all()
    return summaries

@app.post("/api/summaries", response_model=SummaryBase)
def create_summary(summary: SummaryBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = summary.model_dump()
    db_summary = Summary(**data, user_id=current_user.id)
    db.add(db_summary)
    add_memory(
        db,
        current_user.id,
        "summary",
        summary.content,
        source_id=summary.period_key,
        date=summary.date,
        title=f"{summary.type} review {summary.period_key}",
        importance={"week": 3, "month": 4, "year": 5}.get(summary.type, 3),
    )
    db.commit()
    db.refresh(db_summary)
    return summary

@app.get("/api/observations", response_model=List[ObservationOut])
def get_observations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    obs = db.query(RecentObservation).filter(RecentObservation.user_id == current_user.id).order_by(RecentObservation.created_at.desc()).all()
    return [{
        "id": o.id,
        "content": o.content,
        "created_at": o.created_at.isoformat(),
        "last_seen_at": o.last_seen_at.isoformat(),
        "times_seen": o.times_seen,
    } for o in obs]

@app.get("/api/memories", response_model=List[MemoryOut])
def get_memories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memories = db.query(MemoryItem).filter(MemoryItem.user_id == current_user.id).order_by(MemoryItem.created_at.desc()).limit(200).all()
    return [{
        "id": m.id,
        "source_type": m.source_type,
        "source_id": m.source_id,
        "date": m.date,
        "title": m.title,
        "content": m.content,
        "importance": m.importance,
        "created_at": m.created_at.isoformat(),
    } for m in memories]

@app.post("/api/observations", response_model=ObservationOut)
def create_observation(obs: ObservationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_obs = RecentObservation(content=obs.content, user_id=current_user.id)
    db.add(new_obs)
    db.flush()
    db.add(ObservationSnapshot(user_id=current_user.id, observation_id=new_obs.id, content=obs.content, event="created"))
    add_memory(db, current_user.id, "observation", obs.content, source_id=str(new_obs.id), title="近期观察", importance=3)
    db.commit()
    db.refresh(new_obs)
    return {
        "id": new_obs.id,
        "content": new_obs.content,
        "created_at": new_obs.created_at.isoformat(),
        "last_seen_at": new_obs.last_seen_at.isoformat(),
        "times_seen": new_obs.times_seen,
    }

@app.post("/api/observations/{obs_id}/seen", response_model=ObservationOut)
def mark_observation_seen(obs_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Called during monthly review when an observation is found to have appeared again.
    Increments times_seen and updates last_seen_at to now."""
    obs = db.query(RecentObservation).filter(
        RecentObservation.id == obs_id,
        RecentObservation.user_id == current_user.id
    ).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    obs.times_seen += 1
    obs.last_seen_at = datetime.utcnow()
    db.add(ObservationSnapshot(user_id=current_user.id, observation_id=obs.id, content=obs.content, event="seen_again"))
    add_memory(db, current_user.id, "observation", obs.content, source_id=str(obs.id), title="重复确认的近期观察", importance=4)
    db.commit()
    db.refresh(obs)
    return {
        "id": obs.id,
        "content": obs.content,
        "created_at": obs.created_at.isoformat(),
        "last_seen_at": obs.last_seen_at.isoformat(),
        "times_seen": obs.times_seen,
    }

@app.delete("/api/observations/{obs_id}")
def delete_observation(obs_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove an observation — called when it expires (>60 days, not seen again) or is promoted to core profile."""
    obs = db.query(RecentObservation).filter(
        RecentObservation.id == obs_id,
        RecentObservation.user_id == current_user.id
    ).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    db.add(ObservationSnapshot(user_id=current_user.id, observation_id=obs.id, content=obs.content, event="deleted"))
    db.delete(obs)
    db.commit()
    return {"ok": True}

@app.post("/api/chat")
async def chat_proxy(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = current_user.api_model or os.environ.get("AI_MODEL") or os.environ.get("DEEPSEEK_MODEL") or DEFAULT_AI_MODEL
    base_url = (current_user.api_base_url or os.environ.get("AI_BASE_URL") or os.environ.get("DEEPSEEK_BASE_URL") or DEFAULT_AI_BASE_URL).rstrip("/")
    
    # Check whose API key to use
    api_key_to_use = current_user.api_key
    
    if not api_key_to_use:
        # Use server key
        api_key_to_use = os.environ.get("AI_API_KEY") or os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENROUTER_API_KEY")
        if not api_key_to_use:
            raise HTTPException(status_code=500, detail="Server AI key is missing. Set AI_API_KEY or DEEPSEEK_API_KEY.")
            
        # Quota check: only block if NOT unlimited AND over limit
        if not current_user.is_unlimited and current_user.usage_count >= 10:
            raise HTTPException(status_code=403, detail="Free usage limit exceeded. Please add your own DeepSeek API key in Settings.")
        
        # Increment usage for everyone (tracking purpose, even for unlimited)
        current_user.usage_count += 1
        db.commit()
    
    # Format messages array to include system prompt correctly for openrouter/anthropic/llama
    messages = []
    system_content = req.system or ""
    if req.use_memory:
        query_text = "\n".join([m.content for m in req.messages if m.role == "user"])
        memories = retrieve_memory(db, current_user.id, query_text)
        memory_block = memory_to_text(memories)
        if memory_block:
            system_content = f"{system_content}\n\n【可检索长期记忆/RAG上下文】\n{memory_block}\n\n使用原则：这些是用户过去日记、复盘、观察和persona版本中的相关片段。只在确实相关时使用，不要编造未出现的信息。"

    if system_content:
        messages.append({"role": "system", "content": system_content})

    for m in req.messages:
        # Basic validation: only allow 'user' and 'assistant' in message history
        if m.role not in ["user", "assistant"]:
            continue
            
        content = m.content
        if m.role == "user":
            # Demarcate user content to prevent prompt injection
            content = f"[USER CONTENT START]\n{content}\n[USER CONTENT END]"
            
        messages.append({"role": m.role, "content": content})

    openrouter_req = {
        "model": model,
        "messages": messages,
        "max_tokens": req.max_tokens
    }

    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key_to_use}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=openrouter_req)
            response.raise_for_status()
            result = response.json()
    except Exception as e:
        print(f"Error calling AI provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch response from AI provider.")

    try:
        content = result["choices"][0]["message"]["content"]
        return {"content": [{"text": content}]}
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=500, detail="Invalid response format from AI provider.")

# ── ADMIN ──
class PromoteRequest(BaseModel):
    username: str
    is_unlimited: bool
    admin_key: str

@app.post("/api/admin/unlimited")
async def toggle_unlimited(req: PromoteRequest, db: Session = Depends(get_db)):
    # Simple check against .env
    expected_key = os.environ.get("ADMIN_SECRET", "change-me-locally")
    if req.admin_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid admin key.")
    
    target_user = db.query(User).filter(User.username == req.username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    target_user.is_unlimited = req.is_unlimited
    db.commit()
    return {"message": f"User {req.username} is_unlimited set to {req.is_unlimited}"}
