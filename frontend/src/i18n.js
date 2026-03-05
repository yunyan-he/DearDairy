// ══════════════════════════════════════════════════════
// i18n — EN / ZH translations
// ══════════════════════════════════════════════════════

export const translations = {
    zh: {
        // ── Meta ──────────────────────────────────────────
        lang: "zh",
        langLabel: "中文",
        otherLang: "English",
        voiceLang: "zh-CN",
        aiLangInstruction: "请用中文回复。",

        // ── Language Selection ────────────────────────────
        langSelect: {
            title: "选择你的语言",
            subtitle: "Select your language",
            zh: "中文",
            en: "English",
        },

        // ── Auth ──────────────────────────────────────────
        auth: {
            loginTitle: "欢迎回来",
            registerTitle: "创建账号",
            usernamePlaceholder: "用户名",
            passwordPlaceholder: "密码",
            loginBtn: "登录",
            registerBtn: "注册",
            loggingIn: "登录中…",
            registering: "注册中…",
            switchToRegister: "没有账号？注册",
            switchToLogin: "已有账号？登录",
            tagline: "你的私人日记，AI 懂你",
        },

        // ── Navigation ────────────────────────────────────
        nav: {
            write: "写今天",
            history: "日记回顾",
            summary: "AI 复盘",
            settings: "设置",
        },

        // ── Write View ────────────────────────────────────
        write: {
            todayLabel: (str) => str, // pass-through date string
            writeToday: "写今天",
            backdateDays: ["昨天", "前天"],
            moodLabel: "今天的心情",
            moods: ["很糟", "不好", "普通", "还行", "很好"],
            placeholder: "今天发生了什么……",
            voiceBtn: "🎙 语音",
            voiceStop: "停止",
            voiceError: "浏览器不支持语音识别，请使用 Chrome",
            saving: "保存中…",
            save: "保存日记",
            saved: "已保存 ✓",
            streakDays: (n) => `连续 ${n} 天`,
            streakZero: "开始你的第一天",
            alreadyWrote: "今天已写 ✓",
            backdateNote: "补记模式",
            questionLabel: "今日一问",
            questionLoading: "AI 正在思考专属问题…",
            questionSkip: "跳过",
            answerPlaceholder: "写下你的思考……",
            answerSave: "保存回答",
            lateNudgeTitle: "今天还没记下来 🌙",
            lateNudgeBody: "哪怕三行也算。明天的你会感谢今天的记录。",
            lateNudgeBtn: "现在就写",
            lateNudgeSkip: "今天跳过",
        },

        // ── History View ──────────────────────────────────
        history: {
            title: "日记回顾",
            empty: "还没有日记，去写今天的吧。",
            deleteConfirm: "确认删除这篇日记？",
            deleteBtn: "删除",
            questionLabel: "今日一问",
            answerLabel: "你的回答",
        },

        // ── Summary View ──────────────────────────────────
        summary: {
            title: "AI 复盘",
            typeWeek: "周复盘",
            typeMonth: "月复盘",
            typeYear: "年复盘",
            generate: "生成复盘",
            generating: "生成中…",
            placeholder: "选择时间范围，点击「生成复盘」",
            analyzing: "正在深入分析你的日记…",
            reminderWeek: "周一到了 ☀️",
            reminderWeekSub: "花几分钟复盘上周，让这周更清醒",
            reminderMonth: "新月开始 🌙",
            reminderMonthSub: "回顾上个月，迎接新的一月",
            reminderYear: "新年第一天 🎆",
            reminderYearSub: "是时候回顾过去一年了",
            reminderDoIt: "开始复盘",
            reminderLater: "待会儿",
            heatmap: "过去 14 天记录",
            countLabel: (n) => `${n} 篇`,
            minRequired: (min) => `需 ${min} 篇`,
            alreadyGenerated: "✓ 已生成",
        },

        // ── Settings View ─────────────────────────────────
        settings: {
            title: "设置",
            profileTitle: "个人性格档案",
            profileVersion: (v) => `当前版本 ${v} · AI 复盘后自动更新`,
            profileDesc: "这是 AI 目前对你的了解。每次生成复盘后，它会根据你最新的日记内容悄悄更新这份档案，记录你真实的成长轨迹。你可以在这里看到它对你的理解在随时间发生怎样的变化。",
            obsTitle: "近期观察",
            obsSubtitle: "每周复盘后追加 · 月复盘审核",
            obsEmpty: "完成第一次周复盘后，AI 会开始积累近期观察。",
            obsFirstSeen: (n) => n === 0 ? "今天" : `${n}天前`,
            obsLastSeen: (n) => `上次确认 ${n}天前`,
            obsConfirmed: (n) => `×${n} 已确认`,
            obsFooter: "月复盘时，反复出现的观察会被升级进入核心档案；超过60天未再出现的会被自动清除。",
            storageTitle: "数据存储说明",
            storage: [
                { icon: "🔒", title: "存储在哪里", desc: "日记和性格档案存储在云端数据库（Supabase PostgreSQL），与你的账号绑定，注册即永久保存。" },
                { icon: "📱", title: "跨设备访问", desc: "在任何设备上用相同账号登录即可看到所有日记，数据实时同步。" },
                { icon: "🤖", title: "AI 服务", desc: "AI 功能通过 OpenRouter 调用，支持自定义 API Key。免费额度用完后，在设置中填入你自己的 OpenRouter Key 即可继续使用。" },
                { icon: "🛡", title: "隐私", desc: "日记内容仅在你主动生成反思问题或复盘时发送给 AI 处理，不会被用于训练模型。" },
            ],
            guideTitle: "使用指南",
            guide: [
                ["写今天", "先写日记，保存后 AI 会基于你今天的内容生成一个专属反思问题。回答它，或者跳过。"],
                ["补记功能", "页面顶部可以切换到过去3天内还没写的日期，进行补记。每个日期只能补记一次。"],
                ["今日一问", "每次保存日记后自动生成，基于你的日记内容和性格档案定制，不会让你焦虑，只是帮你多想一步。"],
                ["AI 复盘", "周复盘（≥5天）分析日记。周日可生成「本周」，周一-六可生成「上周」。上月复盘（≥15天）整合周复盘，去年复盘（≥180天）整合月复盘。每周/月/年只能生成一次。档案更新：周+0.1，月+0.3，年+1.0。"],
                ["坚持的秘诀", "不用每天写很多。哪怕三行也算。连续天数是给你看的，不是用来让你焦虑的。"],
            ],
            apiKeyTitle: "API Key 设置",
            apiKeyDesc: "填入你自己的 OpenRouter API Key，使用自定义模型，不受免费额度限制。",
            apiKeyPlaceholder: "sk-or-...",
            apiKeySaving: "保存中…",
            apiKeySave: "保存",
            apiKeySaved: "已保存 ✓",
            apiTitle: "账户 & API 额度",
            apiSub: "（超出后请配置您自己的 OpenRouter API Key）",
            freeUsage: (n) => `免费额度已使用 ${n}/10 次`,
            unlimitedUsage: "测试账号：无限 AI 次数 ✦",
            logout: "退出登录",
        },

        // ── Onboarding ────────────────────────────────────
        onboarding: {
            introTitle: "欢迎来到你的专属日记",
            introBody: "在这里，AI 会根据你的性格给予最懂你的回应。\n7 个小问题，帮它从第一天就真正了解你。",
            introStart: "开始设定 (约2分钟)",
            introSkip: "跳过，让 AI 随时间慢慢懂我",
            nextBtn: "下一题 →",
            prevBtn: "← 上一题",
            prevStep: "← 上一步",
            counterOf: (cur, total) => `${cur} / ${total}`,
            generateBtn: "生成我的档案 ✦",
            generatingTitle: "正在为你侧写专属档案...",
            generatingSubtitle: "请稍候，马上开启你的日记旅程",
            q7Title: "最后，有什么是你希望日记本特别注意的？",
            q7Hint: "比如：不要给我打鸡血、我很容易嫉妒同龄人、请用温柔但直接的语气……（选填）",
            q7Placeholder: "畅所欲言……",
            customPlaceholder: "或者用自己的话说……",
            questions: [
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
            ],
        },
    },

    // ══════════════════════════════════════════════════════
    // ENGLISH
    // ══════════════════════════════════════════════════════
    en: {
        lang: "en",
        langLabel: "English",
        otherLang: "中文",
        voiceLang: "en-US",
        aiLangInstruction: "Please respond in English.",

        langSelect: {
            title: "Choose Your Language",
            subtitle: "选择你的语言",
            zh: "中文",
            en: "English",
        },

        auth: {
            loginTitle: "Welcome Back",
            registerTitle: "Create Account",
            usernamePlaceholder: "Username",
            passwordPlaceholder: "Password",
            loginBtn: "Log In",
            registerBtn: "Sign Up",
            loggingIn: "Logging in…",
            registering: "Creating account…",
            switchToRegister: "No account? Sign up",
            switchToLogin: "Have an account? Log in",
            tagline: "Your private diary — AI that truly gets you",
        },

        nav: {
            write: "Today",
            history: "History",
            summary: "Review",
            settings: "Settings",
        },

        write: {
            todayLabel: (str) => str,
            writeToday: "Today",
            backdateDays: ["Yesterday", "2 days ago"],
            moodLabel: "Today's mood",
            moods: ["Terrible", "Bad", "Okay", "Good", "Great"],
            placeholder: "What happened today…",
            voiceBtn: "🎙 Voice",
            voiceStop: "Stop",
            voiceError: "Speech recognition not supported. Please use Chrome.",
            saving: "Saving…",
            save: "Save Entry",
            saved: "Saved ✓",
            streakDays: (n) => `${n}-day streak`,
            streakZero: "Start your first entry",
            alreadyWrote: "Written today ✓",
            backdateNote: "Backdate mode",
            questionLabel: "Reflection Question",
            questionLoading: "AI is crafting a question for you…",
            questionSkip: "Skip",
            answerPlaceholder: "Write your thoughts…",
            answerSave: "Save Answer",
            lateNudgeTitle: "Haven't written yet today 🌙",
            lateNudgeBody: "Even three lines counts. Your future self will thank you.",
            lateNudgeBtn: "Write now",
            lateNudgeSkip: "Skip today",
        },

        history: {
            title: "Journal History",
            empty: "No entries yet. Go write your first one!",
            deleteConfirm: "Delete this entry?",
            deleteBtn: "Delete",
            questionLabel: "Reflection Question",
            answerLabel: "Your Answer",
        },

        summary: {
            title: "AI Review",
            typeWeek: "Weekly",
            typeMonth: "Monthly",
            typeYear: "Yearly",
            generate: "Generate Review",
            generating: "Generating…",
            placeholder: "Select a time range, then click Generate Review",
            analyzing: "Analyzing your journal…",
            reminderWeek: "It's Monday ☀️",
            reminderWeekSub: "Take a few minutes to review last week",
            reminderMonth: "New Month 🌙",
            reminderMonthSub: "Reflect on last month, welcome the new one",
            reminderYear: "New Year's Day 🎆",
            reminderYearSub: "Time to review the past year",
            reminderDoIt: "Start Review",
            reminderLater: "Later",
            heatmap: "Last 14 days",
            countLabel: (n) => `${n} entries`,
            minRequired: (min) => `Need ${min}`,
            alreadyGenerated: "✓ Done",
        },

        settings: {
            title: "Settings",
            profileTitle: "Personality Profile",
            profileVersion: (v) => `Current version ${v} · Auto-updated after AI reviews`,
            profileDesc: "This is what the AI currently knows about you. After each review, it quietly updates this profile based on your latest entries — tracking your real growth over time.",
            obsTitle: "Recent Observations",
            obsSubtitle: "Appended weekly · Reviewed monthly",
            obsEmpty: "After your first weekly review, the AI will start collecting observations.",
            obsFirstSeen: (n) => n === 0 ? "today" : `${n}d ago`,
            obsLastSeen: (n) => `last confirmed ${n}d ago`,
            obsConfirmed: (n) => `×${n} confirmed`,
            obsFooter: "During monthly reviews, repeated observations are promoted into your core profile. Observations not seen in 60+ days are automatically removed.",
            storageTitle: "Data & Privacy",
            storage: [
                { icon: "🔒", title: "Where is data stored?", desc: "Your journal and profile are stored in a cloud database (Supabase PostgreSQL), tied to your account. Data persists as long as your account exists." },
                { icon: "📱", title: "Cross-device access", desc: "Log in with the same account on any device to access all your entries. Data syncs in real time." },
                { icon: "🤖", title: "AI service", desc: "AI features use OpenRouter. You can add your own API Key in settings. The free quota covers 10 requests; after that, bring your own key." },
                { icon: "🛡", title: "Privacy", desc: "Your journal content is only sent to the AI when you explicitly generate a reflection question or review. It is never used for training." },
            ],
            guideTitle: "How to Use",
            guide: [
                ["Write Today", "Write your entry, save it, and the AI will generate a personalized reflection question based on your content. Answer it or skip."],
                ["Backdate", "Use the date selector at the top to write entries for the past 3 days. Each date can only be filled in once."],
                ["Reflection Question", "Auto-generated after each save. Based on your entry and personality profile — designed to help you think one step deeper, not stress you out."],
                ["AI Review", "Weekly review (≥5 entries), monthly (≥15), yearly (≥180). Each can be generated once per period. Profile updates: weekly +0.1, monthly +0.3, yearly +1.0."],
                ["Consistency tip", "You don't have to write a lot. Even three lines counts. The streak is there to celebrate you, not to pressure you."],
            ],
            apiKeyTitle: "API Key",
            apiKeyDesc: "Add your own OpenRouter API Key to use custom models and bypass the free quota.",
            apiKeyPlaceholder: "sk-or-...",
            apiKeySaving: "Saving…",
            apiKeySave: "Save",
            apiKeySaved: "Saved ✓",
            apiTitle: "Account & Quota",
            apiSub: "(Add your own OpenRouter API Key for unlimited usage)",
            freeUsage: (n) => `Free usage: ${n}/10`,
            unlimitedUsage: "Test Account: Unlimited AI ✦",
            logout: "Log Out",
        },

        onboarding: {
            introTitle: "Welcome to Your Private Diary",
            introBody: "The AI responds in a way that truly fits you.\n7 quick questions help it understand you from day one.",
            introStart: "Get Started (~2 min)",
            introSkip: "Skip — let AI learn about me over time",
            nextBtn: "Next →",
            prevBtn: "← Back",
            prevStep: "← Back",
            counterOf: (cur, total) => `${cur} / ${total}`,
            generateBtn: "Build My Profile ✦",
            generatingTitle: "Building your personal profile…",
            generatingSubtitle: "Just a moment — your diary journey starts now",
            q7Title: "Finally, anything you'd like the AI to keep in mind?",
            q7Hint: "e.g. Don't hype me up too much, I get jealous easily, be direct but warm… (optional)",
            q7Placeholder: "Anything goes…",
            customPlaceholder: "Or type your own answer…",
            questions: [
                {
                    key: "q1", label: "When you face pressure or setbacks, what's your first reaction?",
                    opts: ["Avoid it — phone scrolling, sleeping, distracting myself", "Self-blame — feeling like I'm not good enough", "Push through — I want to fix it immediately", "Talk to someone I trust"]
                },
                {
                    key: "q2", label: "When it comes to following through on plans, which fits you best?",
                    opts: ["Perfectionist procrastinator (waiting until everything is ready)", "Strong starter, poor finisher (lose momentum fast)", "Act first, plan later (high energy, low structure)", "Steady and methodical (slow and reliable)"]
                },
                {
                    key: "q3", label: "How does socializing feel to you?",
                    opts: ["Energizing — being around people charges me up", "Draining — I need alone time to recharge", "Depends — close friends recharge me, strangers drain me", "Neutral — I don't notice much difference"]
                },
                {
                    key: "q4", label: "What's most likely to throw you off emotionally?",
                    opts: ["Criticism or being dismissed", "Things going off-plan (unexpected changes)", "Feeling behind compared to my peers", "Emotional distance or coldness in relationships"]
                },
                {
                    key: "q5", label: "When you fail or get criticized, how do you tend to treat yourself?",
                    opts: ["Harsh self-blame — replaying what went wrong over and over", "Brief pain, then try to reflect and improve", "Move on quickly — I don't like sitting in negative feelings", "Externalize — I tend to blame circumstances"]
                },
                {
                    key: "q6", label: "What tends to ignite your motivation?",
                    opts: ["Seeing others succeed — wanting to catch up", "A quote, video, or something that moves me", "External deadlines or pressure", "Self-set goals and personal rituals"]
                },
            ],
        },
    },
};

// ── Helper: get translation by current lang ───────────
export function getLang() {
    return localStorage.getItem("diary_lang") || null;
}

export function setLang(lang) {
    localStorage.setItem("diary_lang", lang);
}
