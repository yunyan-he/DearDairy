# DearDairy 🌙

> A web prototype exploring AI journaling, longitudinal personality observations, and self-understanding.

**Project status: active development has ended.** DearDairy is not intended for commercialization or large-scale adoption. The web prototype is a vessel for making my idea of an ideal journal—especially in the age of AI—concrete.

**[中文版 README →](./README.zh-CN.md)**

## The question behind the project

DearDairy was not primarily an attempt to put a diary on the web. It explored a more specific question:

> Can AI identify recurring patterns across a person's long-term journal and help maintain an evolving personality description that the person controls?

People want not only to express themselves, but also to feel understood and interpreted. A traditional journal preserves expression without responding. An ordinary AI conversation can respond immediately, but may not reveal how someone changes over months or years. DearDairy explored the space between the two.

## Core concept

```text
Onboarding questionnaire → Initial Persona
Long-term journaling → AI proposes observations
User confirms, edits, or rejects them
Recurring, confirmed observations → Long-term Persona
```

The central principle is: **journal entries are evidence; AI interpretations are hypotheses.** The system should not define a person without their consent. Only observations confirmed by the user may enter the long-term Persona.

Reflection prompts should also be gentle, specific, and optional. Their purpose is to invite attention to an emotion, motivation, or tension—not to create guilt through streaks, completion scores, or productivity language.

## About the prototype

The prototype uses React, FastAPI, PostgreSQL, and an OpenAI-compatible model API. It includes experimental journaling, reflection prompts, periodic reviews, versioned Personas, and user-governed observation review.

The web was the easiest medium in which to build the idea, not necessarily the right medium for journaling. I do not expect a journal website to have a clear path to profitability or large-scale use: compared with a mobile app, a notes app, or simply talking to AI, it introduces additional friction. I therefore do not see this format as something to develop aggressively. Its purpose is to embody and test an idea about journaling in the age of AI.

For the full reflection, see the [Chinese product reflection and closing note](./PRODUCT_REFLECTION_2026-11-10.md).

## Viewing locally

The backend-free interactive showcase is available in English at `/demo` and Chinese at `/cn/demo`, with fictional entries, a Persona, recent observations, and the observation-review flow. The real application is available in English at `/` and Chinese at `/cn`.

The Supabase-free local journal is available at `/journal` in English and `/cn/journal` in Chinese. Entries stay in the current browser. Users may provide a session-only API key and generate a reflection through a stateless Vercel function; DearDairy does not persist the key, request, or response in a database. DeepSeek, OpenAI, Groq, and OpenRouter endpoints are supported.

See [DEPLOYMENT.md](./DEPLOYMENT.md) to run the project locally. This is an archived project, so the original application's configuration and dependencies may require adjustment.
