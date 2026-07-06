#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8001}"
SEED_USERNAME="${SEED_USERNAME:-virtual_month_ai}"
SEED_PASSWORD="${SEED_PASSWORD:-DearDairy-month-ai-123}"
START_DATE="${START_DATE:-2026-04-01}"
DAYS="${DAYS:-30}"
DAILY_AI_LIMIT="${DAILY_AI_LIMIT:-5}"

json_value() {
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$1"
}

json_content_text() {
  python3 -c 'import json,sys; data=json.load(sys.stdin); print("\n".join(part.get("text","") for part in data.get("content", [])))'
}

post_json() {
  local endpoint="$1"
  local payload="$2"
  curl -sS -f -X POST "${API_BASE}${endpoint}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
}

echo "Seeding one-month AI-backed virtual user against ${API_BASE}"

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

PROFILE_CONTENT="$(python3 - <<'PY'
content = """【用户性格档案 v1.0】

核心特征：
- 内省敏感，容易把任务表现和自我价值绑在一起。
- 有完美主义倾向，常常想等准备好了再开始。
- 对成长很认真，但容易被同辈比较打乱节奏。

主要困境：
- 面对申请、简历、作品集时启动困难。
- 晚上容易反刍，一复盘就变成自责。
- 焦虑时会刷信息、查经验贴，像在努力但没有真正推进。

成长动力与障碍：
- 希望用日记看见自己的变化，也愿意面对不舒服的真相。
- 最大阻力是害怕粗糙成果暴露自己的不足。

与用户互动原则：
- 先安抚，再追问；先落地，再分析。
- 鼓励必须基于具体证据，不讲空话。
- 睡前不要制造新的焦虑。

版本日志：
- [v1.0] 2026/4/1 初始档案由一月真实AI模拟创建"""
print(content)
PY
)"

post_json "/api/profile" "$(python3 -c 'import json,sys; print(json.dumps({"version":"v1.0","content":sys.stdin.read(),"source":"onboarding","change_note":"2026/4/1 一月真实AI模拟：初始档案"}, ensure_ascii=False))' <<<"${PROFILE_CONTENT}")" >/dev/null

echo "Creating ${DAYS} short diary entries; first ${DAILY_AI_LIMIT} reflection questions use real /api/chat..."

ENTRY_LINES="$(START_DATE="${START_DATE}" DAYS="${DAYS}" SEED_USERNAME="${SEED_USERNAME}" python3 - <<'PY'
import json
import os
import re
from datetime import datetime, timedelta

start = datetime.fromisoformat(os.environ["START_DATE"])
days = int(os.environ["DAYS"])
id_prefix = re.sub(r"[^a-zA-Z0-9_-]+", "-", os.environ["SEED_USERNAME"]).strip("-").lower()
entries = [
    ("今天看到同学晒 offer，心里有点沉。白天原本想改简历，但坐到电脑前就开始刷经验贴，好像只要再多看一点，就能不用面对自己的空白。晚上散步时我承认，其实我不是不知道怎么改，而是怕改完也显得普通。今天只打开文档十分钟，写了一个很粗糙的项目开头。", 2),
    ("上午状态一般，脑子里一直冒出“别人都比我快”。下午给简历项目经历补了两行，虽然写得不漂亮，但至少不是停在脑子里。晚上有一点想推翻重来，我忍住了，只把明天要改的一条 bullet 写在便签上。今天最小的进步是没有等完美。", 3),
    ("今天导师临时改了安排，我一下子很烦，觉得计划又被打乱。以前这种时候我会直接放弃整天，今天只允许自己烦半小时，然后去图书馆改了一段 SOP。回来看还是普通，但它存在了。晚上没有继续骂自己，只是有点累。", 3),
    ("刷到同学的面试经验时心跳很快，我又开始怀疑自己是不是太晚了。后来我把手机放到客厅，给一个学姐发消息问 SOP 反馈。发出去后反而轻松一些。今天发现很多焦虑并不是因为任务太难，而是因为我一直一个人猜。", 3),
    ("今天效率比想象中好，早上改了简历，下午整理了申请材料清单。晚上还是会担心来不及，但我看了一眼这周记录，发现我每天都至少推进了一点。以前我只看自己没完成什么，现在好像能看到一点连续性了。", 4),
    ("今天主要在补课和处理杂事。申请的事情只做了二十分钟，但没有完全断掉。晚上有点想用“今天太忙了”作为理由跳过日记，最后还是写了几行。记录本身让我感觉这一天没有散掉。", 3),
    ("周末睡得比较晚，上午有些昏。下午去咖啡店写 SOP，写了两段很普通的话。以前我会因为普通就删掉，现在先留下来。晚上情绪稳定一点，我觉得自己可能不是没行动力，只是太怕第一次写得难看。", 4),
    ("今天看见朋友圈有人拿到推荐信，我又短暂酸了一下。不同的是，我很快意识到自己是在比较，不是在判断事实。于是我打开自己的材料表，把缺的两项标出来。焦虑还在，但它没有吞掉整晚。", 3),
    ("上午拖了很久，直到午饭后才开始。今天只做了一件事：把 SOP 里最空泛的一段改成具体经历。改完还是不满意，但比昨天清楚。晚上我没有继续搜模板，因为我知道那只是让我暂时舒服。", 3),
    ("今天和朋友聊申请，她说她也怕写得幼稚。听完我突然松了一口气，原来大家都不是胸有成竹。晚上我把第一版 SOP 发给她看，按下发送时很紧张，但也觉得这比一个人在脑子里反复修改有用。", 4),
]

for i in range(days):
    content, mood = entries[i % len(entries)]
    date = start + timedelta(days=i, hours=21, minutes=10)
    print(json.dumps({
        "id": f"{id_prefix}-{date:%Y-%m-%d}",
        "date": date.isoformat(),
        "content": content,
        "mood": mood,
        "question": None,
        "answer": None,
        "is_backdate": False
    }, ensure_ascii=False))
PY
)"

INDEX=0
printf '%s\n' "${ENTRY_LINES}" | while IFS= read -r entry_payload; do
  INDEX=$((INDEX + 1))
  if [[ "${INDEX}" -le "${DAILY_AI_LIMIT}" ]]; then
    content="$(printf '%s' "${entry_payload}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["content"])')"
    ai_payload="$(PROFILE_CONTENT="${PROFILE_CONTENT}" ENTRY_CONTENT="${content}" python3 - <<'PY'
import json
import os
system = f"""你是用户的私人成长伙伴。这是她的当前性格档案：

{os.environ["PROFILE_CONTENT"]}

任务：根据今天这篇短日记，提出一个具体、温暖、但能点到盲点的反思问题。
要求：只输出一个问题，不要解释，不要编号。不要使用种子、树苗、路标、风景等比喻，不要写鸡汤式意象；直接问现实中的动作、恐惧或选择。"""
print(json.dumps({
    "system": system,
    "messages": [{"role": "user", "content": os.environ["ENTRY_CONTENT"]}],
    "max_tokens": 160,
    "use_memory": True
}, ensure_ascii=False))
PY
)"
    ai_response="$(post_json "/api/chat" "${ai_payload}")"
    question="$(printf '%s' "${ai_response}" | json_content_text | head -n 1)"
    if [[ -z "${question}" ]]; then
      echo "Daily AI question failed on entry ${INDEX}. Response:"
      echo "${ai_response}"
      exit 1
    fi
    entry_payload="$(ENTRY_PAYLOAD="${entry_payload}" QUESTION="${question}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["ENTRY_PAYLOAD"])
payload["question"] = os.environ["QUESTION"]
payload["answer"] = "我先把今天的焦虑收束成一个明天能做的小动作，不把整个人都判掉。"
print(json.dumps(payload, ensure_ascii=False))
PY
)"
    echo "  entry ${INDEX}: generated AI question"
  fi
  post_json "/api/entries" "${entry_payload}" >/dev/null
done

echo "Creating AI-generated weekly summaries..."
for week in 1 2 3 4; do
  week_entries="$(printf '%s\n' "${ENTRY_LINES}" | START=$(( (week - 1) * 7 + 1 )) END=$(( week * 7 )) python3 - <<'PY'
import json
import os
import sys
start = int(os.environ["START"])
end = int(os.environ["END"])
rows = []
for idx, line in enumerate(sys.stdin, start=1):
    if start <= idx <= end:
        item = json.loads(line)
        rows.append(f"【{item['date'][:10]} mood={item['mood']}】{item['content']}")
print("\n\n".join(rows))
PY
)"
  summary_payload="$(PROFILE_CONTENT="${PROFILE_CONTENT}" WEEK_ENTRIES="${week_entries}" python3 - <<'PY'
import json
import os
system = f"""你是用户的私人成长教练。当前档案：

{os.environ["PROFILE_CONTENT"]}

请基于这一周短日记生成周复盘。结构：
1. 【这段时间的你】2句话
2. 【我注意到了】1个反复行为或情绪模式
3. 【值得被看见的】1个真实进步
4. 【明天可以怎样】1个具体小行动
语气温暖、直接，不制造焦虑。"""
print(json.dumps({
    "system": system,
    "messages": [{"role": "user", "content": os.environ["WEEK_ENTRIES"]}],
    "max_tokens": 500,
    "use_memory": True
}, ensure_ascii=False))
PY
)"
  ai_response="$(post_json "/api/chat" "${summary_payload}")"
  summary_text="$(printf '%s' "${ai_response}" | json_content_text)"
  if [[ -z "${summary_text}" ]]; then
    echo "Weekly summary ${week} failed. Response:"
    echo "${ai_response}"
    exit 1
  fi
  post_json "/api/summaries" "$(WEEK="${week}" SUMMARY_TEXT="${summary_text}" START_DATE="${START_DATE}" python3 - <<'PY'
import json
import os
from datetime import datetime, timedelta
week = int(os.environ["WEEK"])
date = datetime.fromisoformat(os.environ["START_DATE"]) + timedelta(days=week * 7 - 1, hours=22)
print(json.dumps({
    "type": "week",
    "period_key": f"2026-AI-W{week:02d}",
    "date": date.isoformat(),
    "content": os.environ["SUMMARY_TEXT"],
    "analysis_mode": "真实AI：一月短日记周复盘"
}, ensure_ascii=False))
PY
)" >/dev/null
  echo "  week ${week}: generated and saved AI summary"
done

echo "Creating AI-generated monthly summary..."
month_input="$(printf '%s\n' "${ENTRY_LINES}" | python3 - <<'PY'
import json
import sys
rows = []
for line in sys.stdin:
    item = json.loads(line)
    rows.append(f"【{item['date'][:10]} mood={item['mood']}】{item['content']}")
print("\n\n".join(rows))
PY
)"
month_payload="$(PROFILE_CONTENT="${PROFILE_CONTENT}" MONTH_INPUT="${month_input}" python3 - <<'PY'
import json
import os
system = f"""你是用户的私人成长教练。当前档案：

{os.environ["PROFILE_CONTENT"]}

请基于这一个月的短日记生成月复盘。结构：
1. 【这段时间的你】2-3句话
2. 【我注意到了】1-2个反复模式
3. 【你可能没看见的】1个盲点或转变
4. 【值得被看见的】1-2个真实进步
5. 【下周可以怎样】1个具体小行动
语气温暖、直接，不制造焦虑。"""
print(json.dumps({
    "system": system,
    "messages": [{"role": "user", "content": os.environ["MONTH_INPUT"]}],
    "max_tokens": 800,
    "use_memory": True
}, ensure_ascii=False))
PY
)"
month_response="$(post_json "/api/chat" "${month_payload}")"
month_summary="$(printf '%s' "${month_response}" | json_content_text)"
if [[ -z "${month_summary}" ]]; then
  echo "Monthly summary failed. Response:"
  echo "${month_response}"
  exit 1
fi

post_json "/api/summaries" "$(SUMMARY_TEXT="${month_summary}" START_DATE="${START_DATE}" python3 - <<'PY'
import json
import os
from datetime import datetime
date = datetime.fromisoformat(os.environ["START_DATE"]).replace(day=28, hour=22)
print(json.dumps({
    "type": "month",
    "period_key": "2026-AI-04",
    "date": date.isoformat(),
    "content": os.environ["SUMMARY_TEXT"],
    "analysis_mode": "真实AI：一月短日记月复盘"
}, ensure_ascii=False))
PY
)" >/dev/null

post_json "/api/profile" "$(SUMMARY_TEXT="${month_summary}" python3 - <<'PY'
import json
import os
content = f"""【用户性格档案 v1.3】

核心特征：
- 内省敏感，容易把任务表现和自我价值绑在一起。
- 有完美主义倾向，但已经开始允许粗糙初稿先存在。
- 对成长认真，适合通过连续记录看见变化。

主要困境：
- 同辈比较仍会触发焦虑，尤其是 offer、推荐信、申请材料相关场景。
- 焦虑时容易查经验贴，用信息搜索替代真实推进。

成长动力与障碍：
- 有能力把情绪收束成一个明天可执行的小动作。
- 最大阻力仍是害怕普通成果暴露不足。

与用户互动原则：
- 先接住情绪，再把问题落到具体下一步。
- 复盘时引用她已经做过的真实动作，帮助她看到连续性。

版本日志：
- [v1.0 → v1.3] 2026/4/28 月复盘：基于真实AI月复盘，补充“允许粗糙初稿”和“用搜索替代推进”的模式。

月复盘摘录：
{os.environ["SUMMARY_TEXT"][:900]}"""
print(json.dumps({
    "version": "v1.3",
    "content": content,
    "source": "month_review",
    "change_note": "2026/4/28 真实AI月复盘：补充粗糙初稿和搜索替代推进模式"
}, ensure_ascii=False))
PY
)" >/dev/null

post_json "/api/observations" '{"content":"她在同辈比较后容易把申请任务解释成自我价值审判"}' >/dev/null
post_json "/api/observations" '{"content":"她开始用粗糙初稿打破等待准备好的拖延"}' >/dev/null
post_json "/api/observations" '{"content":"她焦虑时会查经验贴，用信息搜索替代真实推进"}' >/dev/null

echo "Done."
echo "Login with username=${SEED_USERNAME} password=${SEED_PASSWORD}"
echo "AI calls used: $(( DAILY_AI_LIMIT + 5 )) (${DAILY_AI_LIMIT} daily questions + 4 weekly summaries + 1 monthly summary)"
