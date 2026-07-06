#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8001}"
SEED_USERNAME="${SEED_USERNAME:-virtual_zhixia}"
SEED_PASSWORD="${SEED_PASSWORD:-DearDairy-virtual-123}"
RUN_AI="${RUN_AI:-false}"

json_value() {
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$1"
}

post_json() {
  local endpoint="$1"
  local payload="$2"
  curl -sS -X POST "${API_BASE}${endpoint}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
}

echo "Seeding DearDairy virtual user against ${API_BASE}"

AUTH_RESPONSE="$(curl -sS -X POST "${API_BASE}/api/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${SEED_USERNAME}\",\"password\":\"${SEED_PASSWORD}\"}")"

TOKEN="$(printf '%s' "${AUTH_RESPONSE}" | json_value access_token || true)"

if [[ -z "${TOKEN}" ]]; then
  echo "User may already exist; logging in..."
  AUTH_RESPONSE="$(curl -sS -X POST "${API_BASE}/api/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=${SEED_USERNAME}" \
    --data-urlencode "password=${SEED_PASSWORD}")"
  TOKEN="$(printf '%s' "${AUTH_RESPONSE}" | json_value access_token || true)"
fi

if [[ -z "${TOKEN}" ]]; then
  echo "Could not register/login. Response:"
  echo "${AUTH_RESPONSE}"
  exit 1
fi

echo "Authenticated as ${SEED_USERNAME}"

echo "Creating onboarding persona v1.0..."
post_json "/api/profile" "$(python3 - <<'PY'
import json
content = """【用户性格档案 v1.0】

核心特征：
- 深度内省，容易从事件背后追问自我价值。
- 有明显完美主义倾向，经常等待准备好才开始。
- 对成长敏感，容易被同辈进度触发焦虑。

主要困境：
- 同辈比较后容易陷入自责和逃避。
- 晚间容易反刍，复盘容易变成审判自己。
- 面对申请、简历、作品集这类高评价任务时启动困难。

成长动力与障碍：
- 渴望改变，也愿意通过文字面对自己。
- 最大阻力是把任务结果等同于自我价值。

与用户互动原则：
- 先接住情绪，再把问题落到一个小行动。
- 不用空泛鼓励，要指出真实证据。
- 睡前避免尖锐追问，优先帮助她收束。

版本日志：
- [v1.0] 2026/4/1 初始档案由用户问卷生成"""
print(json.dumps({
  "version": "v1.0",
  "content": content,
  "source": "onboarding",
  "change_note": "2026/4/1 初始档案由虚拟用户问卷生成"
}, ensure_ascii=False))
PY
)" >/dev/null

echo "Creating 90 diary entries..."
python3 - <<'PY' | while IFS= read -r payload; do
import json
from datetime import datetime, timedelta

start = datetime(2026, 4, 1, 21, 20)
themes = [
  ("今天看到同学发 offer，又开始觉得自己慢半拍。其实我知道该改简历，但一想到要面对差距就想刷手机。", 2, "你今天真正害怕面对的是简历本身，还是简历会证明你落后了？", "后者。简历只是一个入口，我怕看到自己这半年没做出东西。"),
  ("今天只打开了简历文档十分钟。没有改完，但至少没有继续逃。", 3, "如果把打开文档看作行动链第一环，明天最小的第二环是什么？", "只改一条 bullet，不要求完美。"),
  ("下午效率还可以，但晚上又开始比较别人。我发现自己一焦虑就会搜索很多信息，像是在假装努力。", 2, "你搜索信息是在解决问题，还是在暂时逃开行动？", "多数时候是在逃开行动。"),
  ("今天投了一份实习。投出去的时候很紧张，但也有点轻松，因为不用再无限修改。", 4, "投出去这件事证明了你哪一种新能力？", "我可以允许不完美的东西进入现实。"),
  ("今天没做很多，只散步和睡了午觉。以前会觉得浪费，现在感觉身体有被照顾到。", 3, "休息今天是在逃避，还是在恢复？证据是什么？", "更像恢复，因为休息后我没有更讨厌自己。"),
  ("和朋友聊完申请，发现大家其实都不确定。我不是唯一一个慌的人。", 4, "当你知道别人也不确定时，你对自己的要求有没有松一点？", "有。我不是失败，只是在过程中。"),
  ("晚上又想把 SOP 推倒重写。后来忍住了，只在原稿上改了两段。", 3, "今天你没有推倒重来，这背后是哪种能力在变强？", "承受粗糙的能力。"),
  ("今天情绪很差，觉得自己三个月后可能还是这样。但翻了前几周日记，发现我已经投过简历了。", 2, "过去的记录给了今天的你什么反证？", "我不是完全没动，我只是动得慢。"),
  ("完成了 SOP 初稿。它很幼稚，但终于不是脑子里的完美版本了。", 4, "粗糙初稿和脑内完美稿相比，哪个更能帮你前进？", "粗糙初稿，因为它可以被修改。"),
  ("今天没有被同学的新动态打乱太久。我关掉手机，写了明天的一件小事。", 4, "你今天如何把比较转回了自己的轨道？", "我把注意力放回明天能做什么。"),
]

for i in range(91):
    date = start + timedelta(days=i)
    content, mood, question, answer = themes[i % len(themes)]
    if i > 30:
        content = content.replace("害怕面对差距", "还是会紧张，但没有完全逃开").replace("刷手机", "先做了二十分钟")
    if i > 60:
        content = content.replace("觉得自己慢半拍", "能更快意识到自己在比较").replace("没有改完", "完成了一个小块")
    payload = {
        "id": f"virtual-zhixia-{date:%Y-%m-%d}",
        "date": date.isoformat(),
        "content": content,
        "mood": min(5, mood + (1 if i > 45 and mood < 4 else 0)),
        "question": question,
        "answer": answer,
        "is_backdate": False
    }
    print(json.dumps(payload, ensure_ascii=False))
PY
  post_json "/api/entries" "${payload}" >/dev/null
done

echo "Creating weekly observations..."
for obs in \
  "她在同辈比较后容易把任务解释成自我价值审判" \
  "她常用准备不足作为延迟开始的理由" \
  "她开始接受低质量初稿，行动启动成本明显下降" \
  "她在夜间更需要先安抚情绪再做复盘" \
  "她能把焦虑拆成一个明天可执行的小动作" \
  "她对进度的判断开始从同辈比较转向自我连续性"
do
  post_json "/api/observations" "$(python3 -c 'import json,sys; print(json.dumps({"content": sys.argv[1]}, ensure_ascii=False))' "${obs}")" >/dev/null
done

echo "Creating weekly and monthly summaries..."
python3 - <<'PY' | while IFS= read -r payload; do
import json
from datetime import datetime, timedelta

weekly_notes = [
  "本周她最明显的模式是同辈比较触发自责，但她也第一次承认害怕的不是简历，而是自我价值被验证。",
  "本周她开始用十分钟打开文档打破逃避，行动虽然小，但对完美主义拖延是关键松动。",
  "本周她能识别搜索信息和假装努力之间的区别，这是从情绪雾里分辨行为功能。",
  "本周她投出第一份实习，说明她开始允许不完美的成果进入现实。",
  "本周休息不再自动等于失败，她开始区分恢复和逃避。",
  "本周她发现他人也不确定，同辈比较的压迫感有所下降。",
  "本周她没有推倒 SOP 重写，而是在原稿上修改，承受粗糙初稿的能力增强。",
  "本周低落时她会回看旧日记寻找反证，而不是完全相信当下的失败感。",
  "本周 SOP 初稿完成，粗糙但可修改，这是一条重要成长证据。",
  "本周她能把比较转回明天的小行动，自我连续性开始替代外部排名。",
  "本周她的行动节奏更稳定，夜间反刍减少。",
  "本周她能把焦虑拆成一个具体任务，而不是让焦虑扩散成整个人生判断。"
]

start = datetime(2026, 4, 5, 22, 0)
for idx, note in enumerate(weekly_notes, start=1):
    date = start + timedelta(days=(idx - 1) * 7)
    print(json.dumps({
        "type": "week",
        "period_key": f"2026-W{idx+13:02d}",
        "date": date.isoformat(),
        "content": f"【这段时间的你】{note}\n\n【明天可以怎样】只做一个能在25分钟内完成的小动作。",
        "analysis_mode": "curl种子数据：原始日记分析"
    }, ensure_ascii=False))

monthly = [
  ("2026-04", "四月的核心模式是同辈比较和高评价任务带来的启动困难。稳定进步是她开始把恐惧说清楚。"),
  ("2026-05", "五月的核心变化是允许低质量初稿存在，行动启动成本明显下降。"),
  ("2026-06", "六月她开始用自我连续性判断进度，比较仍存在，但不再轻易吞掉整晚。")
]
for key, note in monthly:
    print(json.dumps({
        "type": "month",
        "period_key": key,
        "date": f"{key}-28T22:00:00",
        "content": f"【这段时间的你】{note}\n\n【我注意到了】她从等待准备好，转向允许粗糙开始。\n\n【下周可以怎样】继续把任务拆成第二环动作。",
        "analysis_mode": "curl种子数据：整合周复盘"
    }, ensure_ascii=False))
PY
  post_json "/api/summaries" "${payload}" >/dev/null
done

echo "Creating persona version snapshots..."
python3 - <<'PY' | while IFS= read -r payload; do
import json
versions = [
  ("v1.1", "week_review", "2026/4/12 周复盘：补充同辈比较触发自我价值审判"),
  ("v1.5", "month_review", "2026/5/1 月复盘：将同辈比较焦虑升级为核心困境"),
  ("v2.0", "month_review", "2026/6/1 月复盘：将低质量初稿能力升级为成长动力"),
  ("v3.1", "month_review", "2026/7/1 月复盘：弱化完全无法开始，新增自我连续性评价"),
]
for version, source, note in versions:
    content = f"""【用户性格档案 {version}】

核心特征：
- 深度内省，容易从事件背后追问自我价值，但已经能更快识别这是情绪解释而非事实。
- 仍有完美主义倾向，但不再必须等准备好才开始；粗糙初稿逐渐成为可接受的行动形态。
- 对成长敏感，适合用连续性证据看见自己，而不是用单日表现定义自己。

主要困境：
- 同辈比较仍会触发焦虑，尤其在申请、实习、成果展示相关场景。
- 夜间容易反刍，若直接复盘会滑向自责，需要先做情绪降温。

成长动力与障碍：
- 动力来自“我确实在变好”的证据链。
- 最有效策略是把任务拆成明天可完成的第二环动作。

与用户互动原则：
- 先承认压力，再把问题从人格审判改写成具体行动。
- 睡前避免尖锐追问，优先帮助她收束情绪。

版本日志：
- [{version}] {note}"""
    print(json.dumps({
        "version": version,
        "content": content,
        "source": source,
        "change_note": note
    }, ensure_ascii=False))
PY
  post_json "/api/profile" "${payload}" >/dev/null
done

if [[ "${RUN_AI}" == "true" ]]; then
  echo "Calling /api/chat with RAG memory enabled..."
  post_json "/api/chat" "$(python3 - <<'PY'
import json
print(json.dumps({
  "system": "你是用户的私人成长伙伴。请结合可检索长期记忆回答。",
  "messages": [
    {
      "role": "user",
      "content": "我今天又看到同学发offer，有点想逃避改SOP。你记得我以前这种时候通常卡在哪里吗？"
    }
  ],
  "max_tokens": 500,
  "use_memory": True
}, ensure_ascii=False))
PY
)" | python3 -m json.tool
else
  echo "Skipping real AI call. Set RUN_AI=true to test /api/chat against DeepSeek."
fi

echo "Done."
echo "Login with username=${SEED_USERNAME} password=${SEED_PASSWORD}"
echo "Debug endpoints:"
echo "  curl -H \"Authorization: Bearer <token>\" ${API_BASE}/api/profile/history"
echo "  curl -H \"Authorization: Bearer <token>\" ${API_BASE}/api/memories"
