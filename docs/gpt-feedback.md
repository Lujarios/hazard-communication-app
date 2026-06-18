# GPT Safety Talk Feedback

Local MVP feature that evaluates a trainee's hazard communication transcript against professor rubrics and a scenario-specific answer key, then returns star-rated scores, missed items, and AI worker persona reactions.

## Prerequisites

1. **Node.js** and project dependencies installed (`npm install`).
2. **PostgreSQL** — required by the T3 env schema (`DATABASE_URL` in `.env`).
3. **OpenAI API key** — required for feedback evaluation.

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/hazard-communication-app"
OPENAI_API_KEY="sk-your-key-here"
```

The OpenAI key is **server-side only** (validated in `src/env.js`). Never commit `.env`.

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional checks before manual testing:

```bash
npm run typecheck
npm run lint
```

## How it works

```mermaid
sequenceDiagram
  participant User
  participant Browser
  participant tRPC
  participant OpenAI

  User->>Browser: Record or type hazard talk
  User->>Browser: Click Get Feedback
  Browser->>tRPC: feedback.evaluate(scenarioId, transcript)
  tRPC->>OpenAI: Prompt + rubric + answer key
  OpenAI-->>tRPC: Structured JSON scores
  tRPC-->>Browser: SafetyTalkFeedback
  Browser->>User: Scorecard + persona reactions
```

1. **Transcript** — Browser speech recognition (or manual typing) in `TranscriptionPanel`. Raw audio is not sent to GPT in this MVP.
2. **Answer key** — `src/lib/scenario-answer-keys.ts` defines expected hazards and controls for `construction-site-demo`.
3. **Rubric** — `src/lib/safety-rubric.ts` encodes criteria from the professor PDFs in `public/safety-reference/`.
4. **Evaluation** — `src/server/openai/evaluate-safety-talk.ts` calls `gpt-4o-mini` with structured JSON output.
5. **API** — `feedback.evaluate` tRPC mutation in `src/server/api/routers/feedback.ts`.
6. **UI** — Scorecard (`FeedbackScorecard`) and persona panel (`PersonaListeners`) on the assessment page.

## Reference materials

Professor safety guides (source for rubric criteria):

| File | Used for |
|------|----------|
| `public/safety-reference/High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf` | Work steps, hazard ID, controls, stop work, emergencies |
| `public/safety-reference/Pre job Scorecard- EEI updated.pdf` | Weighted scorecard statements, crew engagement |
| `public/safety-reference/CSRA Training Safety Guide.pdf` | Communication clarity, engagement, examples |

Demo scenario:

- Image: `public/images/construction-site-demo.png`
- Scenario id: `construction-site-demo`
- Five labeled hazards: unprotected edge, suspended load, unsecured ladder, spilled materials, missing PPE

## Key source files

| Path | Purpose |
|------|---------|
| `src/types/feedback.ts` | Shared feedback types |
| `src/lib/safety-rubric.ts` | Rubric criteria + prompt formatting |
| `src/lib/scenario-answer-keys.ts` | Scenario answer key + prompt formatting |
| `src/server/evaluation/feedback-schema.ts` | Zod schema for GPT response |
| `src/server/evaluation/build-evaluation-prompt.ts` | Prompt assembly |
| `src/server/openai/evaluate-safety-talk.ts` | OpenAI call |
| `src/server/api/routers/feedback.ts` | tRPC mutation |
| `src/components/demo/TranscriptionPanel.tsx` | Record / type + Get Feedback |
| `src/components/demo/FeedbackScorecard.tsx` | Star ratings + missed items |
| `src/components/demo/PersonaListeners.tsx` | Persona reactions |

## Manual verification checklist

Use this before pushing or demoing.

### Setup

- [ ] `.env` contains valid `OPENAI_API_KEY` and `DATABASE_URL`
- [ ] `npm run dev` starts without env validation errors
- [ ] Assessment page loads at `/`

### Scenario and recording

- [ ] Construction site scenario image and hazard labels render
- [ ] **Start Talking** begins recording (or type in the transcript box if speech recognition is unavailable)
- [ ] **Stop** ends recording; transcript remains visible
- [ ] Starting a new recording clears previous scorecard / persona feedback

### Get Feedback — success path

Record or paste a transcript that mentions **some but not all** hazards (e.g. edge and crane load, skip ladder and PPE). Then:

- [ ] **Get Feedback** is disabled while recording
- [ ] **Get Feedback** is disabled when transcript is empty
- [ ] Click **Get Feedback** — button shows “Evaluating…”, scorecard shows loading
- [ ] Persona panel shows “Reviewing your talk…” during the request
- [ ] After ~5–20 seconds, scorecard shows:
  - [ ] Overall star rating and summary
  - [ ] Per-criterion rubric scores (8 criteria) with star ratings
  - [ ] “What was missed” list for omitted hazards/controls
- [ ] Persona panel shows a unique reaction per worker with **Understood** or **Needs clarification**

### Get Feedback — edge cases

- [ ] Transcript under 10 characters → error message in scorecard (validation)
- [ ] Invalid / missing API key → error surfaced in scorecard (not a silent failure)
- [ ] Very strong transcript covering all five hazards and controls → higher scores, fewer missed items

### Regression

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Expected UI behavior (summary)

| State | Scorecard | Persona panel |
|-------|-----------|---------------|
| Initial | Empty placeholder | “Ready to listen” |
| Recording | Previous feedback cleared | “Listening” + animated bars |
| Evaluating | Loading spinner + skeleton | “Reviewing your talk…” |
| Success | Stars, rubric, missed items | Persona quotes + understood badges |
| Error | Red error banner | Returns to “Ready to listen” |

## Out of scope (this MVP)

- AWS S3 audio upload
- Amazon Transcribe batch transcription
- Saving attempts or feedback to the database
- Cognito authentication
- Multiple scenarios beyond `construction-site-demo`

## Troubleshooting

| Issue | Likely cause |
|-------|----------------|
| App fails on startup | Missing or empty `OPENAI_API_KEY` / `DATABASE_URL` in `.env` |
| “Transcript must be at least 10 characters” | Transcript too short before evaluation |
| “No answer key found for scenario” | Wrong `scenarioId` (should be `construction-site-demo`) |
| “Failed to evaluate the safety talk” | OpenAI API error, rate limit, or network issue — check server logs |
| Speech recognition unavailable | Browser does not support Web Speech API — type transcript manually |
| Evaluation missing persona feedback | Server validation requires all five personas — retry; check terminal for tRPC errors |

## Cost note

Each evaluation is one `gpt-4o-mini` chat completion with a large system prompt. Model is configured in `src/server/openai/evaluate-safety-talk.ts`.
