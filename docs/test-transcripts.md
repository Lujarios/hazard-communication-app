# Sample Hazard Talk Transcripts

Copy any block below into the **Live Transcription** text box on the assessment page, then click **Get Feedback**.

Use these to sanity-check that scores and missed items move in the right direction. GPT may vary slightly run to run, but the **relative** ranking should hold: perfect > okay > poor.

---

## How to use

1. Run `npm run dev` and open the assessment page.
2. **Do not** start recording — paste a transcript directly into the text box.
3. Click **Get Feedback**.
4. Compare results to the **Expected results** section for that sample.

---

## Sample 1 — Strong (expect high scores)

**Expected:** Overall ~4–5 stars. Most or all rubric criteria score well. Few or no missed items. Most personas **Understood**.

```
Before we start on the commercial building today, let's walk through the work and the hazards we can see from right here. Our main tasks are structural work on the upper levels, crane picks for pipe bundles, ladder access to elevation, and ground-level staging. Everyone stays out of the crane swing and lift path, and watch for other crews and equipment sharing the work zone.

First, the life-threatening hazards. There is an unprotected edge on the upper floor with no guardrails yet. Nobody goes near that edge until guardrails or approved fall protection is in place. Keep back from the edge and use a controlled access zone until protection is installed.

The crane is lifting a bundle of pipes right now—that is a suspended load over the site. We never walk under a suspended load. Stay out of the exclusion zone under the lift path. Use tag lines to control swing, and only the signal person and riggers in the zone handle the load. Confirm rigging and the lift plan before we continue.

We also have an unsecured ladder against the building. Before anyone climbs, secure it at the top or base, check the four-to-one angle, inspect the ladder, and maintain three points of contact. Do not carry materials while climbing.

On the ground, spilled material and debris are a slip and trip hazard. Clean it up now, keep walkways clear, and mark any wet areas. Stage materials in designated areas and keep housekeeping tight.

I also see a worker without a hard hat. Hard hats and hi-vis are mandatory on this site—get proper PPE before entering the work area. Supervisor, verify PPE before we start.

If the lift plan changes, weather shifts, or anyone sees a new hazard, stop work and re-brief the crew. For emergencies, know your role and follow site emergency procedures.

Does everyone understand the edge work, lift zone, ladder rules, housekeeping, and PPE? What hazards or controls did I miss?
```

### What this sample covers

| Hazard / topic | Covered? |
|----------------|----------|
| Unprotected edge + fall controls | Yes |
| Suspended load + exclusion zone / tag lines / signal person | Yes |
| Unsecured ladder + tie-off / 4:1 / inspection | Yes |
| Spilled materials / trip hazard + cleanup | Yes |
| Missing PPE / hard hat enforcement | Yes |
| Work steps and scope | Yes |
| Environmental / surrounding hazards | Yes |
| Stop work + emergency mention | Yes |
| Crew engagement / verification questions | Yes |

---

## Sample 2 — Okay (expect mid scores, some missed items)

**Expected:** Overall ~2–4 stars. Hazard identification and controls partially scored. Missed items for ladder, PPE, and/or stop-work. Some personas **Needs clarification**.

```
Alright team, quick safety talk before we get going on the building. Today we're doing work on the upper floors and moving materials with the crane.

The big one I want to talk about is the open edge up on the top floor. There's no guardrail there yet, so stay away from the edge until we get protection up. That's a serious fall hazard.

The crane is picking pipes right now. Don't walk under the load and stay clear while they're hoisting.

There's also a mess on the ground with spilled stuff and debris. Watch your step and try to keep paths clear.

If you see something unsafe, speak up. Everyone good?
```

### What this sample intentionally omits

| Hazard / topic | Covered? |
|----------------|----------|
| Unprotected edge | Partial (named, light on specific controls) |
| Suspended load | Partial (no tag lines, signal person, or exclusion zone detail) |
| Unsecured ladder | **Missing** |
| Spilled materials | Partial (no cleanup / signage) |
| Missing PPE | **Missing** |
| Work steps | Vague |
| Environmental hazards | **Missing** |
| Stop work authority | **Missing** |
| Emergency procedures | **Missing** |
| Strong crew verification | Weak |

---

## Sample 3 — Poor (expect low scores, many missed items)

**Expected:** Overall ~1–2 stars. Low hazard identification and control scores. Long missed-items list. Most personas **Needs clarification**.

```
Okay everyone, let's be safe today. Watch out for hazards on site and make sure you have your gear. The crane is working and there's stuff going on upstairs, so pay attention and be careful. Don't do anything dangerous. Let me know if you have questions.
```

### What this sample intentionally omits

| Hazard / topic | Covered? |
|----------------|----------|
| All five scenario hazards | **Not specifically identified** |
| Controls for any hazard | **Missing** (only generic "be careful") |
| Life-threatening emphasis | **Missing** |
| Work steps | **Missing** |
| PPE specifics | Generic "gear" only |
| Stop work / emergency | **Missing** |
| Engagement | Minimal |

---

## Quick comparison

| Sample | Expected overall | Missed items | Personas |
|--------|------------------|--------------|----------|
| 1 — Strong | High (4–5★) | Few or none | Mostly understood |
| 2 — Okay | Medium (2–4★) | Several gaps | Mixed |
| 3 — Poor | Low (1–2★) | Many gaps | Mostly needs clarification |

---

## Tips

- **Minimum length:** Transcripts must be at least **10 characters** or the API will reject them (Sample 3 is still long enough).
- **Order of testing:** Run poor → okay → strong so you can see scores improve clearly.
- **New recording clears feedback:** If you paste a new sample after getting feedback, you do not need to click Start Talking — just replace the text and click **Get Feedback** again. Starting a new recording will reset the scorecard.
- **Speech vs paste:** These samples are written for paste testing. You can also read them aloud using **Start Talking** if you prefer.

See also: `docs/gpt-feedback.md` for full setup and checklist.
