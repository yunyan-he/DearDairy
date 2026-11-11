import { useMemo, useState } from 'react'
import './demo.css'

const zhWeekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const shortWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const zhMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

function relativeDate(daysAgo) {
  const value = new Date()
  value.setHours(12, 0, 0, 0)
  value.setDate(value.getDate() - daysAgo)
  return value
}

function dateParts(daysAgo) {
  const value = relativeDate(daysAgo)
  const yyyy = value.getFullYear()
  const mm = String(value.getMonth() + 1).padStart(2, '0')
  const dd = String(value.getDate()).padStart(2, '0')
  return {
    value,
    date: `${yyyy}-${mm}-${dd}`,
    day: String(value.getDate()),
    weekday: shortWeekdays[value.getDay()],
    month: zhMonths[value.getMonth()]
  }
}

function formatFullDate(value) {
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月 ${value.getDate()} 日，${zhWeekdays[value.getDay()]}`
}

function formatRange(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear()
  const startText = `${start.getFullYear()} 年 ${start.getMonth() + 1} 月 ${start.getDate()} 日`
  const endText = `${sameYear ? '' : `${end.getFullYear()} 年 `}${end.getMonth() + 1} 月 ${end.getDate()} 日`
  return `${startText} — ${endText}`
}

const entries = [
  {
    id: 1,
    ...dateParts(2),
    mood: '平静',
    weather: '薄雾，12°C',
    title: '终于把那封邮件发出去了',
    excerpt: '拖了三天，其实真正写起来只用了二十分钟。我一直以为自己是在等待更好的措辞，现在想想，更像是在等一种“不会出错”的保证。',
    body: '拖了三天，其实真正写起来只用了二十分钟。\n\n我一直以为自己是在等待更好的措辞，现在想想，更像是在等一种“不会出错”的保证。发出去之后并没有发生什么戏剧性的事情，对方很快回复了，语气也很普通。\n\n有点好笑，我花了那么多时间预演一个根本没有发生的冲突。晚上走回家的时候，反而觉得很轻。',
    prompt: '你等待的究竟是更好的措辞，还是一种不会被否定的保证？',
    answer: '大概是后者。我并不是真的不知道怎么写，只是不想面对对方可能不满意。'
  },
  {
    id: 2,
    ...dateParts(5),
    mood: '疲惫',
    weather: '小雨，9°C',
    title: '没有完成计划的一天',
    excerpt: '下午几乎什么都没做。以前我会立刻开始计算今天浪费了多少时间，但今天只是去洗了澡，做了饭，然后早点关掉电脑。',
    body: '下午几乎什么都没做。以前我会立刻开始计算今天浪费了多少时间，但今天只是去洗了澡，做了饭，然后早点关掉电脑。\n\n我仍然不喜欢计划落空的感觉，但第一次没有急着惩罚自己。也许休息并不需要先证明自己足够努力。',
    prompt: '如果休息不需要被“赚到”，你会怎样重新描述今天？',
    answer: '这不是失败的一天，只是身体比计划更早知道我需要停下来。'
  },
  {
    id: 3,
    ...dateParts(9),
    mood: '明亮',
    weather: '晴，16°C',
    title: '和 L 在河边走了很久',
    excerpt: '我们没有解决任何问题，但把最近各自害怕的事情都说了出来。回来的路上，我发现自己已经很久没有这样不带目的地聊天。',
    body: '我们没有解决任何问题，但把最近各自害怕的事情都说了出来。\n\n回来的路上，我发现自己已经很久没有这样不带目的地聊天。很多时候我以为只有给出建议才算真正关心一个人，但今天只是听着，也已经足够。',
    prompt: '今天什么让你感到“只是听着”也已经足够？',
    answer: '因为她并没有向我要答案。她只是需要有一个人和她一起待在那个问题旁边。'
  },
  {
    id: 4,
    ...dateParts(13),
    mood: '摇摆',
    weather: '多云，14°C',
    title: '又在比较',
    excerpt: '看到别人宣布新工作时，第一反应不是替她高兴，而是迅速检查自己是不是落后了。我关闭页面之后，那种焦虑还留了很久。',
    body: '看到别人宣布新工作时，第一反应不是替她高兴，而是迅速检查自己是不是落后了。\n\n我关闭页面之后，那种焦虑还留了很久。后来才意识到，我甚至不知道自己是否真的想要她得到的东西。我只是对“别人已经向前走了”这件事很敏感。',
    prompt: '如果不以她的进度为坐标，你现在真正想向哪里移动？',
    answer: '我想先做一个能让我自己信服的小作品，而不是急着获得一个看起来正确的位置。'
  },
  {
    id: 5,
    ...dateParts(16),
    mood: '专注',
    weather: '晴间多云，15°C',
    title: '做完了一个很小的版本',
    excerpt: '我忍住了继续加功能的冲动，只留下最想验证的那一步。它远远称不上完整，但第一次像一个可以拿给别人看的东西。',
    body: '我忍住了继续加功能的冲动，只留下最想验证的那一步。它远远称不上完整，但第一次像一个可以拿给别人看的东西。\n\n以前我总觉得“简化”意味着能力不足，今天反而觉得，知道什么暂时不做也是一种判断。完成之后没有想象中兴奋，只是心里很安静。',
    prompt: '这个小版本证明的，是你的能力，还是你终于允许作品不完整？',
    answer: '后者更重要。我以前不是做不到，而是不允许一个不够完整的东西存在。'
  },
  {
    id: 6,
    ...dateParts(19),
    mood: '低落',
    weather: '阴，11°C',
    title: '收到一句很普通的批评',
    excerpt: '对方只说入口有点难理解，我却像听见了“整个想法都不成立”。过了几个小时，我才把那句话重新读成它原本的样子。',
    body: '对方只说入口有点难理解，我却像听见了“整个想法都不成立”。\n\n我的脑子很擅长把局部反馈扩写成全盘否定。过了几个小时，我才把那句话重新读成它原本的样子：入口有点难理解。只是一个可以修改的问题，不是对我的判决。',
    prompt: '从“入口难理解”到“整个想法不成立”，中间是哪一步由你自己补上的？',
    answer: '我默认好的作品不应该让人困惑，所以一处困惑就被我理解成自己没有想清楚。'
  },
  {
    id: 7,
    ...dateParts(22),
    mood: '轻松',
    weather: '晴，17°C',
    title: '一个没有安排的下午',
    excerpt: '我没有带电脑出门，也没有偷偷把散步包装成“获取灵感”。只是买了面包，在公园里坐了一会儿。',
    body: '我没有带电脑出门，也没有偷偷把散步包装成“获取灵感”。只是买了面包，在公园里坐了一会儿。\n\n途中还是有几次想拿出手机确认自己有没有错过什么，但最后什么都没有发生。回家以后，我没有因为下午的空白而更落后。',
    prompt: '当这个下午不需要产生任何价值时，你感受到的是自由，还是不安？',
    answer: '先是不安，后来才是自由。我好像需要一点时间才能相信空白不会伤害我。'
  },
  {
    id: 8,
    ...dateParts(25),
    mood: '困惑',
    weather: '阵雨，13°C',
    title: '两个方向都想要',
    excerpt: '一个方向更稳定，也更容易向别人解释；另一个方向让我兴奋，但我还不知道它能通向哪里。',
    body: '一个方向更稳定，也更容易向别人解释；另一个方向让我兴奋，但我还不知道它能通向哪里。\n\n我花了一晚上列优缺点，表格越来越完整，决定却没有更清楚。也许我想用分析绕开一个事实：不管选哪个方向，我都会失去另一个可能。',
    prompt: '如果不存在一个不会后悔的选择，你更愿意承担哪一种遗憾？',
    answer: '我更怕因为容易解释而选了一个自己并不好奇的方向。'
  },
  {
    id: 9,
    ...dateParts(28),
    mood: '温暖',
    weather: '多云，14°C',
    title: '妈妈没有问结果',
    excerpt: '我本来准备好解释最近为什么没有明确进展，她却只问我有没有好好吃饭。那一刻我才发现，很多压力其实是我提前替别人说出来的。',
    body: '我本来准备好解释最近为什么没有明确进展，她却只问我有没有好好吃饭。\n\n那一刻我才发现，很多压力其实是我提前替别人说出来的。我想象他们在等待一个结果，于是每次联系都像在交作业。但也许他们并没有一直站在终点看我。',
    prompt: '你平时背负的期待里，有多少来自别人真实说过的话？',
    answer: '可能没有我以为的那么多。很多是我害怕让他们失望，所以提前替他们失望。'
  },
  {
    id: 10,
    ...dateParts(32),
    mood: '平静',
    weather: '晴，18°C',
    title: '把待办事项删掉一半',
    excerpt: '不是延期，也不是移到“以后”，而是真的承认其中一些事情没有那么重要。列表变短以后，我反而第一次知道明天应该从哪里开始。',
    body: '不是延期，也不是移到“以后”，而是真的承认其中一些事情没有那么重要。\n\n以前长列表会让我觉得自己拥有很多可能，实际上每一项都在提醒我还没有完成。删掉一半之后有点舍不得，但注意力终于不再被十几个未来同时拉扯。',
    prompt: '你删掉的是任务，还是“我应该成为很多种人”的想象？',
    answer: '都有。我好像一直害怕只选一条路，会显得自己的可能性变少了。'
  },
  {
    id: 11,
    ...dateParts(35),
    mood: '焦躁',
    weather: '闷热，21°C',
    title: '查了太多资料',
    excerpt: '本来只是想确认一个做法，最后开了二十几个页面。信息越多，我越不敢开始，好像还存在一篇能替我消除所有不确定性的文章。',
    body: '本来只是想确认一个做法，最后开了二十几个页面。信息越多，我越不敢开始。\n\n我总觉得再看一个案例，就能得到那个最正确的结构。但真正缺少的不是资料，而是一次自己的尝试。最后我关掉页面，用十五分钟写了一个很粗糙的开头。',
    prompt: '在什么时刻，学习从帮助行动变成了推迟行动？',
    answer: '当我已经能说出下一步，却仍然坚持要再找一个更好的方法时。'
  },
  {
    id: 12,
    ...dateParts(38),
    mood: '明亮',
    weather: '晴，19°C',
    title: '在课上问了那个问题',
    excerpt: '问题说出口以后并没有显得聪明，甚至有一点基础。但老师认真回答了，旁边的人还说她也没听懂。',
    body: '问题说出口以后并没有显得聪明，甚至有一点基础。\n\n我犹豫了很久，因为害怕别人从问题里判断我的水平。老师认真回答了，旁边的人还说她也没听懂。原来保持沉默并没有保护什么，只是让我一个人承担困惑。',
    prompt: '如果问题不需要证明你的水平，它还可以是什么？',
    answer: '它只是我和理解之间的一座桥，不是公开展示自己不足的证据。'
  },
  {
    id: 13,
    ...dateParts(41),
    mood: '疲惫',
    weather: '雨，12°C',
    title: '身体先替我按了暂停',
    excerpt: '盯着屏幕很久，一个段落也读不进去。我还是坐在那里，仿佛离开桌子就等于承认今天失败。',
    body: '盯着屏幕很久，一个段落也读不进去。我还是坐在那里，仿佛离开桌子就等于承认今天失败。\n\n后来头开始痛，我终于去躺下。醒来时已经是晚上，但那一个小时的睡眠比之前三个小时的坚持更有效。身体总比我的计划更诚实。',
    prompt: '为什么你更愿意相信计划表，而不是已经疲惫的身体？',
    answer: '计划表看起来可以控制，身体的变化会让我觉得自己不可靠。'
  },
  {
    id: 14,
    ...dateParts(44),
    mood: '柔软',
    weather: '微风，16°C',
    title: '没有给朋友建议',
    excerpt: '她说最近总是失眠。我脑子里立刻出现了几个解决方案，但这次我先问她是不是只想让我听一会儿。',
    body: '她说最近总是失眠。我脑子里立刻出现了几个解决方案，但这次我先问她是不是只想让我听一会儿。\n\n她说是。于是我们只是聊那种凌晨三点还醒着的孤独。我没有解决她的失眠，但谈话结束时，她的声音松了一点。',
    prompt: '当你不再负责解决问题时，你在关系里还可以提供什么？',
    answer: '注意力、陪伴，以及不急着把难受变成一个待办事项。'
  },
  {
    id: 15,
    ...dateParts(47),
    mood: '失落',
    weather: '阴，15°C',
    title: '申请没有回复',
    excerpt: '已经超过对方说的时间。我每隔一会儿就检查邮箱，像是只要刷新得足够认真，结果就会改变。',
    body: '已经超过对方说的时间。我每隔一会儿就检查邮箱，像是只要刷新得足够认真，结果就会改变。\n\n最难受的不是可能被拒绝，而是什么都不知道。我会自动把沉默解释成否定，再把否定解释成自己不够好。其实现在唯一确定的只是：还没有回复。',
    prompt: '在“还没有回复”和“我不够好”之间，你加入了哪些未经证实的结论？',
    answer: '我把等待当成了审判，也默认对方的选择能够准确衡量我的价值。'
  },
  {
    id: 16,
    ...dateParts(50),
    mood: '好奇',
    weather: '晴，20°C',
    title: '读到一个真正感兴趣的问题',
    excerpt: '很久没有这种感觉了：不是因为它对简历有帮助，也不是因为别人说这是趋势，只是我真的想知道答案。',
    body: '很久没有这种感觉了：不是因为它对简历有帮助，也不是因为别人说这是趋势，只是我真的想知道答案。\n\n我读了很久，没有记笔记，也没有立刻计划做成项目。那种好奇心很轻，但很明确。也许方向不总是通过宏大的决定出现，有时只是某个问题让我愿意继续坐在那里。',
    prompt: '如果暂时不考虑它能带来什么，这个问题本身为什么吸引你？',
    answer: '因为它和人怎样理解自己有关。我好像一直对“技术如何反过来塑造人”很敏感。'
  },
  {
    id: 17,
    ...dateParts(53),
    mood: '紧张',
    weather: '多云，18°C',
    title: '把半成品发给了别人',
    excerpt: '点击发送以前，我又改了三遍开头。最后告诉自己，对方需要看到的是现在的东西，不是我想象中的最终版本。',
    body: '点击发送以前，我又改了三遍开头。最后告诉自己，对方需要看到的是现在的东西，不是我想象中的最终版本。\n\n发出去以后还是很紧张，但也有一种奇怪的轻松。作品一旦离开我，就不再只由我的担心构成。它终于可以遇到真实的反应。',
    prompt: '把半成品交给真实世界后，你失去了什么控制，又获得了什么？',
    answer: '失去了独自想象它很完美或很糟糕的权利，获得了真正修改它的依据。'
  },
  {
    id: 18,
    ...dateParts(56),
    mood: '安静',
    weather: '小雨，14°C',
    title: '一个人吃晚饭',
    excerpt: '没有播放视频，也没有边吃边看消息。刚开始觉得房间太安静，后来听见窗外的雨声，突然觉得独处并不等于等待别人出现。',
    body: '没有播放视频，也没有边吃边看消息。刚开始觉得房间太安静。\n\n后来听见窗外的雨声，突然觉得独处并不等于等待别人出现。我可以真的在这里，而不是把每一段空闲都填满，好像安静本身会暴露什么。',
    prompt: '当你不再用信息填满独处，剩下来的是什么？',
    answer: '一开始是空，然后是一些很慢的感觉。它们没有那么可怕。'
  },
  {
    id: 19,
    ...dateParts(59),
    mood: '摇摆',
    weather: '晴转阴，19°C',
    title: '又改了一次计划',
    excerpt: '我担心这说明自己不够坚定。但回头看，原来的计划建立在一个已经改变的前提上，坚持它可能只是为了显得前后一致。',
    body: '我担心这说明自己不够坚定。但回头看，原来的计划建立在一个已经改变的前提上。\n\n我很容易把改变方向理解为失败，好像成熟的人应该一开始就知道答案。可真正不诚实的，也许是为了显得前后一致，继续执行一个自己已经不相信的计划。',
    prompt: '这次改变是逃避困难，还是回应了新的事实？',
    answer: '更像后者。我不是因为事情变难而离开，而是发现目标本身已经不再重要。'
  },
  {
    id: 20,
    ...dateParts(63),
    mood: '期待',
    weather: '清晨有雾，13°C',
    title: '写下第一个版本的自己',
    excerpt: '问卷生成的人格描述有些地方准确得让我不舒服，也有些地方太像通用答案。我一条条修改，第一次觉得“被理解”也需要自己的参与。',
    body: '问卷生成的人格描述有些地方准确得让我不舒服，也有些地方太像通用答案。\n\n我一条条修改，删掉那些听起来正确却不属于我的话，也补上自己一直不太愿意承认的部分。第一次觉得“被理解”并不是被动接受一个结论，它也需要我参与。\n\n这只是第一个版本。我希望以后回来看时，能知道哪些东西改变了，哪些只是我终于愿意说出来。',
    prompt: '在这份描述里，哪一句最像你，哪一句仍然需要时间验证？',
    answer: '“用准备保护自己不去开始”很像我；但我不确定自己是否真的缺少坚持，也许我只是常选错了值得坚持的事。'
  }
]

const initialObservations = [
  {
    id: 'o1',
    status: 'pending',
    confidence: '出现于 7 篇日记',
    title: '你常把“准备得更好”当作推迟面对评价的方式',
    detail: '当一件事可能得到他人反馈时，你会延长准备时间，并把这种等待解释为对质量的要求。真正行动后，你通常发现风险低于预期。',
    evidence: [1, 6, 11, 17]
  },
  {
    id: 'o2',
    status: 'confirmed',
    confidence: '出现于 5 篇日记',
    title: '你正在学习把休息从奖励变成一种正常需要',
    detail: '过去你常用完成量决定自己是否有资格休息。近期的记录里，你开始更早识别疲惫，并减少事后的自我惩罚。',
    evidence: [2, 7, 13]
  },
  {
    id: 'o3',
    status: 'pending',
    confidence: '出现于 4 篇日记',
    title: '你在人际关系中倾向于用“解决问题”证明关心',
    detail: '当亲近的人表达困难时，你会很快寻找建议；但在几次更满足的交流中，真正重要的是陪伴，而不是答案。',
    evidence: [3, 14]
  }
]

const navItems = [
  ['today', '此刻'],
  ['journal', '日记'],
  ['review', '回顾'],
  ['observations', '观察'],
  ['persona', 'Persona']
]

function EntryReader({ entry, onClose }) {
  if (!entry) return null
  return (
    <div className="reader-backdrop" onClick={onClose}>
      <article className="entry-reader" onClick={(event) => event.stopPropagation()}>
        <button className="reader-close" onClick={onClose} aria-label="关闭">×</button>
        <p className="eyebrow">{entry.date} · {entry.weather}</p>
        <h2>{entry.title}</h2>
        <div className="reader-copy">
          {entry.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="reflection-block">
          <span>DearDairy 问</span>
          <p>{entry.prompt}</p>
          <blockquote>{entry.answer}</blockquote>
        </div>
      </article>
    </div>
  )
}

function ObservationCard({ item, entriesById, onDecision }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)

  return (
    <article className={`observation-card status-${item.status}`}>
      <div className="observation-meta">
        <span>{item.status === 'confirmed' ? '已确认' : item.status === 'rejected' ? '已拒绝' : '等待你的判断'}</span>
        <span>{item.confidence}</span>
      </div>
      {editing ? (
        <textarea className="observation-edit" value={draft} onChange={(event) => setDraft(event.target.value)} />
      ) : <h3>{item.title}</h3>}
      <p>{item.detail}</p>
      <button className="evidence-toggle" onClick={() => setOpen(!open)}>
        {open ? '收起依据' : `查看 ${item.evidence.length} 条日记依据`} <span>{open ? '↑' : '↓'}</span>
      </button>
      {open && (
        <div className="evidence-list">
          {item.evidence.map((id) => {
            const entry = entriesById[id]
            return (
              <div className="evidence" key={id}>
                <time>{entry.date}</time>
                <p>“{entry.excerpt}”</p>
              </div>
            )
          })}
        </div>
      )}
      {item.status === 'pending' && (
        <div className="decision-row">
          {editing ? (
            <>
              <button className="primary-action" onClick={() => { onDecision(item.id, 'confirmed', draft); setEditing(false) }}>保存并确认</button>
              <button onClick={() => setEditing(false)}>取消</button>
            </>
          ) : (
            <>
              <button className="primary-action" onClick={() => onDecision(item.id, 'confirmed')}>这符合我</button>
              <button onClick={() => setEditing(true)}>修改表述</button>
              <button onClick={() => onDecision(item.id, 'rejected')}>不符合</button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

export default function DemoApp() {
  const today = useMemo(() => relativeDate(0), [])
  const [view, setView] = useState('today')
  const [reviewType, setReviewType] = useState('week')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [observations, setObservations] = useState(initialObservations)
  const [draft, setDraft] = useState('')
  const [savedDraft, setSavedDraft] = useState(false)
  const entriesById = useMemo(() => Object.fromEntries(entries.map((entry) => [entry.id, entry])), [])
  const weekStart = useMemo(() => relativeDate(7), [])
  const monthStart = useMemo(() => relativeDate(30), [])

  const decide = (id, status, title) => {
    setObservations((current) => current.map((item) => item.id === id ? { ...item, status, title: title || item.title } : item))
  }

  const saveDemoDraft = () => {
    if (!draft.trim()) return
    setSavedDraft(true)
    window.setTimeout(() => setSavedDraft(false), 2600)
    setDraft('')
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="brand-lockup">
          <span className="brand-moon">◐</span>
          <div><strong>DearDairy</strong><small>interactive archive</small></div>
        </div>
        <nav>
          {navItems.map(([id, label]) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              <span>{label}</span>
              {id === 'observations' && <em>{observations.filter((item) => item.status === 'pending').length}</em>}
            </button>
          ))}
        </nav>
        <div className="demo-note">
          <span>演示档案</span>
          <p>所有内容均为虚构。你的操作只保留到刷新页面之前。</p>
        </div>
      </aside>

      <main className="demo-main">
        <header className="demo-topbar">
          <button className="mobile-brand" onClick={() => setView('today')}>◐ DearDairy</button>
          <div className="demo-status"><i /> 只读演示 · 无需账号</div>
          <a href="/" className="original-link">原始应用</a>
        </header>

        {view === 'today' && (
          <div className="view-wrap today-view">
            <section className="today-heading">
              <p className="eyebrow">{formatFullDate(today)}</p>
              <h1>晚上好，<br />今天有什么值得留下？</h1>
              <p>不需要总结完整的一天。写下一件此刻仍停留在你心里的事就好。</p>
            </section>
            <section className="write-sheet">
              <div className="sheet-date"><span>{today.getDate()}</span><div>{zhMonths[today.getMonth()]}<small>{zhWeekdays[today.getDay()]}</small></div></div>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="从此刻最真实的一句话开始……" />
              <div className="sheet-footer">
                <span>仅用于体验，不会上传或保存</span>
                <button onClick={saveDemoDraft}>{savedDraft ? '已留在这一刻' : '完成记录'}</button>
              </div>
            </section>
            <section className="quiet-prompt">
              <span>一个可以不回答的问题</span>
              <p>今天有没有一个时刻，你选择了对自己宽容一点？</p>
            </section>
          </div>
        )}

        {view === 'journal' && (
          <div className="view-wrap">
            <div className="section-heading">
              <div><p className="eyebrow">ARCHIVE · {today.getFullYear()}</p><h1>日记</h1></div>
              <p>不是连续记录的证明，<br />只是曾经认真生活过的痕迹。</p>
            </div>
            <div className="journal-list">
              {entries.map((entry) => (
                <button className="journal-row" key={entry.id} onClick={() => setSelectedEntry(entry)}>
                  <div className="journal-date"><strong>{entry.day}</strong><span>{entry.month}<br />{entry.weekday}</span></div>
                  <div className="journal-content"><div><span>{entry.mood}</span><span>{entry.weather}</span></div><h2>{entry.title}</h2><p>{entry.excerpt}</p></div>
                  <span className="row-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'review' && (
          <div className="view-wrap review-view">
            <div className="section-heading">
              <div><p className="eyebrow">A VIEW THROUGH TIME</p><h1>回顾</h1></div>
              <p>内容预先写好，时间范围会随着<br />每次访问当天自动向前移动。</p>
            </div>
            <div className="review-switch" role="tablist" aria-label="回顾周期">
              <button className={reviewType === 'week' ? 'active' : ''} onClick={() => setReviewType('week')}>这一周</button>
              <button className={reviewType === 'month' ? 'active' : ''} onClick={() => setReviewType('month')}>这个月</button>
            </div>

            {reviewType === 'week' ? (
              <article className="review-paper">
                <div className="review-period"><span>WEEKLY NOTE</span><time>{formatRange(weekStart, today)}</time></div>
                <h2>你没有突然变得勇敢，<br />只是少等了一次“准备好”。</h2>
                <p>这一周的两篇记录都围绕着同一个变化：你仍然会预想评价和失败，但行动与犹豫之间的距离缩短了。发出那封邮件并没有消除不安，它只是让你看到，不安可以和行动同时存在。</p>
                <div className="review-pullquote">“我并不是真的不知道怎么写，只是不想面对对方可能不满意。”</div>
                <h3>值得带到下一周的问题</h3>
                <p>下一次你发现自己还在“优化”时，能否先区分：这是必要的完善，还是在等待一种现实无法提供的保证？</p>
                <footer><span>依据</span><button onClick={() => setSelectedEntry(entries[0])}>{entries[0].date} · {entries[0].title}</button><button onClick={() => setSelectedEntry(entries[1])}>{entries[1].date} · {entries[1].title}</button></footer>
              </article>
            ) : (
              <article className="review-paper monthly-paper">
                <div className="review-period"><span>MONTHLY LETTER</span><time>{formatRange(monthStart, today)}</time></div>
                <h2>这个月，你开始把“理解自己”<br />和“审判自己”分开。</h2>
                <p>最近九次记录里反复出现的是一种松动：计划落空时，你第一次没有立刻计算损失；朋友表达困难时，你没有急着提供答案；看到别人的进展时，你也短暂地问了自己究竟想要什么。</p>
                <p>这些时刻并不意味着旧模式已经消失。比较、完美主义和对评价的敏感仍然很快出现。但你开始在它们出现之后，多留出一点空间，而不是立刻相信它们。</p>
                <div className="month-patterns">
                  <div><span>反复出现</span><strong>面对评价前延长准备</strong></div>
                  <div><span>正在变化</span><strong>允许休息，不立即惩罚自己</strong></div>
                  <div><span>新的发现</span><strong>陪伴不一定需要提供答案</strong></div>
                </div>
                <h3>这个月留下的一句话</h3>
                <div className="review-pullquote">“我甚至不知道自己是否真的想要她得到的东西。”</div>
                <footer><span>覆盖记录</span><strong>{entries.length} 篇模拟日记</strong><button onClick={() => setView('observations')}>查看由此形成的观察 →</button></footer>
              </article>
            )}
          </div>
        )}

        {view === 'observations' && (
          <div className="view-wrap">
            <div className="section-heading observations-heading">
              <div><p className="eyebrow">RECENT PATTERNS</p><h1>近期观察</h1></div>
              <p>这些不是关于你的事实。<br />它们只是等待你判断的假设。</p>
            </div>
            <div className="observation-intro">
              <span>{observations.filter((item) => item.status === 'pending').length}</span>
              <p>条观察正在等待你的判断。只有你确认的内容，才可能进入长期 Persona。</p>
            </div>
            <div className="observation-grid">
              {observations.map((item) => <ObservationCard key={item.id} item={item} entriesById={entriesById} onDecision={decide} />)}
            </div>
          </div>
        )}

        {view === 'persona' && (
          <div className="view-wrap persona-view">
            <div className="section-heading">
              <div><p className="eyebrow">PERSONA · VERSION 1.3</p><h1>关于现在的你</h1></div>
              <p>更新于 {today.getFullYear()} 年 {today.getMonth() + 1} 月<br />由 20 篇日记与 6 条确认观察共同形成</p>
            </div>
            <div className="persona-layout">
              <article className="persona-paper">
                <p className="persona-lead">你是一个需要先在心里理解事情，才愿意开始行动的人。</p>
                <p>你对自己的要求常常先于行动出现。准备、梳理和寻找更准确的表达能带给你安全感，也可能成为推迟面对评价的方式。你并不缺少判断力；真正困难的是允许自己在没有把握时仍然开始。</p>
                <h2>最近正在发生的变化</h2>
                <p>你开始更早地辨认疲惫，不再总把休息解释为失败。在关系中，你也逐渐发现，陪伴不一定需要通过建议来证明。</p>
                <h2>仍值得留意</h2>
                <p>当身边的人进入新的阶段，你很容易把他们的进度转换成对自己的判断。比较发生得很快，但那不总是你真正想走的方向。</p>
                <div className="persona-signoff">这是一份共同编辑的描述，<br />不是对你的最终结论。</div>
              </article>
              <aside className="persona-margin">
                <div><span>主要证据</span><strong>20</strong><small>篇日记</small></div>
                <div><span>你的确认</span><strong>6</strong><small>条观察</small></div>
                <div><span>上次变化</span><strong>{`${entries[1].value.getMonth() + 1}.${String(entries[1].value.getDate()).padStart(2, '0')}`}</strong><small>关于休息</small></div>
                <button onClick={() => setView('observations')}>查看形成过程 →</button>
              </aside>
            </div>
          </div>
        )}
      </main>

      <div className="mobile-nav">
        {navItems.map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>)}
      </div>
      <EntryReader entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}
