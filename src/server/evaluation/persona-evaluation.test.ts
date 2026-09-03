import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { formatPersonaForEvaluationPrompt } from "~/server/evaluation/persona-interpretation";
import { buildEvaluationPrompt } from "~/server/evaluation/build-evaluation-prompt";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";
import type { ScenarioAnswerKey } from "~/lib/scenario-answer-keys";

const newHire: EvaluationPersona = {
  id: "new-hire",
  name: "New Hire",
  description: "Recently joined the crew.",
  evaluationInstructions: "Need plain language and step-by-step instructions.",
  experienceLevel: "entry",
  jobRole: "labourer",
  jobRoleOther: null,
  englishLiteracy: "professional",
  projectExperience: "limited",
};

const limitedEnglish: EvaluationPersona = {
  id: "limited-english",
  name: "Limited English Worker",
  description: "Spanish is the first language.",
  evaluationInstructions: "Favor short sentences and concrete actions.",
  experienceLevel: "intermediate",
  jobRole: "labourer",
  jobRoleOther: null,
  englishLiteracy: "limited",
  projectExperience: "moderate",
};

const experiencedForeman: EvaluationPersona = {
  id: "foreman",
  name: "Experienced Foreman",
  description: "Leads the crew day to day.",
  evaluationInstructions: "Notice missing assignments and vague controls.",
  experienceLevel: "experienced",
  jobRole: "foreman",
  jobRoleOther: null,
  englishLiteracy: "fluent",
  projectExperience: "extensive",
};

const answerKey: ScenarioAnswerKey = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Dock lift",
  imageSrc: "/images/demo.png",
  workSteps: ["Lift pipe bundles with the crane"],
  environmentalHazards: ["Workers below the swing radius"],
  hazards: [
    {
      id: "suspended-load",
      name: "Suspended Load",
      severity: "high",
      isLifeThreatening: true,
      calloutPoints: ["Never stand under the load"],
      requiredControls: ["Mark an exclusion zone"],
    },
  ],
  modelSummary: "Call out the lift, the exclusion zone, and who signals.",
};

describe("persona interpretation notes", () => {
  it("asks a new labourer for explicit locations and steps", () => {
    const prompt = formatPersonaForEvaluationPrompt(newHire);

    assert.ok(prompt.includes("id: new-hire"));
    assert.ok(prompt.includes("Entry Level"));
    assert.ok(
      prompt.includes(
        "needs hazards, controls, locations, and timing stated explicitly",
      ),
    );
    assert.ok(prompt.includes("Labourer: focus on personal actions"));
  });

  it("treats limited English as a reason simpler wording is required", () => {
    const prompt = formatPersonaForEvaluationPrompt(limitedEnglish);

    assert.ok(prompt.includes("Limited English"));
    assert.ok(prompt.includes("short, direct sentences"));
    assert.equal(
      prompt.includes("do not score down for ordinary jobsite vocabulary"),
      false,
    );
  });

  it("does not punish shorthand for an experienced fluent foreman", () => {
    const prompt = formatPersonaForEvaluationPrompt(experiencedForeman);

    assert.ok(prompt.includes("Foreman"));
    assert.ok(prompt.includes("Do not punish normal trade language"));
    assert.ok(prompt.includes("Extensive Project Experience"));
    assert.equal(prompt.includes("Trade shorthand, assumed knowledge"), false);
  });
});

describe("buildEvaluationPrompt", () => {
  it("separates objective scoring from persona communication scoring", () => {
    const { system, user } = buildEvaluationPrompt({
      transcript: "Stay out from under the crane while we make this lift.",
      answerKey,
      personas: [newHire, limitedEnglish, experiencedForeman],
    });

    assert.ok(system.includes("Objective scenario performance"));
    assert.ok(system.includes("Persona-specific communication"));
    assert.ok(system.includes("Do not make personas randomly disagree"));
    assert.ok(system.includes("evaluate the CUMULATIVE record"));
    assert.ok(system.includes("personaEvaluations"));
    assert.ok(system.includes("id: new-hire"));
    assert.ok(system.includes("id: limited-english"));
    assert.ok(system.includes("id: foreman"));
    assert.ok(system.includes("How this worker interprets the talk"));
    assert.equal(system.includes("at most TWO questions"), false);
    assert.ok(system.includes("Do not generate overlapping questions across personas"));
    assert.ok(system.includes("Judge each previously asked worker question on its own"));
    assert.ok(user.includes("Stay out from under the crane"));
    assert.ok(user.includes("suspended-load"));
  });

  it("scores labeled conversation history instead of only the newest reply", () => {
    const { system, user } = buildEvaluationPrompt({
      transcript:
        "Stay out from under the crane while we make this lift.\n\nNobody walks through the barricaded path.",
      answerKey,
      personas: [newHire],
      conversation: [
        {
          stageType: "initial",
          segmentTranscript: "Stay out from under the crane while we make this lift.",
          answeringQuestions: undefined,
        },
        {
          stageType: "clarification_1",
          segmentTranscript: "Nobody walks through the barricaded path.",
          answeringQuestions: [
            {
              personaId: "new-hire",
              personaName: "New Hire",
              question: "Where should I stand while the lift is operating?",
              reason: "Location missing",
              relatedHazardId: "suspended-load",
              mergedFromPersonaIds: [],
            },
          ],
        },
      ],
    });

    assert.ok(system.includes("Do not penalize the speaker for not repeating"));
    assert.ok(user.includes("### Initial safety talk"));
    assert.ok(user.includes("### Worker questions (clarification 1)"));
    assert.ok(user.includes("Nobody walks through the barricaded path."));
    assert.ok(
      system.includes(
        "Do not ask for information the trainee already clearly provided",
      ),
    );
  });

  it("forbids new questions after the final clarification", () => {
    const { system } = buildEvaluationPrompt({
      transcript: "Stay clear of the load.",
      answerKey,
      personas: [newHire],
      followUpBudget: 0,
    });

    assert.ok(system.includes("Do NOT invent new follow-up questions"));
    assert.ok(system.includes("empty followUpQuestionCandidates arrays"));
  });
});
