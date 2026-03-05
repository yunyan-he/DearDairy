import { useState, useEffect, useRef, useCallback } from "react";
import { translations, getLang, setLang } from "./i18n";

// ══════════════════════════════════════════════════════
// SIMPLE MARKDOWN PARSER
// ══════════════════════════════════════════════════════
function parseMarkdown(text) {
  if (!text) return "";

  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:rgba(210,215,255,0.95);margin:16px 0 8px 0;letter-spacing:.02em;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;color:rgba(220,225,255,0.95);margin:18px 0 10px 0;letter-spacing:.03em;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:600;color:rgba(230,235,255,0.98);margin:20px 0 12px 0;letter-spacing:.04em;">$1</h1>')
    // Bold with Chinese brackets
    .replace(/【(.+?)】/g, '<strong style="color:rgba(200,210,255,0.95);font-weight:600;">【$1】</strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:rgba(210,215,255,0.95);">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:rgba(200,205,240,0.9);">$1</em>')
    // Bullet points
    .replace(/^[-*] (.+)$/gm, '<div style="margin:6px 0 6px 16px;position:relative;padding-left:12px;"><span style="position:absolute;left:0;color:rgba(140,160,255,0.6);">·</span>$1</div>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return html;
}

// ══════════════════════════════════════════════════════
// DEFAULT PERSONA PROMPT — will evolve over time via AI
// ══════════════════════════════════════════════════════
const DEFAULT_PROFILE_ZH = `【用户性格档案 v1.0】

核心特征：
- 内向，喜欢独处，思维深度好但容易overthinking
- 计划上是完美主义，行动上是懦夫——两者形成强烈反差
- 三天打鱼两天晒网，坚持是最大挑战

主要困境：
- 拖延：明知该做却迟迟不行动，常用"等准备好了"来逃避
- 容易被同龄人比较影响情绪，嫉妒心会打乱自己的节奏
- 主线任务不清晰，在迷茫中内耗
- 遇到挑战第一反应是逃避、转移注意力

成长动力与障碍：
- 极度渴望改变和成长，但又害怕失败
- 用完美主义保护自己不去开始
- 最想突破：克服拖延，建立真正的行动力

与用户互动原则：
- 反思问题风格：直接但有温度，能指出盲点但不制造焦虑
- 做得好时真诚鼓励，情绪糟糕时先安慰再引导
- 不溺爱：失败了不能让她忘记教训，但也不能让她一直沉浸在自责中
- 绝不让用户带着焦虑和自责入睡

注：此档案会随着AI复盘后自动更新，记录用户真实的成长轨迹。`;

const DEFAULT_PROFILE_EN = `[User Personality Profile v1.0]

Core Traits:
- Introverted, prefers solitude, deep thinker but prone to overthinking
- Perfectionist in planning, avoidant in execution — a strong contrast
- Inconsistent follow-through; consistency is the biggest challenge

Main Struggles:
- Procrastination: knows what to do but delays, often hiding behind "not ready yet"
- Easily affected by peer comparisons; jealousy disrupts personal rhythm
- Unclear on main priorities; drains energy in confusion
- First reaction to challenges is escape or distraction

Growth & Obstacles:
- Deeply wants to change and grow, but fears failure
- Uses perfectionism to avoid starting
- Core goal: overcome procrastination, build real momentum

Interaction Principles:
- Reflection style: direct but warm, points out blind spots without creating anxiety
- Genuine encouragement when doing well; comfort before guidance when struggling
- No coddling: failure has lessons, but don't let her drown in self-blame
- Never let her go to sleep with unresolved anxiety or self-criticism

Note: This profile auto-updates after each AI review, tracking real growth over time.`;

function getDefaultProfile(lang) {
  return lang === "en" ? DEFAULT_PROFILE_EN : DEFAULT_PROFILE_ZH;
}

// ══════════════════════════════════════════════════════
// AUTHENTICATED FETCH WRAPPER
// ══════════════════════════════════════════════════════
const API_BASE = import.meta.env.PROD ? "https://diary-backend-api.onrender.com" : "";

async function authedFetch(endpoint, options = {}) {
  const token = localStorage.getItem("diary_token");
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("diary_token");
    window.location.reload();
  }
  return response;
}

// ══════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════

async function saveEntry(entry) {
  await authedFetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
}
async function loadEntries() {
  try { const r = await authedFetch("/api/entries"); if (r.ok) return r.json(); } catch { }
  return [];
}
async function delEntry(id) {
  await authedFetch(`/api/entries/${id}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════
// AI
// ══════════════════════════════════════════════════════
async function callAI(system, user, maxTokens = 800) {
  const r = await authedFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.detail || "API Request Failed");
  }
  const d = await r.json();
  return d.content?.map(b => b.text || "").join("\n").trim() || "";
}

// ══════════════════════════════════════════════════════
// STREAK
// ══════════════════════════════════════════════════════
function calcStreak(entries) {
  if (!entries.length) return 0;
  const days = new Set(entries.map(e => new Date(e.date).toDateString()));
  let s = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) s++;
    else if (i > 0) break;
  }
  return s;
}

// ══════════════════════════════════════════════════════
// MOODS
// ══════════════════════════════════════════════════════
// MOODS are lang-dependent — built dynamically
function getMoods(t) {
  const labels = t.write.moods;
  return [
    { v: 1, emoji: "🌧", label: labels[0] },
    { v: 2, emoji: "🌫", label: labels[1] },
    { v: 3, emoji: "🌤", label: labels[2] },
    { v: 4, emoji: "🌟", label: labels[3] },
    { v: 5, emoji: "✨", label: labels[4] },
  ];
}

// ══════════════════════════════════════════════════════
// AURORA CANVAS BACKGROUND
// ══════════════════════════════════════════════════════
function AuroraBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, t = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Aurora bands
    const bands = [
      { color: [80, 200, 255], y: 0.25, amp: 0.06, freq: 0.7, speed: 0.004, opacity: 0.13 },
      { color: [140, 100, 255], y: 0.35, amp: 0.05, freq: 0.9, speed: 0.003, opacity: 0.11 },
      { color: [60, 220, 180], y: 0.20, amp: 0.04, freq: 1.1, speed: 0.005, opacity: 0.09 },
      { color: [180, 80, 255], y: 0.45, amp: 0.07, freq: 0.6, speed: 0.002, opacity: 0.10 },
      { color: [100, 180, 255], y: 0.15, amp: 0.03, freq: 1.3, speed: 0.006, opacity: 0.08 },
    ];

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      // Base: deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0818");
      bg.addColorStop(0.4, "#0d1228");
      bg.addColorStop(0.7, "#0f1635");
      bg.addColorStop(1, "#080c1e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Nebula glow orbs
      const nebulaPositions = [
        { x: 0.15, y: 0.3, r: 0.35, c: [60, 30, 120] },
        { x: 0.75, y: 0.2, r: 0.28, c: [20, 60, 140] },
        { x: 0.5, y: 0.6, r: 0.22, c: [80, 20, 100] },
        { x: 0.88, y: 0.7, r: 0.2, c: [20, 80, 120] },
      ];
      nebulaPositions.forEach(n => {
        const pulse = 1 + 0.08 * Math.sin(t * 0.4 + n.x * 3);
        const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * W * pulse);
        g.addColorStop(0, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},0.18)`);
        g.addColorStop(0.5, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},0.06)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      // Aurora bands
      bands.forEach(b => {
        const steps = 120;
        const bandH = H * 0.12;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * W;
          const wave = Math.sin(i * b.freq * 0.08 + t * b.speed * 60) * b.amp * H
            + Math.sin(i * b.freq * 0.13 + t * b.speed * 40 + 1.5) * b.amp * H * 0.5;
          const y = b.y * H + wave;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) {
          const x = (i / steps) * W;
          const wave = Math.sin(i * b.freq * 0.08 + t * b.speed * 60) * b.amp * H
            + Math.sin(i * b.freq * 0.13 + t * b.speed * 40 + 1.5) * b.amp * H * 0.5;
          const y = b.y * H + wave + bandH;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(0, b.y * H - 20, 0, b.y * H + bandH + 20);
        g.addColorStop(0, `rgba(${b.color.join(",")},0)`);
        g.addColorStop(0.3, `rgba(${b.color.join(",")},${b.opacity})`);
        g.addColorStop(0.6, `rgba(${b.color.join(",")},${b.opacity * 0.7})`);
        g.addColorStop(1, `rgba(${b.color.join(",")},0)`);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Stars
      stars.forEach(s => {
        const alpha = s.alpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ══════════════════════════════════════════════════════
// GLASS PANEL
// ══════════════════════════════════════════════════════
const Glass = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: "rgba(20,24,60,0.68)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(140,160,255,0.22)",
    borderRadius: 12,
    ...style,
  }}>{children}</div>
);

// ══════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════
export default function App() {
  // ── Language ──
  const [lang, setLangState] = useState(getLang); // null = not chosen yet
  const t = lang ? translations[lang] : translations["zh"]; // fallback while choosing
  const MOODS = getMoods(t);

  const switchLang = (newLang) => {
    setLang(newLang);
    setLangState(newLang);
  };
  const [authToken, setAuthToken] = useState(localStorage.getItem("diary_token") || null);
  const [showAuthModal, setShowAuthModal] = useState(!authToken);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // User Settings state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [usageCount, setUsageCount] = useState(0);

  const [view, setView] = useState("write"); // write | history | summary | settings
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState(() => getDefaultProfile(getLang() || "zh"));
  const [profileVersion, setProfileVersion] = useState("v1.0");
  const [summaryHistory, setSummaryHistory] = useState([]); // { type, date, content, coveredDates }

  // Onboarding vs Main App
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0=intro, 1-7=questions, 8=generating
  const [obAnswers, setObAnswers] = useState({ q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "" });

  // Recent observations (Plan B structured storage)
  const [observations, setObservations] = useState([]);

  // Reminder bubble
  const [reminder, setReminder] = useState(null); // { type: 'week'|'month'|'year', label: string }
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Write state
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isBackdate, setIsBackdate] = useState(false);  // backdate mode
  const [backdateDay, setBackdateDay] = useState(1);    // 1=yesterday, 2=2 days ago, 3=3 days ago
  const [lateNightNudge, setLateNightNudge] = useState(false); // 22:00+ nudge

  // AI question (generated after save)
  const [aiQuestion, setAiQuestion] = useState(null);
  const [aiAnswer, setAiAnswer] = useState("");
  const [generatingQ, setGeneratingQ] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Voice
  const [recording, setRecording] = useState(false);
  const [recTarget, setRecTarget] = useState("content");
  const [voiceErr, setVoiceErr] = useState("");
  const recRef = useRef(null);
  const voiceOK = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // History
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // Summary
  const [sumType, setSumType] = useState("week");
  const [sumText, setSumText] = useState("");
  const [sumLoading, setSumLoading] = useState(false);

  // ── Auth Handling ──
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError("");
    const url = authMode === "login" ? "/api/login" : "/api/register";
    try {
      let body, headers;
      if (authMode === "login") {
        body = new URLSearchParams();
        body.append("username", authUsername);
        body.append("password", authPassword);
        headers = { "Content-Type": "application/x-www-form-urlencoded" };
      } else {
        body = JSON.stringify({ username: authUsername, password: authPassword });
        headers = { "Content-Type": "application/json" };
      }

      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      const r = await fetch(fullUrl, { method: "POST", headers, body });

      let data;
      try {
        data = await r.json();
      } catch (err) {
        throw new Error(`服务器错误 (${r.status}): 请稍后重试或检查后端日志`);
      }

      if (!r.ok) throw new Error(data.detail || "Authentication failed");

      localStorage.setItem("diary_token", data.access_token);
      setAuthToken(data.access_token);
      setShowAuthModal(false);
      setAuthPassword(""); // clear password from state
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("diary_token");
    setAuthToken(null);
    setShowAuthModal(true);
    setEntries([]);
    setSummaryHistory([]);
  };

  // Load existing summary when switching to summary view or changing sumType
  useEffect(() => {
    if (view !== "summary" || !summaryHistory.length) return;

    // Find most recent summary of this type
    const recentSummary = summaryHistory
      .filter(s => s.type === sumType)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (recentSummary) {
      setSumText(recentSummary.content);
    } else {
      setSumText("");
    }
  }, [view, sumType, summaryHistory]);

  useEffect(() => {
    if (!authToken) return;

    const fetchProfileState = async () => { try { const r = await authedFetch("/api/profile"); if (r.ok) return r.json(); } catch { } return null; };
    const loadSummaries = async () => { try { const r = await authedFetch("/api/summaries"); if (r.ok) return r.json(); } catch { } return []; };
    const loadMe = async () => { try { const r = await authedFetch("/api/me"); if (r.ok) return r.json(); } catch { } return null; };
    const loadObservations = async () => { try { const r = await authedFetch("/api/observations"); if (r.ok) return r.json(); } catch { } return []; };

    Promise.all([
      loadEntries(),
      fetchProfileState(),
      Promise.resolve(localStorage.getItem("last-reminder-dismissed")),
      loadSummaries(),
      loadMe(),
      loadObservations(),
    ]).then(([e, profileState, lastDismissed, summaries, me, obs]) => {
      setEntries(e);
      setStreak(calcStreak(e));
      if (profileState?.content) {
        setProfile(profileState.content);
        setProfileVersion(profileState.version || "v1.0");
      } else {
        setNeedsOnboarding(true);
      }
      if (summaries) setSummaryHistory(summaries);
      if (me) {
        setApiKeyInput(me.api_key || "");
        setUsageCount(me.usage_count || 0);
      }
      if (obs) setObservations(obs);
      setLoading(false);

      // Determine if a reminder bubble should show
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun,1=Mon
      const dayOfMonth = now.getDate();
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      const todayKey = now.toDateString();

      // Don't show if already dismissed today
      if (lastDismissed === todayKey) return;

      let rem = null;
      if (dayOfYear === 1) rem = { type: "year", label: "新年第一天 🎆", sub: "是时候回顾过去一年了" };
      else if (dayOfMonth === 1) rem = { type: "month", label: "新月开始 🌙", sub: "回顾上个月，迎接新的一月" };
      else if (dayOfWeek === 1) rem = { type: "week", label: "周一到了 ☀️", sub: "花几分钟复盘上周，让这周更清醒" };

      if (rem) setReminder(rem);

      // Late-night nudge: if it's past 22:00 and haven't written today
      const hour = now.getHours();
      const wroteToday = e.some(en => new Date(en.date).toDateString() === now.toDateString());
      if (hour >= 22 && !wroteToday) setLateNightNudge(true);
    });
  }, [authToken]);

  const dismissReminder = async () => {
    setReminderDismissed(true);
    localStorage.setItem("last-reminder-dismissed", new Date().toDateString());
    setTimeout(() => setReminder(null), 400);
  };

  const goToSummaryFromReminder = (type) => {
    setSumType(type);
    setView("summary");
    dismissReminder();
  };

  // ── Voice ──
  const startRec = useCallback((target) => {
    setVoiceErr("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceErr(t.write.voiceError); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = t.voiceLang;
    recRef.current = rec;
    setRecTarget(target); setRecording(true);
    let base = target === "content" ? content : aiAnswer;
    rec.onresult = (e) => {
      let fin = base, int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) { fin += e.results[i][0].transcript; base = fin; }
        else int = e.results[i][0].transcript;
      }
      if (target === "content") setContent(fin + int); else setAiAnswer(fin + int);
    };
    rec.onerror = e => { setVoiceErr(`语音错误: ${e.error}`); setRecording(false); };
    rec.onend = () => setRecording(false);
    rec.start();
  }, [content, aiAnswer]);
  const stopRec = useCallback(() => { recRef.current?.stop(); setRecording(false); }, []);

  // ── Save entry → generate AI question ──
  const doSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    // Compute actual date (today or backdated)
    const entryDate = new Date();
    if (isBackdate) {
      entryDate.setDate(entryDate.getDate() - backdateDay);
      entryDate.setHours(22, 0, 0, 0); // pin to 22:00 of that day
    }

    const entry = {
      id: Date.now().toString(),
      date: entryDate.toISOString(),
      content: content.trim(),
      mood,
      question: null,
      answer: null,
      isBackdate: isBackdate || undefined,
    };
    await saveEntry(entry);
    const next = [entry, ...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(next); setStreak(calcStreak(next));
    setIsBackdate(false); setBackdateDay(1);
    setSaving(false); setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);

    // Generate personalized AI question
    setGeneratingQ(true);
    setAiQuestion(null);
    setAiAnswer("");
    try {
      const moodLabel = MOODS.find(m => m.v === mood)?.label || t.write.moods[2];
      const system = (lang === "en"
        ? `You are the user's personal growth companion who knows them deeply. Here is their personality profile:\n\n${profile}\n\nYour task: based on today's journal entry and mood, generate ONE personalized reflection question.\n\nRules:\n1. The question must be based on specific content from the entry, not generic\n2. Warm and conversational — like a friend who truly knows them, not an interrogator\n3. If mood is good, help deepen thinking; if mood is bad, start with a brief empathetic acknowledgment\n4. Never create anxiety, guilt, or self-blame\n5. The question should spark reflection without feeling heavy\n6. If they describe failure or laziness, help extract a lesson — don't punish\n7. Output only the question itself (with optional brief empathetic opener), max 60 words`
        : `你是用户的私人成长伙伴，了解她的一切。以下是她的性格档案：\n\n${profile}\n\n你的任务：根据用户今天写的日记内容和心情，生成一个专属反思问题。\n\n严格规则：\n1. 问题必须基于日记的具体内容，不能是泛泛而谈的通用问题\n2. 语气要有温度，就像一个懂你的朋友在问你\n3. 情绪好时引导她思考和深化；情绪糟糕时，先给一句温暖的感受确认，再提问\n4. 绝对不能制造焦虑、自责或内畦感\n5. 问题要能让她反思，但不能让她带着沉重感入睡\n6. 如果她描述了某个失败或不自律的行为，问题要帮她提炼教训\n7. 只输出问题本身，不超过60字`
      );
      const q = await callAI(system, lang === "en"
        ? `Today's mood: ${moodLabel}\n\nToday's journal:\n${entry.content}`
        : `今天的心情：${moodLabel}\n\n今天的日记：${entry.content}`
      );
      setAiQuestion(q);
      // Update entry with question
      entry.question = q;
      await saveEntry(entry);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, question: q } : e));
    } catch (err) {
      setAiQuestion(lang === "en"
        ? "Looking back at what you wrote today — what's one small thing you could do differently tomorrow?"
        : "今天写下来的这些，有什么是你觉得明天可以不一样的？"
      );
    }
    setGeneratingQ(false);
  };

  // ── Save answer to the AI question ──
  const saveAnswer = async () => {
    if (!aiAnswer.trim()) { setAiQuestion(null); setAiAnswer(""); return; }
    setSavingAnswer(true);
    const latestId = entries[0]?.id;
    if (latestId) {
      const updated = { ...entries[0], answer: aiAnswer.trim() };
      await saveEntry(updated);
      setEntries(prev => prev.map(e => e.id === latestId ? updated : e));
    }
    setSavingAnswer(false);
    setAiQuestion(null);
    setAiAnswer("");
    setContent("");
    setMood(3);
  };

  // ── Delete ──
  const doDelete = async (id) => {
    await delEntry(id);
    const next = entries.filter(e => e.id !== id);
    setEntries(next); setStreak(calcStreak(next));
    setExpanded(null); setConfirmDel(null);
  };

  // ── Summary + profile update (hierarchical) ──
  const genSummary = async () => {
    if (!entries.length) { setSumText("还没有日记记录，先去写几篇吧。"); return; }
    setSumLoading(true); setSumText("");

    // Compute date range with flexible boundaries
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let rangeStart = new Date();
    let rangeEnd = new Date();
    let periodLabel = "";
    let periodKey = "";

    if (sumType === "week") {
      // Flexible week logic:
      // - On Sunday: allow "this week" (Mon-Sun including today)
      // - On Mon-Sat: only "last week" (last Mon-Sun)
      const isOnSunday = dayOfWeek === 0;

      if (isOnSunday) {
        // This week: from this Monday to today (Sunday)
        rangeStart.setDate(now.getDate() - 6); // 6 days ago = last Monday
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setDate(now.getDate());
        rangeEnd.setHours(23, 59, 59, 999);
        periodLabel = `本周（${rangeStart.getMonth() + 1}/${rangeStart.getDate()}-${rangeEnd.getMonth() + 1}/${rangeEnd.getDate()}）`;
      } else {
        // Last week: from last Monday to last Sunday
        const daysFromLastSunday = dayOfWeek; // Mon=1, Tue=2, ..., Sat=6
        rangeEnd.setDate(now.getDate() - daysFromLastSunday); // last Sunday
        rangeEnd.setHours(23, 59, 59, 999);
        rangeStart.setDate(rangeEnd.getDate() - 6); // last Monday
        rangeStart.setHours(0, 0, 0, 0);
        periodLabel = `上周（${rangeStart.getMonth() + 1}/${rangeStart.getDate()}-${rangeEnd.getMonth() + 1}/${rangeEnd.getDate()}）`;
      }

      // Week number calculation (same week gets same periodKey)
      const midWeek = new Date((rangeStart.getTime() + rangeEnd.getTime()) / 2);
      const firstDayOfYear = new Date(midWeek.getFullYear(), 0, 1);
      const firstMonday = new Date(firstDayOfYear);
      const dayOfWeekFirst = firstDayOfYear.getDay();
      const daysToMonday = dayOfWeekFirst === 0 ? 1 : (8 - dayOfWeekFirst) % 7;
      firstMonday.setDate(firstDayOfYear.getDate() + daysToMonday);
      const weekNum = Math.ceil((midWeek - firstMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
      periodKey = `${midWeek.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
    } else if (sumType === "month") {
      // Last month: from 1st to last day of previous month
      rangeEnd.setMonth(now.getMonth(), 0); // last day of last month
      rangeEnd.setHours(23, 59, 59, 999);
      rangeStart.setMonth(rangeEnd.getMonth(), 1); // 1st of last month
      rangeStart.setHours(0, 0, 0, 0);
      periodKey = `${rangeStart.getFullYear()}-${(rangeStart.getMonth() + 1).toString().padStart(2, "0")}`;
      periodLabel = `上月（${rangeStart.getFullYear()}年${rangeStart.getMonth() + 1}月）`;
    } else {
      // Last year: from Jan 1 to Dec 31 of previous year
      rangeEnd.setFullYear(now.getFullYear() - 1, 11, 31); // Dec 31 last year
      rangeEnd.setHours(23, 59, 59, 999);
      rangeStart.setFullYear(now.getFullYear() - 1, 0, 1); // Jan 1 last year
      rangeStart.setHours(0, 0, 0, 0);
      periodKey = `${rangeStart.getFullYear()}`;
      periodLabel = `去年（${rangeStart.getFullYear()}年）`;
    }

    const filtered = entries.filter(e => {
      const d = new Date(e.date);
      return d >= rangeStart && d <= rangeEnd;
    });

    // Check thresholds
    const thresholds = { week: 5, month: 15, year: 180 };
    const minDays = thresholds[sumType];
    if (filtered.length < minDays) {
      setSumText(`${periodLabel}复盘需要至少 ${minDays} 天的记录，当前只有 ${filtered.length} 天。`);
      setSumLoading(false);
      return;
    }

    // Check if already generated for this period
    const alreadyExists = summaryHistory.some(s => s.type === sumType && s.periodKey === periodKey);
    if (alreadyExists) {
      setSumText(`${periodLabel}的复盘已经生成过了，不能重复生成。`);
      setSumLoading(false);
      return;
    }

    // Hierarchical analysis: check if we can use lower-level summaries
    let inputText = "";
    let analysisMode = "";

    if (sumType === "month") {
      // Try to find week summaries in last month
      const weekSummaries = summaryHistory.filter(s => {
        if (s.type !== "week") return false;
        const sDate = new Date(s.date);
        return sDate >= rangeStart && sDate <= rangeEnd;
      });
      if (weekSummaries.length >= 2) {
        inputText = weekSummaries.map((s, i) =>
          `【第${i + 1}周复盘】${new Date(s.date).toLocaleDateString("zh-CN")}\n${s.content}`
        ).join("\n\n---\n\n");
        analysisMode = `元分析：整合${weekSummaries.length}份周复盘`;
      }
    } else if (sumType === "year") {
      // Try to find month summaries in last year
      const monthSummaries = summaryHistory.filter(s => {
        if (s.type !== "month") return false;
        const sDate = new Date(s.date);
        return sDate >= rangeStart && sDate <= rangeEnd;
      });
      if (monthSummaries.length >= 3) {
        inputText = monthSummaries.map((s, i) =>
          `【第${i + 1}月复盘】${new Date(s.date).toLocaleDateString("zh-CN")}\n${s.content}`
        ).join("\n\n---\n\n");
        analysisMode = `元分析：整合${monthSummaries.length}份月复盘`;
      } else {
        // Fall back to week summaries
        const weekSummaries = summaryHistory.filter(s => {
          if (s.type !== "week") return false;
          const sDate = new Date(s.date);
          return sDate >= rangeStart && sDate <= rangeEnd;
        });
        if (weekSummaries.length >= 10) {
          inputText = weekSummaries.map((s, i) =>
            `【第${i + 1}周复盘】${new Date(s.date).toLocaleDateString("zh-CN")}\n${s.content}`
          ).join("\n\n---\n\n");
          analysisMode = `元分析：整合${weekSummaries.length}份周复盘`;
        }
      }
    }

    // If no hierarchical input, use raw diary entries
    if (!inputText) {
      inputText = filtered.map(e => {
        const d = new Date(e.date).toLocaleDateString("zh-CN");
        const m = MOODS.find(m => m.v === e.mood)?.label || "";
        return `【${d} · 心情${m}】\n日记：${e.content}\n反思问题：${e.question || "无"}\n回答：${e.answer || "未作答"}`;
      }).join("\n\n---\n\n");
      analysisMode = `原始日记分析：${filtered.length}篇`;
    }

    const typeLabel = { week: "周", month: "月", year: "年" }[sumType];
    const system = `你是用户的私人成长教练，深度了解她。性格档案：

${profile}

请生成${typeLabel}度复盘。【分析模式：${analysisMode}】

${analysisMode.includes("元分析") ? `
你的任务是「整合已有的复盘内容」，找出更高层的模式：
- 对比不同时段的状态变化，看趋势
- 找出反复出现的核心主题
- 发现她自己可能没意识到的转折点
不要重复低层复盘已经说过的具体细节，而是提炼出更宏观的洞察。
` : `
你的任务是「分析原始日记」，找出这段时间的模式。
`}

结构：
1. 【这段时间的你】2-3句话，真实描述整体状态和情绪基调，有温度
2. 【我注意到了】指出1-2个${analysisMode.includes("元分析") ? "持续的主题或明显的变化趋势" : "反复出现的行为或情绪模式"}
3. 【你可能没看见的】一个她自己可能没意识到的盲点或转变，直接但不刺痛
4. 【值得被看见的】1-2个真实的进步或闪光点${analysisMode.includes("元分析") ? "（从时间维度看）" : "（必须来自日记）"}
5. 【明天可以怎样】一个非常具体、${sumType === "week" ? "明天" : sumType === "month" ? "下周" : "下个月"}就能做的小行动

语气：像认识她多年的好朋友，温暖、直接、不说废话、不说空洞赞美。
绝对不能：让她带着焦虑和自责入睡。`;

    try {
      const result = await callAI(system, `【${analysisMode}】\n\n${inputText}`, 1200);
      setSumText(result);

      // Save this summary to history
      const newSummary = {
        type: sumType,
        periodKey,
        date: now.toISOString(),
        content: result,
        analysisMode,
      };
      const updatedHistory = [...summaryHistory, newSummary];
      setSummaryHistory(updatedHistory);
      await fetch("/api/summaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSummary) });

      // ── Post-summary side effects ──
      const versionIncrement = { week: 0.1, month: 0.3, year: 1.0 }[sumType];
      const currentVer = parseFloat(profileVersion.replace(/v/, "")) || 1.0;
      const targetVer = (currentVer + versionIncrement).toFixed(1);

      // Weekly: extract 1-2 observations and store them structurally
      if (sumType === "week") {
        try {
          const obsSys = `你是用户的成长伙伴。根据以下周复盘内容，提取1-2条「近期观察」。
要求：
- 每条不超过40字，描述用户近期真实出现的行为/情绪模式
- 用「她」称呼用户
- 只输出观察条目本身，每条一行，不加序号或符号前缀
- 最多输出2条`;
          const obsRaw = await callAI(obsSys, result.slice(0, 800), 300);
          const obsLines = obsRaw.split("\n").map(l => l.trim()).filter(l => l.length > 5 && l.length < 100);
          const newObs = [];
          for (const line of obsLines.slice(0, 2)) {
            const r2 = await authedFetch("/api/observations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: line }) });
            if (r2.ok) newObs.push(await r2.json());
          }
          if (newObs.length) setObservations(prev => [...newObs, ...prev]);
        } catch { }

        // Weekly profile update: only touch core sections, not 近期观察
        try {
          const updateSys = `你正在维护用户的长期性格档案。当前档案：
${profile}

这是本周复盘。只对档案的四个核心区块（核心特征、主要困境、成长动力与障碍、与用户互动原则）做「微小调整」。
规则：
1. 只能在现有条目后追加补充说明（用 → 标注），不能删除任何条目
2. 「近期观察」区块不要动，不要在档案里写近期观察
3. 在末尾追加版本日志：[v${profileVersion} → v${targetVer}] ${now.toLocaleDateString("zh-CN")} 周复盘：一句话说明改了什么
4. 直接输出完整档案文本`;
          const newProfile = await callAI(updateSys, `本次周复盘摘要：\n${result.slice(0, 500)}`, 700);
          if (newProfile && newProfile.length > 200) {
            setProfile(newProfile);
            setProfileVersion(`v${targetVer}`);
            await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: `v${targetVer}`, content: newProfile }) });
          }
        } catch { }
      }

      // Monthly: promote stable observations + expire old ones
      if (sumType === "month") {
        try {
          const obsList = observations.map(o => {
            const daysSince = Math.floor((Date.now() - new Date(o.last_seen_at).getTime()) / 86400000);
            return `ID:${o.id} | 已观察${o.times_seen}次 | 距上次${daysSince}天 | ${o.content}`;
          }).join("\n");

          const monthObsSys = `你正在进行月度性格档案审核。以下是用户的「近期观察」列表和本月复盘内容。

近期观察列表：
${obsList || "（暂无观察记录）"}

请严格以JSON格式输出，不要输出任何其他内容：
{
  "promote": [id列表，这些观察已稳定重复，应升级为核心档案条目],
  "seen_again": [id列表，这些观察在本月复盘内容中再次出现，需更新last_seen_at],
  "expire": [id列表，这些观察超过60天未再出现，应删除]
}`;
          const aiDecision = await callAI(monthObsSys, `本月复盘内容：\n${result.slice(0, 800)}`, 400);

          let decision = { promote: [], seen_again: [], expire: [] };
          try {
            const jsonMatch = aiDecision.match(/\{[\s\S]*\}/);
            if (jsonMatch) decision = JSON.parse(jsonMatch[0]);
          } catch { }

          // Apply seen_again: increment times_seen + update last_seen_at
          for (const id of (decision.seen_again || [])) {
            const r2 = await authedFetch(`/api/observations/${id}/seen`, { method: "POST" });
            if (r2.ok) {
              const updated = await r2.json();
              setObservations(prev => prev.map(o => o.id === id ? updated : o));
            }
          }

          // Collect promoted content for profile update
          const promotedContents = (decision.promote || []).map(id => observations.find(o => o.id === id)?.content).filter(Boolean);

          // Delete expired and promoted from DB
          const toDelete = [...(decision.expire || []), ...(decision.promote || [])];
          for (const id of toDelete) {
            await authedFetch(`/api/observations/${id}`, { method: "DELETE" });
          }
          setObservations(prev => prev.filter(o => !toDelete.includes(o.id)));

          // Monthly profile update: include promoted observations into core sections
          const updateSys = `你正在进行月度性格档案更新。当前档案：
${profile}

以下观察经过反复验证，已被确认为稳定特征，请将它们整合进档案的对应区块（核心特征/主要困境/成长动力/互动原则）：
${promotedContents.length ? promotedContents.map(c => `- ${c}`).join("\n") : "（本月无升级项）"}

规则：
1. 月复盘可以更新现有条目描述
2. 「近期观察」区块不要写入档案，由系统单独管理
3. 在末尾追加：[v${profileVersion} → v${targetVer}] ${now.toLocaleDateString("zh-CN")} 月复盘：一句话说明
4. 直接输出完整档案`;
          const newProfile = await callAI(updateSys, `本月复盘摘要：\n${result.slice(0, 600)}`, 900);
          if (newProfile && newProfile.length > 200) {
            setProfile(newProfile);
            setProfileVersion(`v${targetVer}`);
            await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: `v${targetVer}`, content: newProfile }) });
          }
        } catch { }
      }

      // Yearly: full profile reconstruction (no observation changes, just big profile update)
      if (sumType === "year") {
        try {
          const updateSys = `年度档案审视。当前档案：
${profile}

规则：年复盘可以全面重构档案——删除明显过时的条目、升级、新增。保持四大区块结构。在末尾追加版本日志。直接输出完整档案。`;
          const newProfile = await callAI(updateSys, `年度复盘摘要：\n${result.slice(0, 800)}`, 1000);
          if (newProfile && newProfile.length > 200) {
            setProfile(newProfile);
            setProfileVersion(`v${targetVer}`);
            await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: `v${targetVer}`, content: newProfile }) });
          }
        } catch { }
      }
    } catch (err) {
      setSumText(`生成出错：${err.message || "请重试"}。`);
    }
    setSumLoading(false);
  };

  // ── Helpers ──
  const fmtDate = iso => new Date(iso).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const fmtTime = iso => new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const todayStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const wroteToday = entries.some(e => new Date(e.date).toDateString() === new Date().toDateString());

  // Compute backdate options: past 3 days that have NO entry yet
  const backdateOptions = [1, 2, 3].map(daysAgo => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const hasEntry = entries.some(e => new Date(e.date).toDateString() === d.toDateString());
    return {
      daysAgo,
      date: d,
      label: daysAgo === 1 ? "昨天" : daysAgo === 2 ? "前天" : `${d.getMonth() + 1}月${d.getDate()}日`,
      dateStr: d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
      hasEntry,
    };
  }).filter(o => !o.hasEntry); // only show days without existing entries

  const countRange = (t) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    let rangeStart = new Date();
    let rangeEnd = new Date();

    if (t === "week") {
      const isOnSunday = dayOfWeek === 0;
      if (isOnSunday) {
        // This week: Mon-Sun
        rangeStart.setDate(now.getDate() - 6);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setDate(now.getDate());
        rangeEnd.setHours(23, 59, 59, 999);
      } else {
        // Last week: last Mon-Sun
        const daysFromLastSunday = dayOfWeek;
        rangeEnd.setDate(now.getDate() - daysFromLastSunday);
        rangeEnd.setHours(23, 59, 59, 999);
        rangeStart.setDate(rangeEnd.getDate() - 6);
        rangeStart.setHours(0, 0, 0, 0);
      }
    } else if (t === "month") {
      // Last month
      rangeEnd.setMonth(now.getMonth(), 0);
      rangeEnd.setHours(23, 59, 59, 999);
      rangeStart.setMonth(rangeEnd.getMonth(), 1);
      rangeStart.setHours(0, 0, 0, 0);
    } else {
      // Last year
      rangeEnd.setFullYear(now.getFullYear() - 1, 11, 31);
      rangeEnd.setHours(23, 59, 59, 999);
      rangeStart.setFullYear(now.getFullYear() - 1, 0, 1);
      rangeStart.setHours(0, 0, 0, 0);
    }
    return entries.filter(e => {
      const d = new Date(e.date);
      return d >= rangeStart && d <= rangeEnd;
    }).length;
  };

  // ══════════════════════════════════════════════════════
  // STYLES
  // ══════════════════════════════════════════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Serif+SC:wght@300;400;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#0a0818;min-height:100vh;}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(140,160,255,0.35);border-radius:2px;}
    textarea{outline:none;resize:vertical;transition:border-color .25s;}
    textarea:focus{border-color:rgba(160,180,255,0.6)!important;box-shadow:0 0 0 2px rgba(120,140,255,0.12)!important;}
    .nav-tab{transition:all .2s;}
    .nav-tab:hover{color:rgba(200,210,255,0.95)!important;}
    .hover-lift{transition:transform .2s,border-color .2s;}
    .hover-lift:hover{transform:translateY(-1px);border-color:rgba(140,160,255,0.4)!important;}
    .mood-btn{transition:transform .15s,border-color .2s;}
    .mood-btn:hover{transform:scale(1.2);}
    .btn-primary{transition:all .2s;}
    .btn-primary:hover:not(:disabled){background:rgba(120,140,255,0.28)!important;border-color:rgba(160,180,255,0.7)!important;}
    .btn-gold{transition:all .2s;}
    .btn-gold:hover:not(:disabled){opacity:.85!important;}
    .ghost-btn:hover{background:rgba(120,140,255,0.12)!important;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
    @keyframes bubbleIn{0%{opacity:0;transform:translateY(20px) scale(0.92)}100%{opacity:1;transform:none}}
    @keyframes bubbleOut{0%{opacity:1;transform:none}100%{opacity:0;transform:translateY(10px) scale(0.95)}}
    @keyframes gentlePulse{0%,100%{box-shadow:0 0 18px rgba(140,120,255,0.35)}50%{box-shadow:0 0 28px rgba(140,120,255,0.55)}}
    .anim-up{animation:fadeUp .3s ease both;}
    .blink{animation:blink .9s infinite;}
    .generating{background:linear-gradient(90deg,rgba(140,160,255,0.9),rgba(180,130,255,0.9),rgba(100,220,210,0.9),rgba(140,160,255,0.9));background-size:200% auto;animation:shimmer 2.5s linear infinite;-webkit-background-clip:text;background-clip:text;color:transparent!important;}
    .bubble-in{animation:bubbleIn .4s cubic-bezier(0.34,1.56,0.64,1) both;}
    .bubble-out{animation:bubbleOut .35s ease forwards;}
    .bubble-pulse{animation:gentlePulse 2.5s ease-in-out infinite;}
  `;

  const inputStyle = {
    width: "100%", background: "rgba(10,14,42,0.5)",
    border: "1px solid rgba(120,140,220,0.28)", borderRadius: 8,
    color: "rgba(235,238,255,0.95)", fontFamily: "'Crimson Pro','Noto Serif SC',serif",
    fontSize: 16, lineHeight: 1.9, padding: "14px 16px",
  };

  const labelStyle = {
    fontSize: 10, color: "rgba(170,185,240,0.75)", letterSpacing: ".2em",
    textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8,
  };

  const VoiceBtn = ({ target }) => {
    const isRec = recording && recTarget === target;
    return isRec
      ? <button onClick={stopRec} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(200,80,40,0.2)", border: "1px solid rgba(200,100,60,0.5)", borderRadius: 6, padding: "4px 11px", color: "rgba(255,130,90,0.9)", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
        <span className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff7755", display: "inline-block" }} /> 停止
      </button>
      : <button onClick={() => startRec(target)} className="ghost-btn" style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid rgba(100,120,200,0.25)", borderRadius: 6, padding: "4px 11px", color: "rgba(140,160,220,0.6)", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
        🎙 语音
      </button>;
  };

  const Divider = () => <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(100,120,200,0.2),transparent)", margin: "22px 0" }} />;

  // ══════════════════════════════════════════════════════
  // ONBOARDING LOGIC
  // ══════════════════════════════════════════════════════

  // 6 MCQ questions + 1 freeform = 7 total
  const OB_QUESTIONS = [
    {
      key: "q1", label: "面对压力或挫折时，你通常的第一反应是？",
      opts: ["倾向逃避，刷手机、睡觉转移注意力", "内耗自责，觉得自己不够好", "硬抗死磕，想马上解决", "找信任的人倾诉"]
    },
    {
      key: "q2", label: "在执行计划时，你属于哪种类型？",
      opts: ["完美主义的拖延症（等准备好再说）", "三分钟热度（开始很猛，很难坚持）", "想到就做（行动力强但缺乏规划）", "按部就班（稳扎稳打型）"]
    },
    {
      key: "q3", label: "社交对你来说是什么感觉？",
      opts: ["充电——和人在一起让我充满活力", "放电——独处才能恢复能量，社交会累", "看情况——亲密朋友充电，陌生场合放电", "无所谓，都差不多"]
    },
    {
      key: "q4", label: "什么最容易让你情绪失控或陷入内耗？",
      opts: ["被人否定或批评", "事情不在预期内（突发变化）", "感觉自己落后于同龄人", "关系中的冷漠或疏远"]
    },
    {
      key: "q5", label: "面对失败或批评时，你通常会怎么对待自己？",
      opts: ["狠狠自责，反复回想哪里出了错", "短暂难受，然后试着复盘改进", "快速翻篇，不喜欢停留在负面情绪里", "向外归因，觉得是外部原因"]
    },
    {
      key: "q6", label: "你最容易被什么点燃？",
      opts: ["看到别人成功，想追上去", "读到一段话/视频触动了自己", "外部截止日期/压力", "自己设定的目标和仪式感"]
    },
  ];

  const handleOnboardingSubmit = async () => {
    setOnboardingStep(8); // Generating state
    const answers = OB_QUESTIONS.map((q, i) => `${i + 1}. ${q.label}\n   回答：${obAnswers[q.key] || "未作答"}`).join("\n") +
      `\n7. 你希望日记本特别注意哪些事？\n   回答：${obAnswers.q7 || "无"}`;

    const sys = `你是一个出色的性格侧写师。用户刚注册了私人日记本，请根据她的回答，生成结构化的初始性格档案。

严格按以下格式输出，不要任何其他文字：

【用户性格档案 v1.0】

核心特征：
- （2-3条，描述她稳定的性格底色）

主要困境：
- （2-3条，描述她反复遇到的挑战或模式）

成长动力与障碍：
- （2条，动力来源和最大阻力）

与用户互动原则：
- （2-3条，AI陪她时要遵守的规则，基于她的反应模式）

版本日志：
- [v1.0] ${new Date().toLocaleDateString("zh-CN")} 初始档案由用户问卷生成`;

    try {
      const generatedProfile = await callAI(sys, `用户回答：\n${answers}`, 800);
      setProfile(generatedProfile);
      setProfileVersion("v1.0");
      await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: "v1.0", content: generatedProfile }) });
      setNeedsOnboarding(false);
    } catch {
      const fb = `【用户性格档案 v1.0】\n\n核心特征：\n- 档案生成失败，AI将通过后续日记输入逐渐了解\n\n版本日志：\n- [v1.0] ${new Date().toLocaleDateString("zh-CN")} 初始档案（问卷生成失败）`;
      setProfile(fb);
      setProfileVersion("v1.0");
      await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: "v1.0", content: fb }) });
      setNeedsOnboarding(false);
    }
  };

  const skipOnboarding = async () => {
    const fb = `【用户性格档案 v1.0】\n\n核心特征：\n- 档案从零开始，AI将通过阅读日记逐渐了解用户\n\n版本日志：\n- [v1.0] ${new Date().toLocaleDateString("zh-CN")} 用户选择跳过问卷，档案待AI学习积累`;
    setProfile(fb);
    setProfileVersion("v1.0");
    await authedFetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: "v1.0", content: fb }) });
    setNeedsOnboarding(false);
  };

  // Helper: render a single MCQ + freeform question step
  const renderObQuestion = (qIndex) => {
    const q = OB_QUESTIONS[qIndex];
    const val = obAnswers[q.key];
    const isLast = qIndex === OB_QUESTIONS.length - 1; // Q6 → next is Q7 (freeform)
    const total = OB_QUESTIONS.length + 1; // 6 MCQ + 1 freeform
    return (
      <>
        <div style={{ fontSize: 12, color: "rgba(140,150,200,0.6)", marginBottom: 12 }}>{qIndex + 1} / {total}</div>
        <h3 style={{ fontSize: 17, marginBottom: 20, color: "rgba(210,220,255,0.9)", lineHeight: 1.5 }}>{q.label}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map(opt => (
            <button key={opt} onClick={() => setObAnswers(p => ({ ...p, [q.key]: opt }))} style={{
              padding: "12px 14px", borderRadius: 8, textAlign: "left",
              background: val === opt ? "rgba(120,100,255,0.25)" : "rgba(80,100,160,0.15)",
              border: `1px solid ${val === opt ? "rgba(160,140,255,0.7)" : "rgba(120,140,200,0.3)"}`,
              color: "rgba(200,210,255,0.9)", cursor: "pointer", fontSize: 14, transition: "all .2s"
            }}>
              {opt}
            </button>
          ))}
          <input
            type="text" value={val}
            onChange={e => setObAnswers(p => ({ ...p, [q.key]: e.target.value }))}
            placeholder="或者用自己的话说……"
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 8, marginTop: 4,
              background: "rgba(10,14,42,0.5)", border: "1px solid rgba(120,140,220,0.28)",
              color: "rgba(235,238,255,0.95)", fontFamily: "'Crimson Pro','Noto Serif SC',serif",
              fontSize: 14, outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {qIndex > 0 && (
              <button onClick={() => setOnboardingStep(qIndex)} style={{
                padding: "12px", borderRadius: 8, background: "none",
                border: "1px solid rgba(120,140,200,0.3)", color: "rgba(180,190,230,0.8)",
                cursor: "pointer", flex: 1,
              }}>← 上一题</button>
            )}
            <button
              onClick={() => { if (val.trim()) setOnboardingStep(qIndex + 2); }}
              disabled={!val.trim()}
              style={{
                padding: "12px", borderRadius: 8, border: "none",
                cursor: val.trim() ? "pointer" : "not-allowed", flex: 2,
                background: "linear-gradient(135deg,rgba(140,120,255,0.85),rgba(80,160,255,0.85))",
                color: "white", fontWeight: 600, fontSize: 14, opacity: val.trim() ? 1 : 0.4,
                transition: "all .2s",
              }}
            >
              {isLast ? "下一题 →" : "下一题 →"}
            </button>
          </div>
        </div>
      </>
    );
  };

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <>
      <style>{css}</style>
      <AuroraBackground />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", color: "rgba(225,228,255,0.95)", fontFamily: "'Crimson Pro','Noto Serif SC',serif", display: "flex", flexDirection: "column" }}>

        {/* ── ONBOARDING / SURVEY FLOW ── */}
        {needsOnboarding ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <Glass style={{ width: "100%", maxWidth: 500, padding: "40px 30px", textAlign: "center" }} className="anim-up">
              {onboardingStep === 0 && (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: "rgba(220,230,255,0.95)", marginBottom: 16 }}>欢迎来到你的专属日记</h2>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(180,190,230,0.8)", marginBottom: 30 }}>
                    在这里，AI 会根据你的性格给予最懂你的回应。<br />
                    7 个小问题，帮它从第一天就真正了解你。
                  </p>
                  <button onClick={() => setOnboardingStep(1)} className="btn-gold" style={{
                    padding: "14px 30px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 15, fontFamily: "inherit", fontWeight: 600, width: "100%", marginBottom: 16,
                    background: "linear-gradient(135deg,rgba(140,120,255,0.85),rgba(80,160,255,0.85))", color: "white"
                  }}>开始设定 (约2分钟)</button>
                  <button onClick={skipOnboarding} style={{ background: "none", border: "none", color: "rgba(140,160,200,0.6)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
                    跳过，让 AI 随时间慢慢懂我
                  </button>
                </>
              )}

              {/* Steps 1-6: MCQ questions via helper */}
              {onboardingStep >= 1 && onboardingStep <= 6 && renderObQuestion(onboardingStep - 1)}

              {/* Step 7: Freeform notes */}
              {onboardingStep === 7 && (
                <>
                  <div style={{ fontSize: 12, color: "rgba(140,150,200,0.6)", marginBottom: 12 }}>7 / 7</div>
                  <h3 style={{ fontSize: 17, marginBottom: 12, color: "rgba(210,220,255,0.9)", lineHeight: 1.5 }}>最后，有什么是你希望日记本特别注意的？</h3>
                  <p style={{ fontSize: 13, color: "rgba(150,160,200,0.7)", marginBottom: 18 }}>比如：不要给我打鸡血、我很容易嫉妒同龄人、请用温柔但直接的语气……（选填）</p>
                  <textarea
                    value={obAnswers.q7}
                    onChange={e => setObAnswers(p => ({ ...p, q7: e.target.value }))}
                    placeholder="畅所欲言……"
                    style={{
                      width: "100%", background: "rgba(10,14,42,0.5)",
                      border: "1px solid rgba(120,140,220,0.28)", borderRadius: 8,
                      color: "rgba(235,238,255,0.95)", fontFamily: "'Crimson Pro','Noto Serif SC',serif",
                      fontSize: 15, lineHeight: 1.9, padding: "14px 16px", minHeight: 110, marginBottom: 18
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setOnboardingStep(6)} style={{ padding: "13px", borderRadius: 8, background: "none", border: "1px solid rgba(120,140,200,0.3)", color: "rgba(180,190,230,0.8)", cursor: "pointer", flex: 1 }}>← 上一步</button>
                    <button onClick={handleOnboardingSubmit} className="btn-gold" style={{
                      padding: "13px", borderRadius: 8, border: "none", cursor: "pointer", flex: 2,
                      background: "linear-gradient(135deg,rgba(140,120,255,0.85),rgba(80,160,255,0.85))", color: "white", fontWeight: 600
                    }}>生成我的档案 ✦</button>
                  </div>
                </>
              )}

              {/* Step 8: Generating spinner */}
              {onboardingStep === 8 && (
                <div style={{ padding: "40px 0" }}>
                  <div className="generating" style={{ fontSize: 32, marginBottom: 20 }}>✦</div>
                  <h3 style={{ fontSize: 18, color: "rgba(210,220,255,0.9)", marginBottom: 10 }}>正在为你侧写专属档案...</h3>
                  <p style={{ fontSize: 14, color: "rgba(150,160,200,0.7)" }}>请稍候，马上开启你的日记旅程</p>
                </div>
              )}
            </Glass>
          </div>
        ) : (
          /* ── MAIN APP CONTENT ── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            {/* ── REMINDER BUBBLE ── */}
            {reminder && (
              <div className={`bubble-pulse ${reminderDismissed ? "bubble-out" : "bubble-in"}`} style={{
                position: "fixed", bottom: 28, right: 24, zIndex: 100, maxWidth: 280,
                background: "linear-gradient(135deg,rgba(30,25,80,0.95),rgba(20,30,80,0.95))",
                border: "1px solid rgba(160,140,255,0.5)", borderRadius: 16, padding: "16px 18px",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(100,80,255,0.25)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(210,200,255,0.95)", lineHeight: 1.3 }}>{reminder.label}</div>
                  <button onClick={dismissReminder} style={{ background: "none", border: "none", color: "rgba(160,160,200,0.5)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 0 0 8px", flexShrink: 0 }}>×</button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(170,175,230,0.75)", marginBottom: 14, lineHeight: 1.55 }}>{reminder.sub}</div>
                <button onClick={() => goToSummaryFromReminder(reminder.type)} style={{
                  width: "100%", padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,rgba(130,110,255,0.85),rgba(90,150,255,0.85))",
                  color: "rgba(255,255,255,0.95)", fontSize: 13, fontFamily: "inherit", fontWeight: 600,
                }}>去生成{reminder.type === "week" ? "周" : reminder.type === "month" ? "月" : "年"}度复盘</button>
              </div>
            )}

            {/* ── HEADER ── */}
            <header style={{ padding: "0 24px", borderBottom: "1px solid rgba(100,120,200,0.15)" }}>
              <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,rgba(100,120,255,0.8),rgba(160,100,255,0.8))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(120,100,255,0.4)" }}>
                    <span style={{ fontSize: 15 }}>✦</span>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(160,175,230,0.65)", letterSpacing: ".22em" }}>PRIVATE JOURNAL</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: streak > 0 ? "rgba(255,180,60,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${streak > 0 ? "rgba(255,180,60,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "4px 13px" }}>
                  <span style={{ fontSize: 13 }}>{streak > 0 ? "🔥" : "○"}</span>
                  <span style={{ fontSize: 12, color: streak > 0 ? "rgba(255,200,80,0.9)" : "rgba(140,140,180,0.5)" }}>
                    {streak > 0 ? `连续 ${streak} 天` : "今天还没写"}
                  </span>
                </div>
              </div>
            </header>

            {/* ── NAV ── */}
            <nav style={{ padding: "0 24px", borderBottom: "1px solid rgba(100,120,200,0.12)" }}>
              <div style={{ maxWidth: 700, margin: "0 auto", display: "flex" }}>
                {[
                  { id: "write", label: t.nav.write },
                  { id: "history", label: `${t.nav.history}${entries.length > 0 ? ` (${entries.length})` : ""}` },
                  { id: "summary", label: t.nav.summary },
                  { id: "settings", label: t.nav.settings },
                ].map(tab => (
                  <button key={tab.id} className="nav-tab" onClick={() => setView(tab.id)} style={{
                    background: "none", border: "none", padding: "11px 18px", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", letterSpacing: ".04em",
                    color: view === tab.id ? "rgba(200,210,255,0.98)" : "rgba(155,165,210,0.7)",
                    borderBottom: view === tab.id ? "2px solid rgba(140,160,255,0.7)" : "2px solid transparent",
                    transition: "all .2s",
                  }}>{tab.label}</button>
                ))}
              </div>
            </nav>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, padding: "28px 24px 72px", maxWidth: 700, width: "100%", margin: "0 auto" }}>

              {/* ════════════ WRITE ════════════ */}
              {view === "write" && (
                <div className="anim-up">

                  {/* Late-night nudge */}
                  {lateNightNudge && !aiQuestion && (
                    <div className="anim-up" style={{ background: "rgba(60,40,120,0.35)", border: "1px solid rgba(140,120,255,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "rgba(210,205,255,0.9)", fontWeight: 600, marginBottom: 2 }}>🌙 22点了，今天还没写</div>
                        <div style={{ fontSize: 12, color: "rgba(170,175,230,0.65)" }}>记录一天不用很久，三行也够</div>
                      </div>
                      <button onClick={() => setLateNightNudge(false)} style={{ background: "none", border: "none", color: "rgba(160,160,200,0.45)", cursor: "pointer", fontSize: 18, padding: "0 0 0 12px" }}>×</button>
                    </div>
                  )}

                  {/* Date selector row */}
                  {!aiQuestion && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      {/* Current date or backdate picker */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => { setIsBackdate(false); }} style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: "none",
                          background: !isBackdate ? "rgba(120,100,255,0.25)" : "rgba(255,255,255,0.05)",
                          color: !isBackdate ? "rgba(200,190,255,0.95)" : "rgba(160,165,215,0.55)",
                          fontWeight: !isBackdate ? 600 : 400, transition: "all .2s",
                        }}>今天</button>
                        {backdateOptions.map(o => (
                          <button key={o.daysAgo} onClick={() => { setIsBackdate(true); setBackdateDay(o.daysAgo); }} style={{
                            padding: "5px 12px", borderRadius: 20, fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: "none",
                            background: (isBackdate && backdateDay === o.daysAgo) ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.05)",
                            color: (isBackdate && backdateDay === o.daysAgo) ? "rgba(160,210,255,0.95)" : "rgba(140,160,210,0.5)",
                            fontWeight: (isBackdate && backdateDay === o.daysAgo) ? 600 : 400, transition: "all .2s",
                          }}>{o.label} <span style={{ fontSize: 10, opacity: .7 }}>补记</span></button>
                        ))}
                      </div>
                      {wroteToday && !isBackdate && <span style={{ fontSize: 11, color: "rgba(100,200,150,0.8)", background: "rgba(60,160,100,0.1)", border: "1px solid rgba(80,180,120,0.25)", borderRadius: 12, padding: "3px 11px" }}>✓ 今天已记录</span>}
                    </div>
                  )}

                  {/* Backdate label */}
                  {isBackdate && !aiQuestion && (
                    <div style={{ fontSize: 11, color: "rgba(140,180,255,0.65)", letterSpacing: ".08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>📅</span>
                      补记 {backdateOptions.find(o => o.daysAgo === backdateDay)?.dateStr} 的日记
                    </div>
                  )}

                  {/* ── Phase 1: Write ── */}
                  {!aiQuestion && (
                    <>
                      <Glass style={{ padding: "20px", marginBottom: 20 }}>
                        <div style={labelStyle}>
                          <span>{isBackdate
                              ? (lang === "en" ? `What happened on ${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || "that day"}?` : `${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || "那天"}发生了什么`)
                              : (lang === "en" ? "What happened today?" : "今天发生了什么")}</span>
                          {voiceOK && <VoiceBtn target="content" />}
                        </div>
                        <textarea value={content} onChange={e => setContent(e.target.value)} rows={7}
                          placeholder={isBackdate
                            ? (lang === "en" ? "Think back to that day — even just fragments are worth capturing…" : "回忆一下那天——哪怕只是片段，写下来就有意义…")
                            : t.write.placeholder}
                          style={{ ...inputStyle, minHeight: 180 }}
                        />
                        {voiceErr && <p style={{ fontSize: 11, color: "rgba(255,130,90,0.8)", marginTop: 6 }}>{voiceErr}</p>}
                      </Glass>

                      <Divider />

                      <Glass style={{ padding: "18px 20px", marginBottom: 20 }}>
                        <div style={labelStyle}><span>{isBackdate ? (lang === "en" ? "Mood on that day" : "那天的心情") : t.write.moodLabel}</span></div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {MOODS.map(m => (
                            <button key={m.v} className="mood-btn" onClick={() => setMood(m.v)} style={{
                              width: 44, height: 44, borderRadius: "50%", cursor: "pointer", fontSize: 22,
                              background: mood === m.v ? "rgba(100,120,255,0.15)" : "none",
                              border: `1.5px solid ${mood === m.v ? "rgba(140,160,255,0.6)" : "transparent"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{m.emoji}</button>
                          ))}
                          <span style={{ fontSize: 13, color: "rgba(170,180,230,0.7)", marginLeft: 8 }}>{MOODS.find(m => m.v === mood)?.label}</span>
                        </div>
                      </Glass>

                      <button className="btn-gold" onClick={doSave} disabled={saving || !content.trim()} style={{
                        width: "100%", padding: "14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontFamily: "inherit", fontWeight: 600, letterSpacing: ".08em",
                        background: "linear-gradient(135deg,rgba(140,120,255,0.85),rgba(80,160,255,0.85))",
                        color: "rgba(255,255,255,0.95)", boxShadow: "0 0 24px rgba(120,100,255,0.3)",
                        opacity: saving || !content.trim() ? .5 : 1, transition: "all .2s",
                      }}>{saving ? t.write.saving : isBackdate ? (lang === "en" ? `Save entry for ${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || "that day"}` : `补记${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || ""}的日记`) : t.write.save}</button>

                      {justSaved && !generatingQ && (
                        <div className="anim-up" style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "rgba(100,200,150,0.8)" }}>
                           {t.write.saved}{streak > 0 ? ` · ${t.write.streakDays(streak)} 🔥` : ""}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Phase 2: AI Question ── */}
                  {(generatingQ || aiQuestion) && (
                    <div className="anim-up">
                      <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: "rgba(140,160,220,0.5)", letterSpacing: ".15em", marginBottom: 6 }}>日记已保存 · 正在为你生成今日一问</div>
                        <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(120,100,255,0.4),transparent)" }} />
                      </div>

                      <Glass style={{ padding: "22px", marginBottom: 18, borderLeft: "3px solid rgba(140,120,255,0.6)" }}>
                        {generatingQ
                           ? <p className="generating" style={{ fontSize: 16, lineHeight: 1.8, fontStyle: "italic" }}>{lang === "en" ? "Reading today's entry and crafting a personalized question…" : "正在读取你今天写的内容，为你生成专属问题…"}</p>
                          : <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(220,225,255,0.92)", fontStyle: "italic" }}>{aiQuestion}</p>
                        }
                      </Glass>

                      {!generatingQ && (
                        <>
                          <Glass style={{ padding: "18px 20px", marginBottom: 18 }}>
                            <div style={labelStyle}>
                              <span>{lang === "en" ? "Your Answer" : "你的回答"}</span>
                              {voiceOK && <VoiceBtn target="answer" />}
                            </div>
                            <textarea value={aiAnswer} onChange={e => setAiAnswer(e.target.value)} rows={5}
                              placeholder={lang === "en" ? "Honest is better than deep. Even 'I don't know' works…" : "诚实比深刻重要。哪怕只写『我不知道』…"}
                              style={{ ...inputStyle, minHeight: 120 }}
                            />
                          </Glass>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn-gold" onClick={saveAnswer} disabled={savingAnswer} style={{
                              flex: 1, padding: "13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 600,
                              background: "linear-gradient(135deg,rgba(120,100,255,0.8),rgba(80,150,255,0.8))",
                              color: "rgba(255,255,255,0.95)", opacity: savingAnswer ? .5 : 1,
                            }}>{savingAnswer ? t.write.saving : (lang === "en" ? "Save Answer & Finish" : "保存回答，完成今天")}</button>
                            <button onClick={() => { setAiQuestion(null); setAiAnswer(""); setContent(""); setMood(3); }} style={{
                              padding: "13px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(100,120,200,0.25)", color: "rgba(140,160,200,0.5)", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                            }}>{t.write.questionSkip}</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════ HISTORY ════════════ */}
              {view === "history" && (
                <div className="anim-up">
                  <div style={{ fontSize: 12, color: "rgba(170,180,230,0.65)", letterSpacing: ".08em", marginBottom: 22 }}>
                    共 {entries.length} 篇 · 当前连续 {streak} 天
                  </div>
                  {loading && <div style={{ textAlign: "center", color: "rgba(140,160,200,0.3)", padding: "60px 0" }}>加载中…</div>}
                  {!loading && entries.length === 0 && (
                    <div style={{ textAlign: "center", color: "rgba(140,160,200,0.3)", padding: "80px 0", lineHeight: 2.5 }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>✦</div>
                      还没有日记<br /><span style={{ fontSize: 12 }}>{lang === "en" ? "Go to 'Today' to write your first entry" : "去「写今天」开始第一篇吧"}</span>
                    </div>
                  )}
                  {entries.map(entry => {
                    const isExp = expanded === entry.id;
                    const m = MOODS.find(m => m.v === entry.mood);
                    return (
                      <Glass key={entry.id} className="hover-lift" onClick={() => !confirmDel && setExpanded(isExp ? null : entry.id)} style={{ marginBottom: 10, cursor: "pointer", overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: "rgba(170,180,230,0.7)", letterSpacing: ".04em" }}>{fmtDate(entry.date)}</span>
                              <span style={{ fontSize: 10, color: "rgba(120,140,200,0.4)" }}>·</span>
                              <span style={{ fontSize: 11, color: "rgba(150,160,215,0.6)" }}>{fmtTime(entry.date)}</span>
                              <span style={{ fontSize: 14 }}>{m?.emoji}</span>
                              {entry.isBackdate && <span style={{ fontSize: 9, color: "rgba(100,180,255,0.7)", background: "rgba(60,120,200,0.15)", border: "1px solid rgba(80,150,220,0.25)", borderRadius: 8, padding: "1px 6px", letterSpacing: ".05em" }}>补记</span>}
                            </div>
                            <div style={{ fontSize: 13.5, color: "rgba(200,205,240,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "88%" }}>
                              {entry.content || "（无内容）"}
                            </div>
                          </div>
                          <span style={{ color: "rgba(120,140,200,0.35)", fontSize: 11, marginLeft: 8 }}>{isExp ? "▲" : "▼"}</span>
                        </div>
                        {isExp && (
                          <div onClick={e => e.stopPropagation()} style={{ borderTop: "1px solid rgba(100,120,200,0.15)", padding: "16px" }}>
                            <p style={{ fontSize: 15, lineHeight: 1.9, color: "rgba(210,215,255,0.8)", whiteSpace: "pre-wrap", marginBottom: 16 }}>{entry.content}</p>
                            {entry.question && (
                              <div style={{ background: "rgba(100,80,200,0.1)", borderLeft: "2px solid rgba(140,120,255,0.5)", padding: "12px 14px", borderRadius: 6, marginBottom: 16 }}>
                                <p style={{ fontSize: 12, color: "rgba(160,140,255,0.8)", marginBottom: 8, fontStyle: "italic" }}>{entry.question}</p>
                                <p style={{ fontSize: 14, color: "rgba(180,185,230,0.65)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{entry.answer || "（未作答）"}</p>
                              </div>
                            )}
                            {confirmDel === entry.id ? (
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <span style={{ fontSize: 12, color: "rgba(180,185,230,0.5)" }}>确定删除这篇？</span>
                                <button onClick={() => doDelete(entry.id)} style={{ background: "rgba(200,60,40,0.15)", border: "1px solid rgba(200,80,60,0.4)", borderRadius: 6, color: "rgba(255,120,100,0.85)", cursor: "pointer", fontSize: 11, padding: "4px 11px", fontFamily: "inherit" }}>删除</button>
                                <button onClick={() => setConfirmDel(null)} style={{ background: "none", border: "1px solid rgba(100,120,200,0.25)", borderRadius: 6, color: "rgba(140,160,200,0.5)", cursor: "pointer", fontSize: 11, padding: "4px 11px", fontFamily: "inherit" }}>取消</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDel(entry.id)} style={{ background: "none", border: "1px solid rgba(100,120,200,0.18)", borderRadius: 6, color: "rgba(120,140,180,0.4)", cursor: "pointer", fontSize: 11, padding: "4px 11px", fontFamily: "inherit" }}>🗑 删除</button>
                            )}
                          </div>
                        )}
                      </Glass>
                    );
                  })}
                </div>
              )}

              {/* ════════════ SUMMARY ════════════ */}
              {view === "summary" && (
                <div className="anim-up">
                  <div style={{ fontSize: 13, color: "rgba(170,180,230,0.7)", marginBottom: 22, lineHeight: 1.8 }}>
                    AI 会分层总结：周复盘看日记，上月复盘整合周复盘，去年复盘整合月复盘。<br />
                    <span style={{ color: "rgba(150,160,210,0.55)" }}>周日可生成「本周」，周一到周六可生成「上周」。上月/去年随时可生成（每个时段限一次）。</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      { id: "week", label: new Date().getDay() === 0 ? "本周" : "上周", min: 5 },
                      { id: "month", label: "上月", min: 15 },
                      { id: "year", label: "去年", min: 180 }
                    ].map(t => {
                      const count = countRange(t.id);
                      const meetsThreshold = count >= t.min;

                      // Check if this period already has a summary
                      const now = new Date();
                      const dayOfWeek = now.getDay();
                      let periodKey = "";

                      if (t.id === "week") {
                        let rangeStart = new Date();
                        let rangeEnd = new Date();
                        if (dayOfWeek === 0) {
                          rangeStart.setDate(now.getDate() - 6);
                        } else {
                          rangeEnd.setDate(now.getDate() - dayOfWeek);
                          rangeStart.setDate(rangeEnd.getDate() - 6);
                        }
                        const midWeek = new Date((rangeStart.getTime() + rangeEnd.getTime()) / 2);
                        const firstDayOfYear = new Date(midWeek.getFullYear(), 0, 1);
                        const firstMonday = new Date(firstDayOfYear);
                        const dayOfWeekFirst = firstDayOfYear.getDay();
                        const daysToMonday = dayOfWeekFirst === 0 ? 1 : (8 - dayOfWeekFirst) % 7;
                        firstMonday.setDate(firstDayOfYear.getDate() + daysToMonday);
                        const weekNum = Math.ceil((midWeek - firstMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
                        periodKey = `${midWeek.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
                      } else if (t.id === "month") {
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        periodKey = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, "0")}`;
                      } else {
                        periodKey = `${now.getFullYear() - 1}`;
                      }

                      const alreadyGenerated = summaryHistory.some(s => s.type === t.id && s.periodKey === periodKey);
                      const enabled = meetsThreshold && !alreadyGenerated;

                      return (
                        <button key={t.id} onClick={() => { if (enabled) { setSumType(t.id); } }} disabled={!enabled} style={{
                          padding: "8px 16px", borderRadius: 8, cursor: enabled ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "inherit",
                          background: sumType === t.id ? "rgba(120,100,255,0.25)" : "rgba(15,18,45,0.6)",
                          border: `1px solid ${sumType === t.id ? "rgba(140,120,255,0.6)" : "rgba(100,120,200,0.2)"}`,
                          color: enabled ? (sumType === t.id ? "rgba(210,200,255,0.98)" : "rgba(160,170,220,0.7)") : "rgba(100,110,150,0.35)",
                          fontWeight: sumType === t.id ? 600 : 400, transition: "all .2s",
                          opacity: enabled ? 1 : 0.5,
                        }}>
                          {t.label} <span style={{ fontSize: 10, opacity: .7 }}>
                            {alreadyGenerated ? "✓已生成" : `${count}/${t.min}`}
                          </span>
                        </button>
                      );
                    })}
                    <button className="btn-primary" onClick={genSummary} disabled={sumLoading} style={{
                      padding: "8px 18px", borderRadius: 8, background: "none", border: "1px solid rgba(140,160,255,0.4)",
                      color: "rgba(160,180,255,0.85)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", opacity: sumLoading ? .5 : 1,
                    }}>{sumLoading ? "生成中…" : "生成复盘"}</button>
                  </div>

                  <Glass style={{ padding: "22px", minHeight: 220, fontSize: 15, lineHeight: 1.95, color: sumText ? "rgba(210,215,255,0.88)" : "rgba(100,120,180,0.35)", fontStyle: sumText ? "normal" : "italic" }}>
                    {sumLoading ? (
                      <span className="generating">正在深入分析你的日记…</span>
                    ) : sumText ? (
                      <div dangerouslySetInnerHTML={{ __html: parseMarkdown(sumText) }} />
                    ) : (
                      "选择时间范围，点击「生成复盘」"
                    )}
                  </Glass>

                  {/* 14-day heatmap */}
                  {entries.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ fontSize: 10, color: "rgba(100,120,180,0.4)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 10 }}>过去 14 天记录</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {Array.from({ length: 14 }).map((_, i) => {
                          const d = new Date(); d.setDate(d.getDate() - (13 - i));
                          const wrote = entries.some(e => new Date(e.date).toDateString() === d.toDateString());
                          return <div key={i} title={d.toLocaleDateString("zh-CN")} style={{
                            flex: 1, height: 20, borderRadius: 4, transition: "all .2s",
                            background: wrote ? "linear-gradient(135deg,rgba(120,100,255,0.7),rgba(80,160,255,0.7))" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${wrote ? "rgba(140,120,255,0.4)" : "rgba(100,120,200,0.1)"}`,
                            boxShadow: wrote ? "0 0 6px rgba(120,100,255,0.3)" : "none",
                          }} />;
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "rgba(100,120,180,0.3)" }}>
                        <span>14天前</span><span>今天</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════ SETTINGS ════════════ */}
              {view === "settings" && (
                <div className="anim-up">
                  <h2 style={{ fontSize: 18, fontWeight: 400, color: "rgba(210,215,255,0.92)", marginBottom: 6, letterSpacing: ".05em" }}>设置</h2>
                  <p style={{ fontSize: 13, color: "rgba(160,170,220,0.65)", marginBottom: 28 }}>个人档案 · 存储说明 · 使用指南</p>

                  {/* Profile section */}
                  <Glass style={{ padding: "22px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 4 }}>个人性格档案</h3>
                        <p style={{ fontSize: 11, color: "rgba(155,165,220,0.6)" }}>当前版本 {profileVersion} · AI 复盘后自动更新</p>
                      </div>
                      <div style={{ fontSize: 18, opacity: .6 }}>✦</div>
                    </div>
                    <div style={{ background: "rgba(8,12,40,0.55)", border: "1px solid rgba(120,140,220,0.2)", borderRadius: 8, padding: "16px", fontSize: 13.5, lineHeight: 2, color: "rgba(205,210,245,0.85)", whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto" }}>
                      {profile}
                    </div>
                    <p style={{ fontSize: 11.5, color: "rgba(140,155,210,0.6)", marginTop: 12, lineHeight: 1.7 }}>
                      这是 AI 目前对你的了解。每次生成复盘后，它会根据你最新的日记内容悄悄更新这份档案，记录你真实的成长轨迹。你可以在这里看到它对你的理解在随时间发生怎样的变化。
                    </p>
                  </Glass>

                  {/* Recent Observations block */}
                  <Glass style={{ padding: "20px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em" }}>近期观察</h3>
                      <span style={{ fontSize: 11, color: "rgba(140,155,210,0.5)" }}>每周复盘后追加 · 月复盘审核</span>
                    </div>
                    {observations.length === 0 ? (
                      <p style={{ fontSize: 13, color: "rgba(120,135,190,0.5)", fontStyle: "italic" }}>完成第一次周复盘后，AI 会开始积累近期观察。</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {observations.map(obs => {
                          const daysAgo = Math.floor((Date.now() - new Date(obs.last_seen_at).getTime()) / 86400000);
                          const createdDays = Math.floor((Date.now() - new Date(obs.created_at).getTime()) / 86400000);
                          return (
                            <div key={obs.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(80,100,160,0.1)", borderRadius: 8, border: "1px solid rgba(100,120,200,0.2)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13.5, color: "rgba(200,210,245,0.88)", lineHeight: 1.65 }}>{obs.content}</div>
                                <div style={{ fontSize: 10.5, color: "rgba(130,145,200,0.55)", marginTop: 5 }}>
                                  首次记录 {createdDays === 0 ? "今天" : `${createdDays}天前`}
                                  {daysAgo > 0 && ` · 上次确认 ${daysAgo}天前`}
                                </div>
                              </div>
                              {obs.times_seen > 1 && (
                                <span style={{ fontSize: 10, background: "rgba(140,120,255,0.2)", border: "1px solid rgba(160,140,255,0.4)", borderRadius: 10, padding: "2px 8px", color: "rgba(190,180,255,0.9)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                  ×{obs.times_seen} 已确认
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: "rgba(120,135,190,0.5)", marginTop: 12, lineHeight: 1.6 }}>
                      月复盘时，反复出现的观察会被升级进入核心档案；超过60天未再出现的会被自动清除。
                    </p>
                  </Glass>

                  {/* Storage info */}
                  <Glass style={{ padding: "20px", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 14 }}>{t.settings.storageTitle}</h3>
                    {t.settings.storage.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(205,212,245,0.85)", marginBottom: 3 }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: "rgba(165,175,225,0.65)", lineHeight: 1.7 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </Glass>

                  {/* How to use */}
                  <Glass style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 14 }}>{t.settings.guideTitle}</h3>
                    {t.settings.guide.map(([title, desc], i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 14 : 0 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(130,110,255,0.25)", border: "1px solid rgba(150,130,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(190,175,255,0.9)", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(205,210,245,0.85)", marginBottom: 3 }}>{title}</div>
                          <div style={{ fontSize: 13, color: "rgba(165,175,225,0.65)", lineHeight: 1.7 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </Glass>
                  {/* Settings Action: API Key & Quota */}
                  <Glass style={{ padding: "20px", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 14 }}>账户 & API 额度</h3>
                    <div style={{ marginBottom: 16, fontSize: 13, color: "rgba(165,175,225,0.8)", lineHeight: 1.6 }}>
                      当前免费体验次数: <strong>{usageCount} / 10</strong>
                      <br />
                      <span style={{ fontSize: 11, color: "rgba(165,175,225,0.5)" }}>（超出后请配置您自己的 OpenRouter API Key）</span>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-or-v1-xxxxxxxxxx..."
                        style={{
                          flex: 1, padding: "10px 14px", borderRadius: 8,
                          background: "rgba(10,14,35,0.6)",
                          border: "1px solid rgba(120,140,255,0.3)",
                          color: "rgba(230,235,255,0.9)",
                          fontSize: 13, outline: "none"
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (!apiKeyInput.trim()) return;
                          await authedFetch("/api/me/apikey?api_key=" + encodeURIComponent(apiKeyInput.trim()), { method: "POST" });
                          alert("API Key 已更新");
                        }}
                        style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(100,120,255,0.2)", border: "1px solid rgba(140,160,255,0.4)", color: "rgba(210,215,255,0.9)", cursor: "pointer", fontSize: 13 }}
                      >
                        保存 Key
                      </button>
                    </div>

                    <div style={{ marginTop: 24, borderTop: "1px solid rgba(120,140,255,0.15)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      <button onClick={handleLogout} style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(220,60,60,0.15)", border: "1px solid rgba(220,80,80,0.3)", color: "rgba(255,140,140,0.9)", cursor: "pointer", fontSize: 13, width: "100%" }}>
                        {t.settings.logout}
                      </button>
                      <a href="https://github.com/yunyan-he/DearDairy" target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "9px 16px", borderRadius: 8,
                        background: "rgba(60,70,120,0.2)", border: "1px solid rgba(100,120,200,0.25)",
                        color: "rgba(160,175,220,0.7)", fontSize: 12, textDecoration: "none", transition: "all .2s"
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                        {lang === "en" ? "View on GitHub" : "在 GitHub 上查看源码"}
                      </a>
                    </div>
                  </Glass>
                </div>
              )}

            </main>
          </div>
        )}
      </div>

      {/* ════════ LANGUAGE SELECTION (first launch) ════════ */}
      {!lang && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(10,12,30,0.92)", backdropFilter: "blur(20px)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Glass style={{ width: 340, padding: "40px 30px", textAlign: "center" }} className="anim-up">
            <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "rgba(220,225,255,0.95)", marginBottom: 10 }}>
              {translations.zh.langSelect.title}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(160,175,220,0.7)", marginBottom: 30 }}>
              {translations.zh.langSelect.subtitle}
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={() => switchLang("zh")} style={{
                padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(140,160,255,0.4)",
                background: "rgba(80,100,180,0.2)", color: "rgba(220,230,255,0.95)",
                fontSize: 18, cursor: "pointer", fontWeight: 600, transition: "all .2s"
              }}>中文</button>
              <button onClick={() => switchLang("en")} style={{
                padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(140,160,255,0.4)",
                background: "rgba(80,100,180,0.2)", color: "rgba(220,230,255,0.95)",
                fontSize: 18, cursor: "pointer", fontWeight: 600, transition: "all .2s"
              }}>English</button>
            </div>
          </Glass>
        </div>
      )}

      {/* ════════════ AUTHENTICATION MODAL ════════════ */}
      {lang && showAuthModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(10,12,30,0.85)", backdropFilter: "blur(20px)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Glass style={{ width: 340, padding: "30px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 13, color: "rgba(140,155,200,0.6)", marginBottom: 4 }}>{t.auth.tagline}</div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "rgba(220,225,255,0.95)" }}>
                {authMode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
              </h2>
            </div>

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="text" required placeholder={t.auth.usernamePlaceholder}
                value={authUsername} onChange={e => setAuthUsername(e.target.value)}
                style={{
                  padding: "12px 14px", borderRadius: 8,
                  background: "rgba(10,14,35,0.6)",
                  border: "1px solid rgba(120,140,255,0.3)",
                  color: "rgba(230,235,255,0.9)",
                  fontSize: 14, outline: "none"
                }}
              />
              <input
                type="password" required placeholder={t.auth.passwordPlaceholder}
                value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                style={{
                  padding: "12px 14px", borderRadius: 8,
                  background: "rgba(10,14,35,0.6)",
                  border: "1px solid rgba(120,140,255,0.3)",
                  color: "rgba(230,235,255,0.9)",
                  fontSize: 14, outline: "none"
                }}
              />
              {authError && <div style={{ color: "rgba(255,100,100,0.8)", fontSize: 12, textAlign: "center" }}>{authError}</div>}

              <button disabled={authLoading} type="submit" style={{
                marginTop: 8, padding: "12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,rgba(140,120,255,0.85),rgba(80,160,255,0.85))",
                color: "rgba(255,255,255,0.95)", fontWeight: 600, fontSize: 15, opacity: authLoading ? .6 : 1
              }}>
                {authLoading
                  ? (authMode === "login" ? t.auth.loggingIn : t.auth.registering)
                  : (authMode === "login" ? t.auth.loginBtn : t.auth.registerBtn)}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}
                style={{ background: "none", border: "none", color: "rgba(160,180,255,0.7)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                {authMode === "login" ? t.auth.switchToRegister : t.auth.switchToLogin}
              </button>
            </div>

            {/* Lang switcher */}
            <div style={{ textAlign: "center", borderTop: "1px solid rgba(100,120,200,0.15)", paddingTop: 12 }}>
              <button onClick={() => { setLang(null); setLangState(null); }} style={{ background: "none", border: "none", color: "rgba(120,140,180,0.5)", fontSize: 11, cursor: "pointer" }}>
                {lang === "zh" ? "Switch to English" : "切换中文"}
              </button>
            </div>
          </Glass>
        </div>
      )}
    </>
  );
}
