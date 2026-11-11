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

function formatFullDate(value, lang = 'zh') {
  if (lang === 'en') return value.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月 ${value.getDate()} 日，${zhWeekdays[value.getDay()]}`
}

function formatRange(start, end, lang = 'zh') {
  if (lang === 'en') {
    const startText = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const endText = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${startText} — ${endText}`
  }
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

const englishEntries = {
  1: { mood: 'Calm', weather: 'Mist, 12°C', title: 'I finally sent that email', excerpt: 'I delayed it for three days, but writing it took twenty minutes. I thought I was waiting for better wording; really, I was waiting for a guarantee that nothing would go wrong.', body: 'I delayed it for three days, but writing it took twenty minutes.\n\nI thought I was waiting for better wording. Looking back, I was waiting for a guarantee that nothing would go wrong. After I sent it, nothing dramatic happened. The reply came quickly and sounded completely ordinary.\n\nIt is almost funny how long I rehearsed a conflict that never happened. Walking home, I felt unexpectedly light.', prompt: 'Were you waiting for better wording, or for a guarantee that you would not be rejected?', answer: 'Probably the second. I knew what to write; I just did not want to face the possibility that they might dislike it.' },
  2: { mood: 'Tired', weather: 'Rain, 9°C', title: 'A day when the plan did not happen', excerpt: 'I barely did anything this afternoon. Usually I would calculate how much time I had wasted, but today I showered, made dinner, and closed the computer early.', body: 'I barely did anything this afternoon. Usually I would immediately calculate how much time I had wasted, but today I showered, made dinner, and closed the computer early.\n\nI still dislike the feeling of a plan falling apart, but for once I did not rush to punish myself. Maybe rest does not have to be earned first.', prompt: 'If rest did not have to be earned, how would you describe today?', answer: 'It was not a failed day. My body simply knew I needed to stop before my plan did.' },
  3: { mood: 'Bright', weather: 'Sunny, 16°C', title: 'A long walk by the river with L', excerpt: 'We solved nothing, but we said out loud what we had each been afraid of. I had forgotten what it felt like to talk without an objective.', body: 'We solved nothing, but we said out loud what we had each been afraid of.\n\nOn the way home, I realised how long it had been since I talked without an objective. I often think caring means offering useful advice. Today, simply listening was enough.', prompt: 'What made simply listening feel sufficient today?', answer: 'She was not asking me for an answer. She needed someone to sit beside the question with her.' },
  4: { mood: 'Unsteady', weather: 'Cloudy, 14°C', title: 'Comparing myself again', excerpt: 'When someone announced a new job, my first reaction was not happiness for her. I immediately checked whether I was falling behind.', body: 'When someone announced a new job, my first reaction was not happiness for her. I immediately checked whether I was falling behind.\n\nEven after closing the page, the anxiety stayed. Later I realised I did not even know whether I wanted what she had. I was reacting to the fact that somebody else seemed to be moving.', prompt: 'If her progress were not your coordinate, where would you actually want to move?', answer: 'I want to make one small piece of work that convinces me, rather than rushing toward a position that merely looks correct.' },
  5: { mood: 'Focused', weather: 'Partly cloudy, 15°C', title: 'I finished a very small version', excerpt: 'I resisted adding more features and kept only the one thing I wanted to test. It was incomplete, but finally something I could show.', body: 'I resisted adding more features and kept only the one thing I wanted to test. It was far from complete, but finally something I could show another person.\n\nI used to think simplifying meant I was incapable. Today it felt more like judgment: knowing what not to build yet. Finishing did not feel dramatic. It felt quiet.', prompt: 'Did this version prove your ability, or that you can allow an unfinished thing to exist?', answer: 'The second matters more. I was not unable to build; I was unable to let something incomplete exist.' },
  6: { mood: 'Low', weather: 'Overcast, 11°C', title: 'One ordinary piece of criticism', excerpt: 'They only said the entrance was hard to understand. I heard: the entire idea does not work. Hours later, I reread the sentence as itself.', body: 'They only said the entrance was hard to understand. I heard: the entire idea does not work.\n\nMy mind is skilled at expanding local feedback into total rejection. Hours later, I read the sentence again: the entrance was hard to understand. A solvable problem, not a verdict on me.', prompt: 'Between “the entrance is unclear” and “the idea has failed,” which step did you add yourself?', answer: 'I assumed a good work should never confuse anyone, so one moment of confusion meant I had failed to think clearly.' },
  7: { mood: 'Light', weather: 'Sunny, 17°C', title: 'An afternoon with no plan', excerpt: 'I left the laptop at home and did not disguise the walk as “looking for inspiration.” I bought bread and sat in the park.', body: 'I left the laptop at home and did not disguise the walk as “looking for inspiration.” I bought bread and sat in the park.\n\nSeveral times I wanted to check whether I was missing something. Nothing happened. When I came home, the empty afternoon had not put me further behind.', prompt: 'When the afternoon produced no value, did you feel freedom or anxiety?', answer: 'Anxiety first, then freedom. I need time before I believe empty space will not harm me.' },
  8: { mood: 'Uncertain', weather: 'Showers, 13°C', title: 'Wanting two directions at once', excerpt: 'One direction is stable and easy to explain. The other excites me, but I do not know where it leads.', body: 'One direction is stable and easy to explain. The other excites me, but I do not know where it leads.\n\nI spent the evening listing advantages and disadvantages. The table became clearer; the decision did not. Perhaps analysis is helping me avoid the fact that every choice loses another possibility.', prompt: 'If no choice could be free of regret, which regret would you rather carry?', answer: 'I am more afraid of choosing something explainable that I am not truly curious about.' },
  9: { mood: 'Warm', weather: 'Cloudy, 14°C', title: 'Mum did not ask about results', excerpt: 'I was ready to explain why I had no clear progress. She only asked whether I had been eating properly.', body: 'I was ready to explain why I had no clear progress. She only asked whether I had been eating properly.\n\nI realised how much pressure I speak on behalf of other people. I imagine them waiting for a result, so every call feels like handing in homework. Maybe they are not always standing at the finish line watching me.', prompt: 'How many of the expectations you carry were actually spoken by someone else?', answer: 'Probably fewer than I think. I fear disappointing them, so I disappoint myself on their behalf.' },
  10: { mood: 'Calm', weather: 'Sunny, 18°C', title: 'I deleted half the task list', excerpt: 'I did not postpone the tasks. I admitted some were not important. With a shorter list, I finally knew where tomorrow could begin.', body: 'I did not postpone the tasks or move them into a vague future. I admitted some were not important.\n\nA long list made me feel full of possibility, but every item also reminded me of what I had not done. Deleting half felt like a loss. It also returned my attention.', prompt: 'Did you delete tasks, or imagined versions of who you should become?', answer: 'Both. I fear that choosing one direction means becoming a person with fewer possibilities.' },
  11: { mood: 'Restless', weather: 'Warm, 21°C', title: 'I researched far too much', excerpt: 'I wanted to confirm one approach and ended with twenty tabs. The more I learned, the less willing I was to begin.', body: 'I wanted to confirm one approach and ended with twenty tabs. The more information I had, the less willing I was to begin.\n\nI kept hoping one more example would reveal the correct structure. What I lacked was not information, but an attempt of my own. I closed the tabs and wrote a rough opening in fifteen minutes.', prompt: 'At what point did learning stop supporting action and begin delaying it?', answer: 'When I could already name the next step but insisted on finding a better method first.' },
  12: { mood: 'Bright', weather: 'Sunny, 19°C', title: 'I asked the question in class', excerpt: 'It did not sound clever. It was probably basic. The teacher answered seriously, and the person beside me said she had not understood either.', body: 'It did not sound clever. It was probably basic.\n\nI hesitated because I feared people would judge my level through the question. The teacher answered seriously, and the person beside me said she had not understood either. Silence had protected nothing. It only left me alone with the confusion.', prompt: 'If a question did not have to prove your level, what else could it be?', answer: 'A bridge between me and understanding, not public evidence of my inadequacy.' },
  13: { mood: 'Exhausted', weather: 'Rain, 12°C', title: 'My body pressed pause first', excerpt: 'I stared at the screen and could not absorb a paragraph. I stayed seated as if leaving the desk meant admitting defeat.', body: 'I stared at the screen and could not absorb a paragraph. I stayed seated as if leaving the desk meant admitting defeat.\n\nWhen my head began to hurt, I finally lay down. One hour of sleep did more than three hours of forcing myself. My body is often more honest than my plan.', prompt: 'Why is the plan easier to trust than a body that is already tired?', answer: 'The plan looks controllable. A changing body makes me feel unreliable.' },
  14: { mood: 'Soft', weather: 'Breezy, 16°C', title: 'I did not give my friend advice', excerpt: 'She said she had been unable to sleep. Solutions appeared immediately, but this time I asked whether she only wanted me to listen.', body: 'She said she had been unable to sleep. Solutions appeared immediately, but this time I asked whether she only wanted me to listen.\n\nShe said yes. We talked about the loneliness of being awake at three in the morning. I did not solve her insomnia, but her voice sounded looser when we finished.', prompt: 'When you are not responsible for solving the problem, what can you still offer?', answer: 'Attention, company, and not turning pain into another task.' },
  15: { mood: 'Disappointed', weather: 'Overcast, 15°C', title: 'The application received no reply', excerpt: 'The promised date has passed. I keep refreshing my inbox as if enough attention could change the result.', body: 'The promised date has passed. I keep refreshing my inbox as if enough attention could change the result.\n\nThe hardest part is not possible rejection, but not knowing. I turn silence into rejection, then rejection into proof that I am not good enough. The only fact is that no reply has arrived yet.', prompt: 'Between “no reply yet” and “I am not good enough,” which unverified conclusions did you add?', answer: 'I treated waiting as judgment and their choice as an accurate measure of my value.' },
  16: { mood: 'Curious', weather: 'Sunny, 20°C', title: 'A question I genuinely cared about', excerpt: 'It had been a long time since I felt this: not useful for my CV, not important because others called it a trend. I simply wanted to know.', body: 'It had been a long time since I felt this: not useful for my CV, not important because others called it a trend. I simply wanted to know.\n\nI read for a long time without taking notes or turning it into a project. The curiosity was quiet but clear. Perhaps direction does not always arrive as a grand decision. Sometimes one question simply keeps me in the chair.', prompt: 'If it led to nothing useful, why would this question still hold you?', answer: 'Because it concerns how people understand themselves. I am sensitive to the way technology shapes the person using it.' },
  17: { mood: 'Nervous', weather: 'Cloudy, 18°C', title: 'I sent the unfinished version', excerpt: 'Before clicking send, I rewrote the opening three times. Eventually I remembered they needed the work that exists, not my imagined final version.', body: 'Before clicking send, I rewrote the opening three times. Eventually I remembered they needed the work that exists, not my imagined final version.\n\nI was still nervous after sending it, but also relieved. Once the work left me, it was no longer made only of my worries. It could finally meet a real response.', prompt: 'After giving the unfinished work to reality, what control did you lose and what did you gain?', answer: 'I lost the right to imagine it as perfect or terrible. I gained real evidence for changing it.' },
  18: { mood: 'Quiet', weather: 'Light rain, 14°C', title: 'Dinner alone', excerpt: 'I did not play a video or read messages while eating. The room felt too quiet at first. Then I heard the rain.', body: 'I did not play a video or read messages while eating. The room felt too quiet at first.\n\nThen I heard the rain and realised being alone does not mean waiting for someone to appear. I can actually be here without filling every spare moment, as if silence might expose something.', prompt: 'When you stop filling solitude with information, what remains?', answer: 'Emptiness first, then slower feelings. They are not as frightening as I expected.' },
  19: { mood: 'Unsteady', weather: 'Changing skies, 19°C', title: 'I changed the plan again', excerpt: 'I worried this proved I was not committed. But the old plan relied on a condition that has changed.', body: 'I worried this proved I was not committed. But the old plan relied on a condition that has changed.\n\nI often read a change of direction as failure, as if mature people know the answer from the beginning. Perhaps the dishonest choice would be continuing a plan I no longer believe in just to look consistent.', prompt: 'Is this change an escape from difficulty, or a response to new evidence?', answer: 'The second. I am not leaving because it became hard; the goal itself no longer matters in the same way.' },
  20: { mood: 'Hopeful', weather: 'Morning mist, 13°C', title: 'Writing the first version of myself', excerpt: 'Some parts of the questionnaire profile felt uncomfortably accurate; others sounded generic. Editing it made me realise that being understood also requires participation.', body: 'Some parts of the questionnaire profile felt uncomfortably accurate; others sounded generic.\n\nI edited it line by line, removing statements that sounded right but were not mine, and adding things I rarely admit. For the first time, being understood did not feel like passively accepting a conclusion. It required my participation.\n\nThis is only a first version. I hope that later I can see what changed, and what I merely became willing to say.', prompt: 'Which sentence feels most like you, and which still needs time to prove itself?', answer: '“Using preparation to avoid beginning” feels true. But I am unsure whether I lack persistence; perhaps I often choose the wrong things to persist with.' }
}

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

const englishObservations = {
  o1: { confidence: 'Seen in 7 entries', title: 'You often use “preparing better” to postpone being evaluated', detail: 'When something may receive feedback, you extend preparation and explain the wait as quality control. Once you act, the risk is usually smaller than expected.' },
  o2: { confidence: 'Seen in 5 entries', title: 'You are learning to treat rest as a normal need rather than a reward', detail: 'You used to decide whether you deserved rest by how much you finished. Recently, you notice exhaustion earlier and punish yourself less afterward.' },
  o3: { confidence: 'Seen in 4 entries', title: 'In relationships, you tend to prove care by solving problems', detail: 'When someone close expresses difficulty, you quickly search for advice. In your more satisfying conversations, presence mattered more than an answer.' }
}

const ui = {
  zh: {
    nav: [['today', '此刻'], ['journal', '日记'], ['review', '回顾'], ['observations', '观察'], ['persona', 'Persona']],
    archive: '交互档案', demoNote: '演示档案', demoDesc: '所有内容均为虚构。你的操作只保留到刷新页面之前。', status: '只读演示 · 无需账号', original: '实际网站',
    greeting: '晚上好，', question: '今天有什么值得留下？', todayHelp: '不需要总结完整的一天。写下一件此刻仍停留在你心里的事就好。', placeholder: '从此刻最真实的一句话开始……', localOnly: '仅用于体验，不会上传或保存', save: '完成记录', saved: '已留在这一刻', optional: '一个可以不回答的问题', gentlePrompt: '今天有没有一个时刻，你选择了对自己宽容一点？',
    journal: '日记', journalSub: <>不是连续记录的证明，<br />只是曾经认真生活过的痕迹。</>, review: '回顾', reviewSub: <>内容预先写好，时间范围会随着<br />每次访问当天自动向前移动。</>, week: '这一周', month: '这个月', observations: '近期观察', obsSub: <>这些不是关于你的事实。<br />它们只是等待你判断的假设。</>, waiting: '条观察正在等待你的判断。只有你确认的内容，才可能进入长期 Persona。', persona: '关于现在的你'
  },
  en: {
    nav: [['today', 'Now'], ['journal', 'Journal'], ['review', 'Reviews'], ['observations', 'Observations'], ['persona', 'Persona']],
    archive: 'interactive archive', demoNote: 'Demo profile', demoDesc: 'All content is fictional. Your actions reset when the page refreshes.', status: 'Read-only demo · no account', original: 'Real application',
    greeting: 'Good evening,', question: 'what is worth keeping today?', todayHelp: 'You do not need to summarize the whole day. Begin with the one thing still staying with you.', placeholder: 'Begin with the most honest sentence you have…', localOnly: 'For exploration only. Nothing is uploaded or saved.', save: 'Finish entry', saved: 'Kept for this moment', optional: 'A question you may leave unanswered', gentlePrompt: 'Was there a moment today when you chose to be a little kinder to yourself?',
    journal: 'Journal', journalSub: <>Not proof of perfect consistency,<br />only traces of a life paid attention to.</>, review: 'Reviews', reviewSub: <>The writing stays the same while its dates<br />move with the day you visit.</>, week: 'This week', month: 'This month', observations: 'Recent observations', obsSub: <>These are not facts about you.<br />They are hypotheses awaiting your judgment.</>, waiting: 'observations are waiting for you. Only what you confirm may enter the long-term Persona.', persona: 'About who you are now'
  }
}

function EntryReader({ entry, onClose, lang }) {
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
          <span>{lang === 'en' ? 'DearDairy asks' : 'DearDairy 问'}</span>
          <p>{entry.prompt}</p>
          <blockquote>{entry.answer}</blockquote>
        </div>
      </article>
    </div>
  )
}

function ObservationCard({ item, entriesById, onDecision, lang }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)

  return (
    <article className={`observation-card status-${item.status}`}>
      <div className="observation-meta">
        <span>{lang === 'en' ? (item.status === 'confirmed' ? 'Confirmed' : item.status === 'rejected' ? 'Rejected' : 'Awaiting your judgment') : (item.status === 'confirmed' ? '已确认' : item.status === 'rejected' ? '已拒绝' : '等待你的判断')}</span>
        <span>{item.confidence}</span>
      </div>
      {editing ? (
        <textarea className="observation-edit" value={draft} onChange={(event) => setDraft(event.target.value)} />
      ) : <h3>{item.title}</h3>}
      <p>{item.detail}</p>
      <button className="evidence-toggle" onClick={() => setOpen(!open)}>
        {lang === 'en' ? (open ? 'Hide evidence' : `View ${item.evidence.length} journal sources`) : (open ? '收起依据' : `查看 ${item.evidence.length} 条日记依据`)} <span>{open ? '↑' : '↓'}</span>
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
              <button className="primary-action" onClick={() => { onDecision(item.id, 'confirmed', draft); setEditing(false) }}>{lang === 'en' ? 'Save and confirm' : '保存并确认'}</button>
              <button onClick={() => setEditing(false)}>{lang === 'en' ? 'Cancel' : '取消'}</button>
            </>
          ) : (
            <>
              <button className="primary-action" onClick={() => onDecision(item.id, 'confirmed')}>{lang === 'en' ? 'This fits me' : '这符合我'}</button>
              <button onClick={() => setEditing(true)}>{lang === 'en' ? 'Edit wording' : '修改表述'}</button>
              <button onClick={() => onDecision(item.id, 'rejected')}>{lang === 'en' ? 'This does not fit' : '不符合'}</button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

export default function DemoApp({ lang = 'en', mode = 'demo' }) {
  const c = ui[lang]
  const isLocal = mode === 'local'
  const today = useMemo(() => relativeDate(0), [])
  const [sourceEntries, setSourceEntries] = useState(() => {
    if (!isLocal) return entries
    try { return JSON.parse(localStorage.getItem('deardairy_local_entries') || '[]') } catch { return [] }
  })
  const demoEntries = useMemo(() => sourceEntries.map((entry) => {
    if (isLocal) {
      const value = new Date(entry.date)
      const moodLabels = lang === 'en' ? ['Very low', 'Low', 'Okay', 'Good', 'Bright'] : ['很糟', '不好', '普通', '还行', '很好']
      return {
        ...entry,
        value,
        date: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`,
        day: String(value.getDate()),
        month: lang === 'en' ? value.toLocaleDateString('en-GB', { month: 'short' }) : zhMonths[value.getMonth()],
        weekday: lang === 'en' ? value.toLocaleDateString('en-GB', { weekday: 'short' }) : shortWeekdays[value.getDay()],
        mood: typeof entry.mood === 'number' ? moodLabels[Math.max(0, Math.min(4, entry.mood - 1))] : (entry.mood || moodLabels[2]),
        weather: entry.weather || (lang === 'en' ? 'Local entry' : '本地记录'),
        title: entry.title || entry.content?.split(/[。.!?\n]/)[0]?.slice(0, 34) || (lang === 'en' ? 'Untitled entry' : '未命名日记'),
        excerpt: entry.excerpt || entry.content?.slice(0, 150) || '',
        body: entry.body || entry.content || '',
        prompt: entry.prompt || entry.question || '',
        answer: entry.answer || ''
      }
    }
    if (lang === 'zh') return entry
    return {
      ...entry,
      ...englishEntries[entry.id],
      month: entry.value.toLocaleDateString('en-GB', { month: 'short' }),
      weekday: entry.value.toLocaleDateString('en-GB', { weekday: 'short' })
    }
  }), [lang, sourceEntries, isLocal])
  const startingObservations = useMemo(() => isLocal ? [] : initialObservations.map((item) => lang === 'en' ? { ...item, ...englishObservations[item.id] } : item), [lang, isLocal])
  const [view, setView] = useState('today')
  const [reviewType, setReviewType] = useState('week')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [observations, setObservations] = useState(startingObservations)
  const [draft, setDraft] = useState('')
  const [savedDraft, setSavedDraft] = useState(false)
  const [apiProvider, setApiProvider] = useState(localStorage.getItem('deardairy_ai_provider') || 'deepseek')
  const [apiBase, setApiBase] = useState(localStorage.getItem('deardairy_ai_base') || 'https://api.deepseek.com/v1')
  const [apiModel, setApiModel] = useState(localStorage.getItem('deardairy_ai_model') || 'deepseek-chat')
  const [apiKey, setApiKey] = useState(sessionStorage.getItem('deardairy_ai_key') || '')
  const [apiSaved, setApiSaved] = useState(false)
  const nav = useMemo(() => isLocal ? [...c.nav, ['settings', lang === 'en' ? 'Settings' : '设置']] : c.nav, [c.nav, isLocal, lang])
  const entriesById = useMemo(() => Object.fromEntries(demoEntries.map((entry) => [entry.id, entry])), [demoEntries])
  const weekStart = useMemo(() => relativeDate(7), [])
  const monthStart = useMemo(() => relativeDate(30), [])

  const decide = (id, status, title) => {
    setObservations((current) => current.map((item) => item.id === id ? { ...item, status, title: title || item.title } : item))
  }

  const saveDemoDraft = () => {
    if (!draft.trim()) return
    if (isLocal) {
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: draft.trim(),
        mood: 3,
        question: null,
        answer: null
      }
      const next = [entry, ...sourceEntries]
      setSourceEntries(next)
      localStorage.setItem('deardairy_local_entries', JSON.stringify(next))
    }
    setSavedDraft(true)
    window.setTimeout(() => setSavedDraft(false), 2600)
    setDraft('')
  }

  const saveApiSettings = () => {
    localStorage.setItem('deardairy_ai_provider', apiProvider)
    localStorage.setItem('deardairy_ai_base', apiBase)
    localStorage.setItem('deardairy_ai_model', apiModel)
    if (apiKey.trim()) sessionStorage.setItem('deardairy_ai_key', apiKey.trim())
    else sessionStorage.removeItem('deardairy_ai_key')
    setApiSaved(true)
    window.setTimeout(() => setApiSaved(false), 2200)
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="brand-lockup">
          <span className="brand-moon">◐</span>
          <div><strong>DearDairy</strong><small>{c.archive}</small></div>
        </div>
        <nav>
          {nav.map(([id, label]) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              <span>{label}</span>
              {id === 'observations' && <em>{observations.filter((item) => item.status === 'pending').length}</em>}
            </button>
          ))}
        </nav>
        <div className="demo-note">
          <span>{isLocal ? (lang === 'en' ? 'Local journal' : '本地日记') : c.demoNote}</span>
          <p>{isLocal ? (lang === 'en' ? 'Your writing stays in this browser. Export a backup before clearing browser data.' : '你的日记仅保存在当前浏览器。清除浏览器数据前请先导出备份。') : c.demoDesc}</p>
        </div>
      </aside>

      <main className="demo-main">
        <header className="demo-topbar">
          <button className="mobile-brand" onClick={() => setView('today')}>◐ DearDairy</button>
          <div className="demo-status"><i /> {isLocal ? (lang === 'en' ? 'Local-only · saved in this browser' : '仅本地 · 保存在当前浏览器') : c.status}</div>
          <a href={lang === 'en' ? '/' : '/cn'} className="original-link">{isLocal ? (lang === 'en' ? 'Exit local journal' : '退出本地日记') : c.original}</a>
        </header>

        {view === 'today' && (
          <div className="view-wrap today-view">
            <section className="today-heading">
              <p className="eyebrow">{formatFullDate(today, lang)}</p>
              <h1>{c.greeting}<br />{c.question}</h1>
              <p>{c.todayHelp}</p>
            </section>
            <section className="write-sheet">
              <div className="sheet-date"><span>{today.getDate()}</span><div>{lang === 'en' ? today.toLocaleDateString('en-GB', { month: 'long' }) : zhMonths[today.getMonth()]}<small>{lang === 'en' ? today.toLocaleDateString('en-GB', { weekday: 'long' }) : zhWeekdays[today.getDay()]}</small></div></div>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={c.placeholder} />
              <div className="sheet-footer">
                <span>{isLocal ? (lang === 'en' ? 'Saved only in this browser' : '仅保存在当前浏览器') : c.localOnly}</span>
                <button onClick={saveDemoDraft}>{savedDraft ? c.saved : c.save}</button>
              </div>
            </section>
            <section className="quiet-prompt">
              <span>{c.optional}</span>
              <p>{c.gentlePrompt}</p>
            </section>
          </div>
        )}

        {view === 'journal' && (
          <div className="view-wrap">
            <div className="section-heading">
              <div><p className="eyebrow">ARCHIVE · {today.getFullYear()}</p><h1>{c.journal}</h1></div>
              <p>{c.journalSub}</p>
            </div>
            {demoEntries.length === 0 && (
              <div className="local-empty"><span>01</span><h2>{lang === 'en' ? 'Your archive begins with the first entry.' : '你的档案从第一篇日记开始。'}</h2><p>{lang === 'en' ? 'Return to Now and write something. It will appear here and remain in this browser.' : '回到“此刻”写下一段内容，它会出现在这里，并保留在当前浏览器中。'}</p><button onClick={() => setView('today')}>{lang === 'en' ? 'Write the first entry →' : '写下第一篇 →'}</button></div>
            )}
            <div className="journal-list">
              {demoEntries.map((entry) => (
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
              <div><p className="eyebrow">A VIEW THROUGH TIME</p><h1>{c.review}</h1></div>
              <p>{c.reviewSub}</p>
            </div>
            {isLocal ? (
              <div className="local-empty"><span>02</span><h2>{lang === 'en' ? 'Reviews will be made from your own writing.' : '回顾将从你自己的日记中生成。'}</h2><p>{lang === 'en' ? 'Connect your AI in Settings when you are ready. Until then, no fictional analysis will be shown as if it were yours.' : '准备好后，可以在“设置”中连接自己的 AI。在此之前，这里不会把虚构分析冒充成你的回顾。'}</p><button onClick={() => setView('settings')}>{lang === 'en' ? 'Open AI settings →' : '前往 AI 设置 →'}</button></div>
            ) : <>
            <div className="review-switch" role="tablist" aria-label="回顾周期">
              <button className={reviewType === 'week' ? 'active' : ''} onClick={() => setReviewType('week')}>{c.week}</button>
              <button className={reviewType === 'month' ? 'active' : ''} onClick={() => setReviewType('month')}>{c.month}</button>
            </div>

            {reviewType === 'week' ? (
              <article className="review-paper">
                <div className="review-period"><span>WEEKLY NOTE</span><time>{formatRange(weekStart, today, lang)}</time></div>
                <h2>{lang === 'en' ? <>You did not suddenly become brave.<br />You simply waited once less to feel ready.</> : <>你没有突然变得勇敢，<br />只是少等了一次“准备好”。</>}</h2>
                <p>{lang === 'en' ? 'Both entries this week point to the same change: you still anticipate judgment and failure, but the distance between hesitation and action has shortened. Sending the email did not remove anxiety. It showed that anxiety and action can exist together.' : '这一周的两篇记录都围绕着同一个变化：你仍然会预想评价和失败，但行动与犹豫之间的距离缩短了。发出那封邮件并没有消除不安，它只是让你看到，不安可以和行动同时存在。'}</p>
                <div className="review-pullquote">{lang === 'en' ? '“I knew what to write; I just did not want to face the possibility that they might dislike it.”' : '“我并不是真的不知道怎么写，只是不想面对对方可能不满意。”'}</div>
                <h3>{lang === 'en' ? 'A question to carry into next week' : '值得带到下一周的问题'}</h3>
                <p>{lang === 'en' ? 'The next time you find yourself still optimizing, can you distinguish necessary refinement from waiting for a guarantee reality cannot provide?' : '下一次你发现自己还在“优化”时，能否先区分：这是必要的完善，还是在等待一种现实无法提供的保证？'}</p>
                <footer><span>{lang === 'en' ? 'Sources' : '依据'}</span><button onClick={() => setSelectedEntry(demoEntries[0])}>{demoEntries[0].date} · {demoEntries[0].title}</button><button onClick={() => setSelectedEntry(demoEntries[1])}>{demoEntries[1].date} · {demoEntries[1].title}</button></footer>
              </article>
            ) : (
              <article className="review-paper monthly-paper">
                <div className="review-period"><span>MONTHLY LETTER</span><time>{formatRange(monthStart, today, lang)}</time></div>
                <h2>{lang === 'en' ? <>This month, you began separating<br />understanding yourself from judging yourself.</> : <>这个月，你开始把“理解自己”<br />和“审判自己”分开。</>}</h2>
                <p>{lang === 'en' ? 'Across the nine most recent entries, something repeatedly loosened: when a plan failed, you did not immediately calculate the loss; when a friend struggled, you did not rush to provide an answer; when someone else moved ahead, you briefly asked what you actually wanted.' : '最近九次记录里反复出现的是一种松动：计划落空时，你第一次没有立刻计算损失；朋友表达困难时，你没有急着提供答案；看到别人的进展时，你也短暂地问了自己究竟想要什么。'}</p>
                <p>{lang === 'en' ? 'The old patterns have not disappeared. Comparison, perfectionism, and sensitivity to judgment still arrive quickly. But after they appear, you are beginning to leave a little space before believing them.' : '这些时刻并不意味着旧模式已经消失。比较、完美主义和对评价的敏感仍然很快出现。但你开始在它们出现之后，多留出一点空间，而不是立刻相信它们。'}</p>
                <div className="month-patterns">
                  <div><span>{lang === 'en' ? 'Recurring' : '反复出现'}</span><strong>{lang === 'en' ? 'Extending preparation before evaluation' : '面对评价前延长准备'}</strong></div>
                  <div><span>{lang === 'en' ? 'Changing' : '正在变化'}</span><strong>{lang === 'en' ? 'Allowing rest without immediate punishment' : '允许休息，不立即惩罚自己'}</strong></div>
                  <div><span>{lang === 'en' ? 'New discovery' : '新的发现'}</span><strong>{lang === 'en' ? 'Presence does not always require an answer' : '陪伴不一定需要提供答案'}</strong></div>
                </div>
                <h3>{lang === 'en' ? 'The sentence this month leaves behind' : '这个月留下的一句话'}</h3>
                <div className="review-pullquote">{lang === 'en' ? '“I did not even know whether I wanted what she had.”' : '“我甚至不知道自己是否真的想要她得到的东西。”'}</div>
                <footer><span>{lang === 'en' ? 'Coverage' : '覆盖记录'}</span><strong>{demoEntries.length} {lang === 'en' ? 'fictional entries' : '篇模拟日记'}</strong><button onClick={() => setView('observations')}>{lang === 'en' ? 'See the observations formed from them →' : '查看由此形成的观察 →'}</button></footer>
              </article>
            )}
            </>}
          </div>
        )}

        {view === 'observations' && (
          <div className="view-wrap">
            <div className="section-heading observations-heading">
              <div><p className="eyebrow">RECENT PATTERNS</p><h1>{c.observations}</h1></div>
              <p>{c.obsSub}</p>
            </div>
            {!isLocal && <div className="observation-intro">
              <span>{observations.filter((item) => item.status === 'pending').length}</span>
              <p>{c.waiting}</p>
            </div>}
            {isLocal && observations.length === 0 && (
              <div className="local-empty"><span>03</span><h2>{lang === 'en' ? 'No observations have been proposed yet.' : '还没有等待你判断的观察。'}</h2><p>{lang === 'en' ? 'After AI reviews enough of your entries, possible recurring patterns will appear here as hypotheses—not facts.' : '当 AI 阅读了足够的日记后，可能反复出现的模式会作为假设出现在这里，而不是直接成为事实。'}</p></div>
            )}
            <div className="observation-grid">
              {observations.map((item) => <ObservationCard key={item.id} item={item} entriesById={entriesById} onDecision={decide} lang={lang} />)}
            </div>
          </div>
        )}

        {view === 'persona' && (
          <div className="view-wrap persona-view">
            <div className="section-heading">
              <div><p className="eyebrow">PERSONA · VERSION 1.3</p><h1>{c.persona}</h1></div>
              <p>{lang === 'en' ? <>Updated {today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}<br />Formed from 20 entries and 6 confirmed observations</> : <>更新于 {today.getFullYear()} 年 {today.getMonth() + 1} 月<br />由 20 篇日记与 6 条确认观察共同形成</>}</p>
            </div>
            {isLocal ? (
              <div className="local-empty"><span>04</span><h2>{lang === 'en' ? 'Your Persona has not been written yet.' : '你的人格描述尚未形成。'}</h2><p>{lang === 'en' ? 'It will grow only from recurring observations you choose to confirm. There is no questionnaire blocking your first entry.' : '它只会从你选择确认的反复观察中逐渐形成。第一次写日记前，不需要填写问卷。'}</p><button onClick={() => setView('observations')}>{lang === 'en' ? 'Understand the process →' : '查看形成过程 →'}</button></div>
            ) : <div className="persona-layout">
              <article className="persona-paper">
                <p className="persona-lead">{lang === 'en' ? 'You are someone who needs to understand a thing inwardly before becoming willing to act.' : '你是一个需要先在心里理解事情，才愿意开始行动的人。'}</p>
                <p>{lang === 'en' ? 'Your expectations often arrive before action. Preparing, organizing, and searching for more precise language give you safety, but can also postpone evaluation. You do not lack judgment; the difficulty is allowing yourself to begin without certainty.' : '你对自己的要求常常先于行动出现。准备、梳理和寻找更准确的表达能带给你安全感，也可能成为推迟面对评价的方式。你并不缺少判断力；真正困难的是允许自己在没有把握时仍然开始。'}</p>
                <h2>{lang === 'en' ? 'What is changing recently' : '最近正在发生的变化'}</h2>
                <p>{lang === 'en' ? 'You notice exhaustion earlier and no longer always interpret rest as failure. In relationships, you are also discovering that care does not have to be proven through advice.' : '你开始更早地辨认疲惫，不再总把休息解释为失败。在关系中，你也逐渐发现，陪伴不一定需要通过建议来证明。'}</p>
                <h2>{lang === 'en' ? 'Still worth noticing' : '仍值得留意'}</h2>
                <p>{lang === 'en' ? 'When people around you enter a new stage, you quickly turn their progress into a judgment about yourself. Comparison arrives fast, but it does not always point toward the life you actually want.' : '当身边的人进入新的阶段，你很容易把他们的进度转换成对自己的判断。比较发生得很快，但那不总是你真正想走的方向。'}</p>
                <div className="persona-signoff">{lang === 'en' ? <>This description is edited with you.<br />It is not a final conclusion about you.</> : <>这是一份共同编辑的描述，<br />不是对你的最终结论。</>}</div>
              </article>
              <aside className="persona-margin">
                <div><span>{lang === 'en' ? 'Primary evidence' : '主要证据'}</span><strong>20</strong><small>{lang === 'en' ? 'journal entries' : '篇日记'}</small></div>
                <div><span>{lang === 'en' ? 'Your confirmations' : '你的确认'}</span><strong>6</strong><small>{lang === 'en' ? 'observations' : '条观察'}</small></div>
                <div><span>{lang === 'en' ? 'Last change' : '上次变化'}</span><strong>{`${demoEntries[1].value.getMonth() + 1}.${String(demoEntries[1].value.getDate()).padStart(2, '0')}`}</strong><small>{lang === 'en' ? 'about rest' : '关于休息'}</small></div>
                <button onClick={() => setView('observations')}>{lang === 'en' ? 'See how this formed →' : '查看形成过程 →'}</button>
              </aside>
            </div>}
          </div>
        )}

        {view === 'settings' && isLocal && (
          <div className="view-wrap settings-view">
            <div className="section-heading">
              <div><p className="eyebrow">LOCAL & OPTIONAL</p><h1>{lang === 'en' ? 'Settings' : '设置'}</h1></div>
              <p>{lang === 'en' ? <>Your journal stays local.<br />AI is connected only if you choose.</> : <>日记始终保存在本地。<br />只有你选择时才连接 AI。</>}</p>
            </div>
            <section className="settings-paper">
              <div className="settings-title"><span>AI</span><div><h2>{lang === 'en' ? 'Connect your own model' : '连接你自己的模型'}</h2><p>{lang === 'en' ? 'The API key is kept only for this browser session and disappears when the browser session ends.' : 'API Key 默认只保留在当前浏览器会话中，关闭会话后自动消失。'}</p></div></div>
              <label>{lang === 'en' ? 'Provider' : '服务商'}</label>
              <select value={apiProvider} onChange={(event) => setApiProvider(event.target.value)}>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="compatible">OpenAI-compatible</option>
              </select>
              <label>API Base URL</label>
              <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
              <label>{lang === 'en' ? 'Model' : '模型'}</label>
              <input value={apiModel} onChange={(event) => setApiModel(event.target.value)} />
              <label>API Key</label>
              <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-…" />
              <button className="settings-save" onClick={saveApiSettings}>{apiSaved ? (lang === 'en' ? 'Saved for this session' : '已保存到当前会话') : (lang === 'en' ? 'Save AI settings' : '保存 AI 设置')}</button>
              <p className="settings-disclosure">{lang === 'en' ? 'Connecting a model will send only the text needed for the analysis to the selected provider. DearDairy does not need a database for this mode. The forwarding proxy is the next implementation step.' : '连接模型后，只有完成当前分析所需的文字会发送给所选服务商。本地模式不需要数据库；无状态转发代理将在下一步接入。'}</p>
            </section>
          </div>
        )}
      </main>

      <div className="mobile-nav">
        {nav.map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>)}
      </div>
      <EntryReader entry={selectedEntry} onClose={() => setSelectedEntry(null)} lang={lang} />
    </div>
  )
}
