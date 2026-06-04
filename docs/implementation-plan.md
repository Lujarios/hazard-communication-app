# SafeTalk Implementation Plan

## Current Goal

Build a local MVP prototype of the hazard communication assessment flow.

## MVP Flow

1. User opens one workplace scenario.
2. User sees hazards/controls task instructions.
3. User records a spoken explanation in the browser.
4. User can play back the recording locally.
5. App displays a placeholder transcript.
6. App displays three worker personas.
7. App displays a mock scorecard.

## Phase 1: Local Prototype

- Replace default T3 starter page.
- Create scenario card.
- Create audio recorder component.
- Create persona panel.
- Create mock scorecard.
- Use local mock data only.

## Phase 2: Database

- Create Drizzle schema for scenarios, attempts, personas, persona evaluations.
- Seed one scenario and three personas.
- Save mock attempt data.

## Phase 3: AWS Auth

- Add Cognito authentication.
- Protect assessment page.
- Associate attempts with authenticated users.

## Phase 4: Audio Upload

- Create S3 bucket.
- Generate presigned upload URL from server-side route.
- Upload recorded audio to S3.

## Phase 5: Transcription

- Start Amazon Transcribe batch job from uploaded S3 audio.
- Poll for job completion.
- Save transcript to database.

## Phase 6: AI Evaluation

- Send transcript, scenario answer key, and persona definitions to evaluator.
- Return structured persona feedback and final scorecard.
- Save results to database.

## Rule

Do not skip ahead to cloud integration until the local prototype is stable.