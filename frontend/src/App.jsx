import { useState, useEffect, useRef, useCallback } from "react";

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
const DEFAULT_PROFILE = `【用户性格档案 v1.0】

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

// ══════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════

async function saveEntry(entry) {
  await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
}
async function loadEntries() {
  try { const r = await fetch("/api/entries"); if (r.ok) return r.json(); } catch { }
  return [];
}
async function delEntry(id) {
  await fetch(`/api/entries/${id}`, { method: "DELETE" });
}

// ══════════════════════════════════════════════════════
// AI
// ══════════════════════════════════════════════════════
async function callAI(system, user, maxTokens = 800) {
  const r = await fetch("/api/chat", {
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
const MOODS = [
  { v: 1, emoji: "🌧", label: "很糟" },
  { v: 2, emoji: "🌫", label: "不好" },
  { v: 3, emoji: "🌤", label: "普通" },
  { v: 4, emoji: "🌟", label: "还行" },
  { v: 5, emoji: "✨", label: "很好" },
];

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
  const [view, setView] = useState("write"); // write | history | summary | settings
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileVersion, setProfileVersion] = useState("v1.0");
  const [summaryHistory, setSummaryHistory] = useState([]); // { type, date, content, coveredDates }

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
    const fetchProfileState = async () => { try { const r = await fetch("/api/profile"); if (r.ok) return r.json(); } catch { } return null; };
    const loadSummaries = async () => { try { const r = await fetch("/api/summaries"); if (r.ok) return r.json(); } catch { } return []; };

    Promise.all([
      loadEntries(),
      fetchProfileState(),
      Promise.resolve(localStorage.getItem("last-reminder-dismissed")),
      loadSummaries(),
    ]).then(([e, profileState, lastDismissed, summaries]) => {
      setEntries(e);
      setStreak(calcStreak(e));
      if (profileState?.content) setProfile(profileState.content);
      if (profileState?.version) setProfileVersion(profileState.version);
      if (summaries) setSummaryHistory(summaries);
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
  }, []);

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
    if (!SR) { setVoiceErr("浏览器不支持语音识别，请使用 Chrome"); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "zh-CN";
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
      const moodLabel = MOODS.find(m => m.v === mood)?.label || "普通";
      const system = `你是用户的私人成长伙伴，了解她的一切。以下是她的性格档案：

${profile}

你的任务：根据用户今天写的日记内容和心情，生成一个专属反思问题。

严格规则：
1. 问题必须基于日记的具体内容，不能是泛泛而谈的通用问题
2. 语气要有温度，就像一个懂你的朋友在问你，不是审讯
3. 情绪好时，引导她思考和深化；情绪糟糕时，先给一句温暖的感受确认，再提问
4. 绝对不能制造焦虑、自责或内疚感
5. 问题要能让她反思，但不能让她带着沉重感入睡
6. 如果她描述了某个失败或不自律的行为，问题要帮她提炼教训，但不是惩罚她
7. 只输出问题本身（可以加一句简短的前置感受确认），不超过60字`;
      const q = await callAI(system, `今天的心情：${moodLabel}\n\n今天的日记：${entry.content}`);
      setAiQuestion(q);
      // Update entry with question
      entry.question = q;
      await saveEntry(entry);
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, question: q } : e));
    } catch (err) {
      setAiQuestion("今天写下来的这些，有什么是你觉得明天可以不一样的？");
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

      // Auto-update profile (gradual, frequency-limited by type)
      try {
        const versionIncrement = { week: 0.1, month: 0.3, year: 1.0 }[sumType];
        const currentVer = parseFloat(profileVersion.replace(/v/, "")) || 1.0;
        const targetVer = (currentVer + versionIncrement).toFixed(1);

        const updateSys = `你正在维护一个用户的长期性格档案。当前档案如下：

${profile}

你刚刚生成了一份${typeLabel}度复盘。你的任务是对档案做「${sumType === "week" ? "微小" : sumType === "month" ? "适度" : "较大"}调整」。

核心原则：
1. 档案反映的是长期稳定的性格特征，绝不因短期表现就大改
2. ${sumType === "week" ? "周复盘只允许：在「近期观察」区域追加一条临时记录，或在现有条目后加一句补充（用 → 标注）" : ""}${sumType === "month" ? "月复盘允许：升级1-2条反复出现的临时观察为正式条目，或更新现有条目的描述" : ""}${sumType === "year" ? "年复盘允许：全面审视档案，该删的删（明显过时的），该升级的升级，该新增的新增" : ""}
3. 不得删除任何原有核心条目（除非是年度复盘且该条目已明显过时）
4. 在档案末尾追加一行：「[v${profileVersion} → v${targetVer}] ${now.toLocaleDateString("zh-CN")} ${typeLabel}复盘：」加一句话说明本次改了什么
5. 版本号设为 v${targetVer}
6. 直接输出完整档案，不要额外解释`;

        const newProfile = await callAI(updateSys, `本次复盘内容摘要：\n${result.slice(0, 600)}`, 800);
        if (newProfile && newProfile.length > 200) {
          setProfile(newProfile);
          setProfileVersion(`v${targetVer}`);
          await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: `v${targetVer}`, content: newProfile }) });
        }
      } catch { }
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
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <>
      <style>{css}</style>
      <AuroraBackground />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", color: "rgba(225,228,255,0.95)", fontFamily: "'Crimson Pro','Noto Serif SC',serif", display: "flex", flexDirection: "column" }}>

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
              { id: "write", label: "写今天" },
              { id: "history", label: `过往${entries.length > 0 ? ` (${entries.length})` : ""}` },
              { id: "summary", label: "AI 复盘" },
              { id: "settings", label: "设置" },
            ].map(t => (
              <button key={t.id} className="nav-tab" onClick={() => setView(t.id)} style={{
                background: "none", border: "none", padding: "11px 18px", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", letterSpacing: ".04em",
                color: view === t.id ? "rgba(200,210,255,0.98)" : "rgba(155,165,210,0.7)",
                borderBottom: view === t.id ? "2px solid rgba(140,160,255,0.7)" : "2px solid transparent",
                transition: "all .2s",
              }}>{t.label}</button>
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
                      <span>{isBackdate ? `${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || "那天"}发生了什么` : "今天发生了什么"}</span>
                      {voiceOK && <VoiceBtn target="content" />}
                    </div>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={7}
                      placeholder={isBackdate ? "回忆一下那天——哪怕只是片段，写下来就有意义……" : "不用写得好，只要写得真。今天的情绪、遇到的事、脑子里转的东西……"}
                      style={{ ...inputStyle, minHeight: 180 }}
                    />
                    {voiceErr && <p style={{ fontSize: 11, color: "rgba(255,130,90,0.8)", marginTop: 6 }}>{voiceErr}</p>}
                  </Glass>

                  <Divider />

                  <Glass style={{ padding: "18px 20px", marginBottom: 20 }}>
                    <div style={labelStyle}><span>{isBackdate ? "那天的心情" : "今天的心情"}</span></div>
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
                  }}>{saving ? "保存中…" : isBackdate ? `补记${backdateOptions.find(o => o.daysAgo === backdateDay)?.label || ""}的日记` : "保存日记 · 生成今日一问"}</button>

                  {justSaved && !generatingQ && (
                    <div className="anim-up" style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "rgba(100,200,150,0.8)" }}>
                      ✓ 已保存{streak > 0 ? ` · 连续 ${streak} 天 🔥` : ""}
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
                      ? <p className="generating" style={{ fontSize: 16, lineHeight: 1.8, fontStyle: "italic" }}>正在读取你今天写的内容，为你生成专属问题…</p>
                      : <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(220,225,255,0.92)", fontStyle: "italic" }}>{aiQuestion}</p>
                    }
                  </Glass>

                  {!generatingQ && (
                    <>
                      <Glass style={{ padding: "18px 20px", marginBottom: 18 }}>
                        <div style={labelStyle}>
                          <span>你的回答</span>
                          {voiceOK && <VoiceBtn target="answer" />}
                        </div>
                        <textarea value={aiAnswer} onChange={e => setAiAnswer(e.target.value)} rows={5}
                          placeholder="诚实比深刻重要。哪怕只写「我不知道」……"
                          style={{ ...inputStyle, minHeight: 120 }}
                        />
                      </Glass>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn-gold" onClick={saveAnswer} disabled={savingAnswer} style={{
                          flex: 1, padding: "13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 600,
                          background: "linear-gradient(135deg,rgba(120,100,255,0.8),rgba(80,150,255,0.8))",
                          color: "rgba(255,255,255,0.95)", opacity: savingAnswer ? .5 : 1,
                        }}>{savingAnswer ? "保存中…" : "保存回答，完成今天"}</button>
                        <button onClick={() => { setAiQuestion(null); setAiAnswer(""); setContent(""); setMood(3); }} style={{
                          padding: "13px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(100,120,200,0.25)", color: "rgba(140,160,200,0.5)", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                        }}>跳过</button>
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
                  还没有日记<br /><span style={{ fontSize: 12 }}>去「写今天」开始第一篇吧</span>
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

              {/* Storage info */}
              <Glass style={{ padding: "20px", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 14 }}>数据存储说明</h3>
                {[
                  { icon: "🔒", title: "存储在哪里", desc: "日记存储在 Claude.ai 的持久化存储中，与你的账号绑定。同一账号登录均可访问。" },
                  { icon: "📱", title: "跨设备访问", desc: "在任何设备上登录 Claude.ai，打开这个 App 即可看到所有日记。" },
                  { icon: "💻", title: "本地使用说明", desc: "可以将代码下载到本地运行，但需要配置你自己的 Anthropic API Key。AI 功能正常可用，但日记数据不会与 Claude.ai 上的同步。" },
                  { icon: "🛡", title: "隐私", desc: "日记内容不会被 Anthropic 用于训练，仅在你主动生成问题或复盘时发送给 AI 处理。" },
                ].map((item, i) => (
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
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(195,205,255,0.9)", letterSpacing: ".08em", marginBottom: 14 }}>使用指南</h3>
                {[
                  ["写今天", "先写日记，保存后 AI 会基于你今天的内容生成一个专属反思问题。回答它，或者跳过。"],
                  ["补记功能", "页面顶部可以切换到过去3天内还没写的日期，进行补记。每个日期只能补记一次。"],
                  ["今日一问", "每次保存日记后自动生成，基于你的日记内容和性格档案定制，不会让你焦虑，只是帮你多想一步。"],
                  ["AI 复盘", "周复盘（≥5天）分析日记。周日可生成「本周」，周一-六可生成「上周」。上月复盘（≥15天）整合周复盘，去年复盘（≥180天）整合月复盘。每周/月/年只能生成一次。档案更新：周+0.1，月+0.3，年+1.0。"],
                  ["坚持的秘诀", "不用每天写很多。哪怕三行也算。连续天数是给你看的，不是用来让你焦虑的。"],
                ].map(([title, desc], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 14 : 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(130,110,255,0.25)", border: "1px solid rgba(150,130,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(190,175,255,0.9)", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(205,210,245,0.85)", marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 13, color: "rgba(165,175,225,0.65)", lineHeight: 1.7 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </Glass>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
