# DearDairy 🌙

> An AI journal concept about long-term self-understanding: journal entries are evidence, AI interpretations are hypotheses, and the person keeps the final say.

**Project status: concept preserved; active product development has ended.** DearDairy is not intended for commercialization or large-scale adoption. The website is a finished, interactive expression of what I would want an AI journal to become.

**[中文版 README →](./README.zh-CN.md)**

## Try it

### Portfolio demo — no account, no setup

- **[English demo](https://deardairy-phi.vercel.app/demo)**
- **[中文 Demo](https://deardairy-phi.vercel.app/cn/demo)**

The demo contains 20 fictional journal entries, dynamically aligned with the visitor's current date. It demonstrates daily writing, weekly and monthly reviews, recent observations, an evolving Persona, and the confirm/edit/reject flow. Its content is fixed, but the interface is interactive.

### Use it as a private local journal

- **[English local journal](https://deardairy-phi.vercel.app/journal)**
- **[中文本地日记](https://deardairy-phi.vercel.app/cn/journal)**

No account or database is required. Entries stay in the current browser. An optional session-only API key can connect DeepSeek, OpenAI, Groq, or OpenRouter and generate a reflection from up to 12 recent entries.

“Local” here means browser-local storage: clearing browser data or switching browsers/devices will not carry entries across. Backup export and import are still future usability work.

## The idea I wanted to preserve

DearDairy was never primarily about putting a diary on a website. It explored a more specific question:

> Can AI recognize recurring patterns across a person's long-term journal and help maintain an evolving description of who they are—without taking ownership of that description away from them?

People want not only to express themselves, but also to feel understood, read, and interpreted. A traditional journal preserves expression without responding. An ordinary AI conversation can respond immediately, but may not reveal how someone changes over months or years. DearDairy explores the space between the two.

## How the Persona should grow

```text
Optional onboarding → an initial Persona
Long-term journaling → AI proposes recent observations
The user confirms, edits, or rejects each observation
Recurring and confirmed observations → a changing long-term Persona
```

The central principle is:

> **Journal entries are evidence. AI interpretations are hypotheses.**

The system should distinguish between raw writing, recent observations, recurring-pattern candidates, and user-confirmed Persona statements. AI may help a person notice something, but it should not silently convert an interpretation into a fact about them.

The user therefore needs to be able to:

- inspect which entries support an observation;
- confirm that it fits;
- edit the wording until it feels accurate;
- reject it without consequence;
- allow only confirmed, recurring observations into the long-term Persona.

## Reflection without self-punishment

The journal may ask one gentle question after an entry, but it should never turn reflection into performance management. It should not shame someone for an unproductive day, optimize streaks at the expense of honesty, or force a positive conclusion.

A useful prompt should be specific to what was written, leave room not to answer, and help the person notice an emotion, motivation, contradiction, or recurring pattern. When someone is already struggling, the system should make space before asking them to analyze themselves further.

## Why this will remain a prototype

The web was the easiest medium in which to build the idea, not necessarily the right medium for journaling. Compared with a mobile app, a notes app, or simply talking to AI, a journal website introduces extra friction into a habit that already depends on consistency.

I also do not see a clear path to profitability or large-scale use for this form. Continuing to add features would not solve that underlying mismatch. The value of DearDairy is therefore not a claim that this website should become a business. It is the product idea it makes tangible: longitudinal AI interpretation that remains explainable, revisable, and governed by the person being described.

Stopping development is not a rejection of that idea. It is a decision to separate a viewpoint worth preserving from a website that would otherwise require indefinite maintenance.

For the longer Chinese reflection, see [Product reflection and closing note](./PRODUCT_REFLECTION_2026-11-10.md).

## Privacy and current architecture

The public demo is fictional and requires no backend data. The private-journal mode uses browser storage rather than Supabase or another user database.

If the user enables AI:

- the API key is stored only in the current browser session;
- selected journal text is sent only when the user requests a reflection;
- a stateless Vercel Function forwards the request to the selected provider;
- DearDairy does not persist the key, request, or response in a database;
- supported API hosts are explicitly restricted rather than accepting arbitrary proxy destinations.

The current presentation is built with React and Vite and deployed on Vercel. The repository also retains the earlier FastAPI/PostgreSQL account-based prototype as historical implementation material; the published local-journal experience does not depend on it.

## Run the source locally

```bash
cd frontend
npm install
npm run dev
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the older full-stack setup. Because active development has ended, those legacy backend instructions may require adjustment.

## What remains

The main remaining task is not feature expansion. It is to use the private journal for a while and compare the real experience with the demo: whether the prompts remain gentle, whether reviews feel grounded in actual entries, and whether observations and Persona updates preserve meaningful user control.

See [TODO.md](./TODO.md) for that validation list and archived research notes.
