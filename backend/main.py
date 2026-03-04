import os
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import httpx

from models import SessionLocal, engine, init_db, Entry, Summary, ProfileState

load_dotenv()

app = FastAPI(title="Personalized Diary API")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
def startup_event():
    init_db()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- Schemas ----
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

# ---- API Endpoints ----

@app.get("/api/entries", response_model=List[EntryBase])
def get_entries(db: Session = Depends(get_db)):
    # Return entries, sorted by date descending ideally or let frontend handle
    entries = db.query(Entry).all()
    # Sort in memory for simplicity (frontend handles it too)
    return sorted(entries, key=lambda e: e.date, reverse=True)

@app.post("/api/entries", response_model=EntryBase)
def create_or_update_entry(entry: EntryBase, db: Session = Depends(get_db)):
    db_entry = db.query(Entry).filter(Entry.id == entry.id).first()
    if db_entry:
        db_entry.date = entry.date
        db_entry.content = entry.content
        db_entry.mood = entry.mood
        db_entry.question = entry.question
        db_entry.answer = entry.answer
        db_entry.is_backdate = entry.is_backdate
    else:
        db_entry = Entry(**entry.model_dump())
        db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: str, db: Session = Depends(get_db)):
    db_entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
    return {"ok": True}

@app.get("/api/profile", response_model=Optional[ProfileBase])
def get_profile(db: Session = Depends(get_db)):
    # Get the latest profile
    profile = db.query(ProfileState).order_by(ProfileState.id.desc()).first()
    if profile:
        return {"version": profile.version, "content": profile.content}
    return None

@app.post("/api/profile", response_model=ProfileBase)
def update_profile(profile: ProfileBase, db: Session = Depends(get_db)):
    new_state = ProfileState(version=profile.version, content=profile.content)
    db.add(new_state)
    db.commit()
    return profile

@app.get("/api/summaries", response_model=List[SummaryBase])
def get_summaries(db: Session = Depends(get_db)):
    summaries = db.query(Summary).all()
    return summaries

@app.post("/api/summaries", response_model=SummaryBase)
def create_summary(summary: SummaryBase, db: Session = Depends(get_db)):
    db_summary = Summary(**summary.model_dump())
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return summary

async def call_openrouter(request_data: dict) -> dict:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
        "HTTP-Referer": "http://localhost:5173", # Optional
        "X-Title": "Personalized Diary", # Optional
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=request_data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Error calling OpenRouter: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch response from OpenRouter.")

@app.post("/api/chat")
async def chat_proxy(req: ChatRequest):
    model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct:free")
    
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

    result = await call_openrouter(openrouter_req)

    # Return mimicking the Anthropic format slightly to keep frontend happy
    # Or just return the raw text
    try:
        content = result["choices"][0]["message"]["content"]
        return {"content": [{"text": content}]}
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=500, detail="Unexpected response format from OpenRouter.")
