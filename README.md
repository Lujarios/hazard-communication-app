# SafeTalk — Hazard Communication Assessment

SafeTalk is a web app for practicing **pre-job hazard identification and communication**. A trainee reviews a workplace scenario, delivers a spoken (or typed) safety talk, and receives structured feedback from AI worker personas scored against a safety rubric.

Trainees do **not** need an account. Managers and site admins sign in to build scenarios, share join codes, and review analytics.

## Features

- **Scenario review** — Jobsite image with labeled hazards and an intro explaining the task
- **Spoken safety talk** — Browser speech recognition with a typed-transcript fallback
- **AI worker personas** — Assigned crew members “listen,” rate understandability, and may ask a follow-up
- **Clarification rounds** — After the initial talk, up to two short follow-up replies (three submissions total)
- **Rubric scorecard** — Star ratings, missed hazards/controls, and a written summary
- **Completion page** — Strengths and improvements after the run finishes
- **In-app tutorial** — Intro slides plus a spotlight tour of the assessment page
- **Join codes** — Managers share a 6-character code instead of a raw scenario URL
- **Scenario builder** — Create/edit scenarios, hazards, overlay positions, images, and personas
- **Custom personas** — Org-specific worker profiles in addition to the built-in catalog
- **Analytics** — Org-scoped results for managers; platform-wide views for site admins
- **Auth** — Local email/password for development; Amazon Cognito is wired for production login

**Not in this build yet:** S3 audio storage and Amazon Transcribe. Evaluation uses the transcript text (speech-to-text in the browser, or typed input), not uploaded audio files.

## How an assessment works

1. Open a scenario from the home page sample, a join code (`/join` or `/join/ABC123`), or a direct `/assessment/[scenarioId]` URL.
2. Review the jobsite image and instructions.
3. Record or type the initial safety talk and submit it.
4. The server evaluates the transcript with OpenAI against the scenario answer key, rubric, and assigned personas.
5. If workers still have questions, the trainee can answer (clarification 1, then optionally 2) or finish early.
6. The completion page summarizes scores and what improved across rounds.

Runs are stored as an **assessment run** with one row per speech stage. Trainees are identified only by an anonymous ID in `localStorage` (no name or email).

## Roles

| Role | Who | What they can do |
| --- | --- | --- |
| Trainee | Anyone with a link or join code | Take assessments; no login |
| Manager | Org-scoped staff | Create/edit that org’s scenarios, personas, join codes, and analytics |
| Site admin (`admin`) | Platform operator | Manage organizations and users; see all analytics |

Admin routes under `/admin` require login. `/admin/site/**` is site-admin only.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **tRPC** for type-safe API calls (`src/server/api`)
- **Drizzle ORM** + **PostgreSQL**
- **Auth.js (NextAuth v5)** with optional **Amazon Cognito**
- **OpenAI** (`gpt-4o-mini`) for evaluation
- **Tailwind CSS** + shadcn/ui primitives in `src/components/ui`

The `~` import alias maps to `src/` (see `tsconfig.json`).

---

## Main components

Start here if you are new to the codebase. File-level comments in these modules match the summaries below.

### Pages (`src/app`)

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` → `HomePage` | Landing page; seeds the demo scenario on first load |
| `/assessment/[scenarioId]` | `src/app/assessment/[scenarioId]/page.tsx` | Loads a scenario and renders the assessment UI |
| `/assessment/[scenarioId]/complete` | `.../complete/page.tsx` | Post-run summary |
| `/join`, `/join/[code]` | `src/app/join/` | Resolve a share code and redirect into the assessment |
| `/login` | `src/app/login/page.tsx` | Manager / site-admin sign-in |
| `/admin/scenarios` | `src/app/admin/scenarios/` | List, create, and edit scenarios |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Org analytics |
| `/admin/site/**` | `src/app/admin/site/` | Organizations, users, platform analytics |

### Assessment UI (`src/components/demo`)

`AssessmentExperience` is the orchestrator. It owns run state, recording, dialogs, tutorial, and tRPC calls. The other files are presentational pieces of that page.

| Component | What it does |
| --- | --- |
| `AssessmentExperience.tsx` | Wires the full trainee flow: intro → talk → evaluation → follow-ups → complete |
| `ScenarioViewer.tsx` | Jobsite image and hazard overlay labels |
| `ScenarioIntroModal.tsx` | First-visit instructions for the scenario |
| `TranscriptionPanel.tsx` | Start/stop recording, live transcript, submit |
| `TalkTipsChecklist.tsx` | Optional checklist of what a good talk should cover |
| `PersonaListeners.tsx` | Worker cards; listening state, scores, and follow-up questions |
| `WorkerQuestionsDialog.tsx` | Modal when one or two personas ask a clarification |
| `ClarificationOutcomeDialog.tsx` | After a follow-up: who understood vs who still needs help |
| `FinishAssessmentDialog.tsx` | Confirm leaving before the max number of rounds |
| `FeedbackScorecard.tsx` | Rubric stars, summary, missed items |
| `FeedbackPreview.tsx` | Thin wrapper that shows the scorecard |
| `AssessmentProgress.tsx` | Step indicator (initial / clarification / complete) |
| `AssessmentComplete.tsx` | Completion-page content (strengths, improvements, scores) |
| `AppHeader.tsx` | Shared header (home, help, admin links, auth menu) |

Speech input lives in `src/hooks/use-speech-recognition.ts` (Web Speech API). Anonymous trainee IDs: `src/lib/anonymous-participant.ts`. The current run id is cached in `src/lib/assessment-run-storage.ts`.

### Tutorial (`src/components/tutorial`)

| Component | What it does |
| --- | --- |
| `TutorialProvider.tsx` | Open/close and step state for the tour |
| `TutorialIntroModal.tsx` | Welcome slides |
| `TutorialSpotlight.tsx` | Highlights `data-tour` regions on the assessment page |

Copy for the tour is in `src/lib/tutorial-steps.ts`.

### Admin UI (`src/components/admin`)

| Component | What it does |
| --- | --- |
| `ScenarioList.tsx` | Org’s scenarios with edit / open links |
| `ScenarioBuilderForm.tsx` | Create or update a scenario (title, image, hazards, personas) |
| `HazardEntryEditor.tsx` | One hazard + control row, including overlay position |
| `ImageFilenameField.tsx` | Upload or pick a filename under `public/scenarios/` |
| `PersonaSelector.tsx` | Choose built-in and custom personas for a scenario |
| `CreatePersonaForm.tsx` | Define a custom worker (role, literacy, experience, …) |
| `ScenarioShareLink.tsx` | Generate / copy / rotate a join code |
| `ScenarioAnalytics.tsx` | Charts and tables for one org’s attempts |
| `SiteOrgManager.tsx` | Create and rename organizations |
| `SiteUserManager.tsx` | Create managers and site admins |

### Server API (`src/server/api`)

Routers are registered in `src/server/api/root.ts`. Procedures are public, login-protected, or site-admin-only (`src/server/api/trpc.ts`).

| Router | Role |
| --- | --- |
| `assessment-run.ts` | Start/resume a run, submit a speech stage, complete the run |
| `feedback.ts` | Legacy single-shot evaluate (still persists a one-stage run) |
| `scenario.ts` | Public get-by-id; protected create/update/list |
| `assessment-session.ts` | Join codes (create, resolve, rotate) |
| `analytics.ts` | Org and (for site admin) platform aggregates |
| `site-admin.ts` | Organizations and users |

### Evaluation (`src/server/evaluation` + `src/server/openai`)

1. `load-evaluation-context.ts` loads the scenario, hazards, and personas from the database.
2. `build-evaluation-prompt.ts` assembles the rubric, answer key, personas, and transcript.
3. `evaluate-safety-talk.ts` calls OpenAI with a structured JSON schema.
4. `select-follow-up-questions.ts` picks up to two concrete worker questions to show.
5. `persist-persona-evaluations.ts` writes per-persona scores for analytics.

Rubric text: `src/lib/safety-rubric.ts` (from PDFs in `public/safety-reference/`). Fallback demo answer key: `src/lib/scenario-answer-keys.ts`. Database scenarios are turned into answer keys by `src/server/scenarios/build-answer-key.ts`.

### Run state helpers (`src/lib`)

| File | Role |
| --- | --- |
| `assessment-run-state.ts` | Allowed statuses, when the trainee can submit/finish, cumulative transcript |
| `assessment-progression.ts` | Score deltas and completion summary between stages |
| `assessment-routes.ts` | URL builders for assessment and complete pages |
| `assessment-scenario.ts` | Map a DB scenario to the client `AssessmentScenario` type |

### Data model (`src/server/db/schema.ts`)

Tables are prefixed `hazard-communication-app_`. The important ones:

- **organizations / users** — tenants and managers (Auth.js user table plus `role` and `organizationId`)
- **scenarios / scenario_hazards / scenario_personas** — content and answer-key source
- **personas** — built-in catalog (`isCustom = false`) or org-owned custom workers
- **assessment_sessions** — join codes
- **assessment_runs** — one trainee conversation (`awaiting_initial` → `processing` → `followup_available` / `ready_to_complete` → `completed`)
- **assessment_attempts** — one evaluated speech stage inside a run
- **assessment_attempt_persona_evaluations** — per-persona snapshot used by analytics

Seed helpers (`src/server/db/seed-*.ts`) create local orgs, demo users, built-in personas, and the construction-site demo. They run automatically when the home page or scenario list loads.

### Shared types (`src/types`)

`feedback.ts`, `assessment.ts`, `assessment-run.ts`, `persona.ts`, `scenario.ts`, and `tutorial.ts` are the contracts between UI and API. Change these when you change request/response shapes.

---

## Setup

### Prerequisites

- **Node.js 20+** and **npm** (this repo uses npm; see `packageManager` in `package.json`)
- **PostgreSQL 14+** running locally or on a host you can reach
- An **OpenAI API key** with access to `gpt-4o-mini`
- Chrome or Edge recommended for speech recognition (Firefox has limited Web Speech support)

### 1. Clone and install

```bash
git clone <this-repo-url>
cd hazard-communication-app
npm install
```

### 2. Environment variables

Copy the example file and fill in real values. The schema in `src/env.js` validates these at startup (and at `next build`). Empty strings are treated as unset.

```bash
cp .env.example .env
```

On Windows (PowerShell): `Copy-Item .env.example .env`

| Variable | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `OPENAI_API_KEY` | Yes | Safety-talk evaluation (server only; never expose to the client) |
| `AUTH_SECRET` | Yes | Auth.js session signing. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Production | Public origin of the app, e.g. `https://safetalk.example.com`. Local default is `http://localhost:3000` |
| `AUTH_COGNITO_ID` | Optional | Cognito app client ID |
| `AUTH_COGNITO_SECRET` | Optional | Cognito app client secret |
| `AUTH_COGNITO_ISSUER` | Optional | `https://cognito-idp.<region>.amazonaws.com/<userPoolId>` |
| `AUTH_DEV_LOGIN` | Optional | `"true"` / `"false"`. Email/password against seeded users. **On by default in development**; leave unset or `"false"` in production |
| `SKIP_ENV_VALIDATION` | Optional | Set to any value to skip Zod env checks (useful in some CI/image builds) |
| `AUTH_TRUST_HOST` | Optional | Set `true` if Auth.js sits behind a reverse proxy / load balancer |

Cognito is **all or nothing**: if you set one of `AUTH_COGNITO_ID`, `AUTH_COGNITO_SECRET`, or `AUTH_COGNITO_ISSUER`, set all three. Leave them blank for local credentials login.

Do not commit `.env`. `.env.example` is the template for others.

### 3. Database

Create an empty database, then apply migrations from `drizzle/`:

```bash
# example: createdb hazard-communication-app
npm run db:migrate
```

If this database was previously created with `npm run db:push` and migrate fails, use the additive fixer instead:

```bash
npm run db:fix-schema
```

Inspect tables with `npm run db:studio`. After you change `src/server/db/schema.ts`, generate a new SQL migration with `npm run db:generate`, then migrate.

Demo orgs, users, personas, and the construction scenario are inserted on first visit to `/` (idempotent). You do not need a separate seed command.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run typecheck
npm run lint
npm test
```

Production-style local run: `npm run preview` (build + `next start`).

### Local login (development)

With `AUTH_DEV_LOGIN` enabled (the default in `development`), use:

| Email | Password | Role |
| --- | --- | --- |
| `admin@acme.local` | `Password123!` | Site admin |
| `manager@acme.local` | `Password123!` | Manager (Acme Construction) |
| `manager@beacon.local` | `Password123!` | Manager (Beacon Safety Co) |

Password is defined in `src/lib/auth-constants.ts` and is for **local use only**.

### Scenario images

Assessment images are files under `public/scenarios/` (and the demo also uses `public/images/`). The admin upload route writes into `public/scenarios/` on the **local disk of the Node process**. That works for a single long-lived server; it does not survive ephemeral/serverless filesystems. Plan on persistent disk or object storage before scaling out.

---

## Hosting checklist (AWS-oriented)

This is what needs to be in working order so the app can run in AWS (or any Node host). It is not a step-by-step deploy guide.

1. **Node host** that can run `npm run build` and `npm run start` (or equivalent). Next.js needs a Node server, not a static-only bucket.
2. **PostgreSQL** reachable from that host (typically RDS). Put the URL in `DATABASE_URL`. RDS often needs `?sslmode=require` on the connection string.
3. **Run migrations** against that database (`npm run db:migrate` or `db:fix-schema`) **before** serving traffic.
4. **Set every required env var** on the host: `DATABASE_URL`, `OPENAI_API_KEY`, `AUTH_SECRET`, and `AUTH_URL` (the public HTTPS origin). Keep secrets in the host’s secret store / env config, not in the repo.
5. **Auth for production**
   - Generate a strong `AUTH_SECRET`.
   - Set `AUTH_DEV_LOGIN=false` (do not ship seeded passwords).
   - Configure a Cognito user pool + app client, then set the three `AUTH_COGNITO_*` variables. The app client must allow scopes `openid` and `email`, and the callback URL must match Auth.js (`{AUTH_URL}/api/auth/callback/cognito`).
   - If the app sits behind a load balancer, set `AUTH_TRUST_HOST=true`.
6. **OpenAI** — the evaluation path calls OpenAI from the **server**. The host needs outbound HTTPS to OpenAI; the browser never sees the key.
7. **Build-time env** — `src/env.js` is imported from `next.config.js`, so `DATABASE_URL`, `OPENAI_API_KEY`, and `AUTH_SECRET` must be present at **build** as well as runtime (or set `SKIP_ENV_VALIDATION` for the image build and inject real values at runtime).
8. **Images** — uploads currently go to `public/scenarios/` on disk. Use a host with persistent storage, or treat image upload as local-only until S3 is added.
9. **First request** — visiting `/` still seeds the built-in demo scenario and personas if they are missing. That is safe to leave on; it will not duplicate rows.

Planned cloud pieces that this repo does **not** require yet: S3 for audio, Amazon Transcribe, Bedrock. Evaluation is OpenAI-only today.

---

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` / `npm run start` | Production build and server |
| `npm run preview` | Build then start |
| `npm run db:generate` | Create a Drizzle SQL migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration file (local experiments) |
| `npm run db:fix-schema` | Additive SQL for databases originally created with `db:push` |
| `npm run db:studio` | Drizzle Studio |
| `npm run check` | Lint + `tsc --noEmit` |
| `npm test` | Vitest via `scripts/run-tests.mjs` |