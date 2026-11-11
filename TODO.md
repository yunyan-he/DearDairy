# DearDairy TODO

## Prototype presentation

- [x] Create a backend-free interactive `/demo` with fictional journal entries, Persona, recent observations, evidence, and confirm/edit/reject interactions.
- [ ] Refine the visual design after reviewing the first demo direction. This is presentation work, not a restart of product development.
- [ ] Add a clear public entry point to the demo when the preferred deployment URL is decided.

## Visual migration of the original application

- [x] Replace the language-choice modal with English `/` and Chinese `/cn` entry points; keep `/en` and `/zh` as compatibility redirects.
- [x] Provide the complete fictional demo in English at `/demo` and Chinese at `/cn/demo`.
- [x] Make the public homepage lead with the no-account demo; move private login and registration to secondary actions.
- [x] Add real local-journal routes at `/journal` and `/cn/journal` using the same interface as the demo.
- [x] Persist local entries in the current browser without Supabase or an account.
- [x] Add local AI provider, Base URL, model, and session-only API Key settings.
- [ ] Implement the stateless AI forwarding proxy; do not store keys or journal text server-side.
- [ ] Add local backup export, import, and delete-all controls.
- [x] Restyle the login and registration page using the demo's visual system.
- [x] Let new users write immediately instead of forcing the Persona questionnaire.
- [ ] Migrate the real writing page.
- [ ] Migrate journal history and entry reading.
- [ ] Migrate weekly, monthly, and yearly reviews.
- [ ] Migrate observations and Persona; keep the initial questionnaire optional here.
- [ ] Migrate settings and complete all remaining English copy.

## Archived product research — not planned work

DearDairy will not continue as a commercial or large-scale product-development effort. The material below is retained as historical research thinking, not as a condition for restarting development.

### Current hypothesis

The potential differentiation is not “AI remembers you.” It is that AI observations remain hypotheses until the user confirms, edits, or rejects them, and only confirmed recurring observations may enter the long-term Persona.

## Competitive research: diary and reflection products still operating

Research the products below from their current official product pages and by using the products where possible. Record the review date because availability, pricing, and AI features can change.

- [ ] **Day One** — baseline for mature cross-platform journaling, capture, history, privacy, and its newer Daily Chat, Go Deeper, and multi-entry AI summaries. Sources: [core features](https://dayoneapp.com/features/), [AI features](https://dayoneapp.com/guides/ai-features/ai-features/).
- [ ] **Apple Journal** — baseline for a zero-install ecosystem product, low-friction suggestions, media and activity context, and on-device privacy. Source: [Apple Journal user guide](https://support.apple.com/guide/iphone/write-in-your-journal-iph9824e83ce/ios).
- [ ] **stoic.** — compare guided reflection, mood tracking, mental-wellbeing positioning, AI mentors, personalized prompts, and on-device/Foundation Model features. Sources: [features](https://www.getstoic.com/features), [AI journal](https://www.getstoic.com/).
- [ ] **Rosebud** — investigate conversational AI journaling, long-term pattern recognition, goals, weekly reports, and how it communicates trust and psychological safety. Sources: [long-term memory](https://help.rosebud.app/ai-analysis/long-term-memory), [usage limits](https://help.rosebud.app/ai-analysis/usage-limits).
- [ ] **Reflectly** — verify its current availability and product direction before treating it as an active competitor; compare guided check-ins, mood tracking, prompts, and habit mechanics.
- [ ] **Daylio** — compare the opposite interaction model: extremely low-friction mood/activity logging with trends, without requiring long-form writing. Source: [official product site](https://daylio.net/).
- [ ] **Journey** — compare cross-platform availability, timeline/calendar, media capture, coaching/templates, export, and pricing. Source: [official product overview](https://support.journey.cloud/en/categories/journey-basics/articles/what-is-journey).
- [ ] **ChatGPT as the substitute** — test journaling through ordinary chat, voice, projects, and memory. This is the main substitute even though it is not marketed as a diary.

### Comparison questions

For every product, capture evidence for:

- [ ] What value does a new user receive in the first session?
- [ ] What requires seven days, one month, or longer before becoming useful?
- [ ] Is input a blank page, structured check-in, passive context, or conversation?
- [ ] How much work must the user do each day?
- [ ] Does AI summarize one entry, multiple entries, or a longitudinal history?
- [ ] Can the user inspect, correct, reject, or delete an AI interpretation?
- [ ] Does the product distinguish raw evidence from AI inference?
- [ ] What becomes persistent memory, and who controls that decision?
- [ ] How are privacy, export, deletion, and AI-provider data flows explained?
- [ ] What is free, what is paid, and which feature creates the upgrade moment?
- [ ] What is the clearest reason to use it instead of ChatGPT or a notes app?

### User validation before further engineering

- [ ] Show 5–8 regular journal or ChatGPT users two observation candidates generated from their own voluntary sample entries.
- [ ] Let them confirm, edit, or reject each candidate; do not explain which response is preferred.
- [ ] Ask whether the control changes their trust compared with ordinary AI memory.
- [ ] Invite them back one week later without building reminders or gamification.
- [ ] Continue only if at least 3 of 5 users actively engage with the judgments and at least 2 voluntarily return.

## Archived engineering ideas — not planned work

- [ ] Add a monthly “proposed Persona changes” review so the user can approve the final wording before it changes the Persona.
- [ ] Show the diary or review evidence behind each observation candidate.
- [ ] Let users revisit rejected observations without treating them as active facts.
- [ ] Move review orchestration and authorization-sensitive rules from the React client into the backend.
- [ ] Add API and UI tests for pending, confirmed, edited, rejected, promoted, and expired observations.
