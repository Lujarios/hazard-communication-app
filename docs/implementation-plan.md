# SafeTalk Implementation Plan

## Current Goal

Build a local MVP prototype of the hazard communication assessment flow.

## MVP Flow

1. User opens one workplace scenario.
2. User sees hazards on the scenario image.
3. User records a spoken explanation in the browser (or types a transcript).
4. App displays a live transcript.
5. User requests AI feedback on the hazard talk.
6. App displays five AI worker persona reactions.
7. App displays a star-rated scorecard with missed items.

## Phase 1: Local Prototype — Done

- [x] Replace default T3 starter page.
- [x] Create scenario card.
- [x] Create audio / speech transcription component.
- [x] Create persona panel.
- [x] Create scorecard UI.
- [x] Use local mock data for scenario and personas.

## Phase 2: Database — Not started

- Create Drizzle schema for scenarios, attempts, personas, persona evaluations.
- Seed one scenario and personas.
- Save attempt data.

## Phase 3: AWS Auth — In progress (managers only)

- [x] Auth.js (NextAuth v5) + Cognito provider + Drizzle adapter.
- [x] Organizations + users; scenarios scoped to organizations.
- [x] Protect `/admin/**` and scenario create/update (assessment stays public).
- [x] Local/dev Credentials login with seeded manager users.
- [ ] Associate assessment attempts with authenticated users (not needed for public assessments).
- [ ] Production Cognito User Pool hardening (no Credentials provider).

## Phase 4: Audio Upload — Not started

- Create S3 bucket.
- Generate presigned upload URL from server-side route.
- Upload recorded audio to S3.

## Phase 5: Transcription — Not started

- Start Amazon Transcribe batch job from uploaded S3 audio.
- Poll for job completion.
- Save transcript to database.

## Phase 6: AI Evaluation — Partial (local, no DB)

- [x] Send transcript, scenario answer key, and persona definitions to OpenAI evaluator.
- [x] Return structured persona feedback and star-rated scorecard.
- [x] Display results on the assessment page via tRPC.
- [ ] Save evaluation results to database.

See **`docs/gpt-feedback.md`** for setup, architecture, and manual test steps.

Sample transcripts for copy-paste testing: **`docs/test-transcripts.md`** (strong / okay / poor).

## Rule

Do not skip ahead to cloud integration until the local prototype is stable.
