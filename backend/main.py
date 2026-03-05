import os
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt

from models import SessionLocal, engine, init_db, Entry, Summary, ProfileState, User, RecentObservation

load_dotenv()

# --- Security Config ---
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

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

class ObservationCreate(BaseModel):
    content: str

class ObservationOut(BaseModel):
    id: int
    content: str
    created_at: str
    last_seen_at: str
    times_seen: int

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
        "usage_count": current_user.usage_count
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
    new_state = ProfileState(version=profile.version, content=profile.content, user_id=current_user.id)
    db.add(new_state)
    db.commit()
    return profile

@app.get("/api/summaries", response_model=List[SummaryBase])
def get_summaries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    summaries = db.query(Summary).filter(Summary.user_id == current_user.id).all()
    return summaries

@app.post("/api/summaries", response_model=SummaryBase)
def create_summary(summary: SummaryBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = summary.model_dump()
    db_summary = Summary(**data, user_id=current_user.id)
    db.add(db_summary)
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

@app.post("/api/observations", response_model=ObservationOut)
def create_observation(obs: ObservationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_obs = RecentObservation(content=obs.content, user_id=current_user.id)
    db.add(new_obs)
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
    db.delete(obs)
    db.commit()
    return {"ok": True}

@app.post("/api/chat")
async def chat_proxy(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct:free")
    
    # Check whose API key to use
    api_key_to_use = current_user.api_key
    
    if not api_key_to_use:
        # Check quota
        if current_user.usage_count >= 10:
            raise HTTPException(status_code=403, detail="Free usage limit exceeded. Please add your own OpenRouter API key in Settings.")
        
        # Use server key
        api_key_to_use = os.environ.get('OPENROUTER_API_KEY')
        if not api_key_to_use:
            raise HTTPException(status_code=500, detail="Server OpenRouter key is missing.")
            
        # Increment quota only if no exception
        current_user.usage_count += 1
        db.commit()
    
    # Format messages array to include system prompt correctly for openrouter/anthropic/llama
    messages = []
    if req.system:
        messages.append({"role": "system", "content": req.system})
    
    messages.extend([{"role": m.role, "content": m.content} for m in req.messages])

    openrouter_req = {
        "model": model,
        "messages": messages,
        "max_tokens": req.max_tokens
    }

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key_to_use}",
        "HTTP-Referer": "https://deardiary.app",
        "X-Title": "Personalized Diary",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=openrouter_req)
            response.raise_for_status()
            result = response.json()
    except Exception as e:
        print(f"Error calling OpenRouter: {e}")
        # rollback increment if the call failed
        if api_key_to_use == os.environ.get('OPENROUTER_API_KEY'):
             current_user.usage_count -= 1
             db.commit()
        raise HTTPException(status_code=500, detail="Failed to fetch response from AI provider.")

    try:
        content = result["choices"][0]["message"]["content"]
        return {"content": [{"text": content}]}
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=500, detail="Unexpected response format from OpenRouter.")
