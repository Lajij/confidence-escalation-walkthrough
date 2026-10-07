# Escalate only the uncertain decisions: AI Gateway decision fallbacks walkthrough

A Vercel-branded, click-through demo of **AI Gateway confidence-based decision fallbacks** (beta).
Fictional ANZ business telco **Tasman Connect** routes 120,000 AI decisions a day. Jev (`typesafe-ai/jev`) answers first; when
its Choice confidence is below your threshold, AI Gateway reruns the decision on `openai/gpt-6-astra`.

- Live: https://confidence-escalation-walkthrough.vercel.app
- Changelog: https://vercel.com/changelog/confidence-based-decision-fallbacks
- Docs: https://vercel.com/docs/ai-gateway/models-and-providers/decision-fallbacks

**Simulated:** deterministic example data (seeded), illustrative pricing, no API keys, no live model calls.

Steps: 1 The issue · 2 Live decisions (streaming queue, confidence bars, escalations, routing metadata, threshold slider) ·
3 The numbers (fast-only vs frontier-only vs Jev + fallback) · 4 What it takes (the `providerOptions.gateway.models` config).

Also in this repo: `TALK_TRACK.md` (spoken walkthrough) and `LINKEDIN_CAPTION.md`.

```bash
npm install && npm run dev
```
