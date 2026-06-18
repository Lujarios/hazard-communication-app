import {
  STAR_RATINGS,
  type RubricCriterion,
} from "~/types/feedback";

/** PDF files in `public/safety-reference/` used to build this rubric. */
export const safetyReferenceFiles = [
  "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf",
  "Pre job Scorecard- EEI updated.pdf",
  "CSRA Training Safety Guide.pdf",
] as const;

export type SafetyReferenceFile = (typeof safetyReferenceFiles)[number];

/**
 * Rubric criteria for evaluating a pre-job hazard communication talk.
 *
 * Derived from the professor's safety references. Star anchors describe observable
 * qualities in the trainee's spoken transcript (not full crew-meeting logistics
 * such as physical attendance at the jobsite).
 */
export const safetyRubricCriteria: RubricCriterion[] = [
  {
    id: "work-steps-and-scope",
    label: "Work Steps & Scope",
    description:
      "The talk identifies major work steps and the tools or equipment needed to complete the job safely.",
    evaluationGuidance:
      "Check whether the speaker breaks the job into clear steps and mentions materials, tools, or equipment relevant to the scenario. Partial credit if steps are implied but not explicit.",
    starAnchors: {
      1: "No work steps or scope described; talk jumps straight to hazards without context.",
      2: "Vague mention of work with one step or tool named; scope is unclear.",
      3: "Some major work steps identified but incomplete; tools or equipment barely mentioned.",
      4: "Most major work steps and necessary tools or equipment are discussed clearly.",
      5: "Work is broken into well-defined steps with roles implied; tools and equipment are identified and tied to the tasks.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (items 3–4)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (key work steps)",
    ],
    weight: 7,
  },
  {
    id: "hazard-identification-completeness",
    label: "Hazard Identification",
    description:
      "Hazards associated with the job and hazards from the surrounding environment are identified and discussed.",
    evaluationGuidance:
      "Compare the transcript to the scenario answer key. Score down for each significant hazard not mentioned. Credit environmental or surrounding-work hazards (e.g., crane operations, other crews, ground conditions).",
    starAnchors: {
      1: "Few or no relevant hazards identified.",
      2: "Only one hazard mentioned or hazards named without explanation.",
      3: "Some scenario hazards covered but important ones missed; little mention of surrounding conditions.",
      4: "Most scenario hazards identified with reasonable detail; some environmental context included.",
      5: "All key scenario hazards and relevant surrounding hazards are clearly identified and explained.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (items 5–6)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (hazards for each work step; hazards around us)",
    ],
    weight: 9,
  },
  {
    id: "control-measures",
    label: "Control Measures",
    description:
      "Controls or management strategies are identified for each hazard discussed.",
    evaluationGuidance:
      "Each identified hazard should have at least one concrete control (engineering, administrative, or PPE). Score down when hazards are named without controls or controls are generic (e.g., 'be careful').",
    starAnchors: {
      1: "No controls provided or only 'be safe' language.",
      2: "Controls mentioned for one hazard only; others left unaddressed.",
      3: "Controls given for some hazards but vague, incomplete, or not matched to risk.",
      4: "Most hazards have specific, practical controls explained.",
      5: "Every discussed hazard has clear, actionable controls appropriate to the risk level.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (item 7)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (how we control each hazard)",
    ],
    weight: 5,
  },
  {
    id: "life-threatening-emphasis",
    label: "Life-Threatening Hazard Emphasis",
    description:
      "Life-threatening or high-energy hazards and their direct controls are verbally differentiated and emphasized.",
    evaluationGuidance:
      "Look for explicit emphasis on SIF-potential hazards (e.g., falls from height, suspended loads). The speaker should distinguish these from lower-severity issues and stress direct controls such as exclusion zones, fall protection, or tag lines.",
    starAnchors: {
      1: "Life-threatening hazards not identified or treated the same as minor issues.",
      2: "A serious hazard may be named but not emphasized or lacks strong controls.",
      3: "Some differentiation between serious and minor hazards; emphasis is inconsistent.",
      4: "Major SIF-potential hazards are called out with stronger language and direct controls.",
      5: "Life-threatening hazards are clearly prioritized, emphasized, and paired with direct controls.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (item 8)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (life-threatening hazards; direct controls)",
    ],
    weight: 5,
  },
  {
    id: "communication-clarity",
    label: "Communication Clarity",
    description:
      "The talk is structured, uses relevant examples, and communicates expectations clearly.",
    evaluationGuidance:
      "Assess organization (intro → hazards → controls → wrap-up), use of site-specific examples, plain language, and whether expectations are understandable to varied audiences.",
    starAnchors: {
      1: "Disorganized, confusing, or too vague to follow.",
      2: "Hard to follow; minimal structure or jargon without explanation.",
      3: "Understandable but uneven structure; limited site-specific examples.",
      4: "Clear flow with practical examples tied to the scenario.",
      5: "Well-structured, engaging, site-specific talk that sets clear expectations for the crew.",
    },
    sourceReferences: [
      "CSRA Training Safety Guide.pdf (communicating expectations; practical examples)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (efficient, facilitator-led clarity)",
    ],
    weight: 4,
  },
  {
    id: "worker-engagement",
    label: "Worker Engagement & Verification",
    description:
      "The speaker checks understanding and invites worker participation in identifying hazards and controls.",
    evaluationGuidance:
      "Look for questions to the crew, confirmation of understanding, prompts for others to speak, or verification that workers know their roles. Typed or solo transcripts may show intent to engage even if no crew responds.",
    starAnchors: {
      1: "One-way lecture with no checks for understanding or participation.",
      2: "Minimal engagement; no verification that workers understood.",
      3: "Some engagement cues (e.g., one question) but limited confirmation of understanding.",
      4: "Multiple prompts for input or clear verification of crew understanding.",
      5: "Strong facilitation: workers are invited to identify hazards/controls and understanding is actively confirmed.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (items 14–15)",
      "CSRA Training Safety Guide.pdf (collaborative learning)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (active participation during meeting)",
    ],
    weight: 6,
  },
  {
    id: "stop-work-and-emergency",
    label: "Stop Work & Emergency Readiness",
    description:
      "Potential changes, stop-work authority, and emergency response are addressed where relevant.",
    evaluationGuidance:
      "Credit discussion of stopping for unexpected changes, disruptions, or new hazards, plus emergency roles or protocols when appropriate to the scenario. Do not penalize heavily if the scenario talk is narrowly scoped, but note omissions in missed items.",
    starAnchors: {
      1: "No mention of stopping work or emergencies.",
      2: "Brief or vague reference to stopping work or emergencies.",
      3: "Stop-work or change management mentioned superficially; emergency plans absent or generic.",
      4: "Clear stop-work expectations or change plan; some emergency awareness.",
      5: "Stop-work authority, change management, and emergency roles/responsibilities are discussed concretely.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (items 11–13)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (changes; stop work; emergency)",
    ],
    weight: 10,
  },
  {
    id: "ppe-and-procedures",
    label: "PPE & Procedural Expectations",
    description:
      "Required PPE and procedural requirements (permits, documentation, housekeeping) are communicated.",
    evaluationGuidance:
      "Check for hard hats, hi-vis, task-specific PPE, housekeeping, permits, or pre-job documentation when relevant to identified hazards.",
    starAnchors: {
      1: "PPE or procedural requirements not mentioned despite obvious gaps in the scenario.",
      2: "Generic PPE mention without tying to specific hazards or tasks.",
      3: "Some PPE or procedures covered but incomplete for the scenario.",
      4: "Most required PPE and key procedures are stated clearly.",
      5: "PPE and procedural expectations are specific, complete, and linked to identified hazards.",
    },
    sourceReferences: [
      "Pre job Scorecard- EEI updated.pdf (items 9–10)",
      "High Quality Pre-Job Safety Meetings Guide 12.17.24.pdf (required documentation)",
    ],
    weight: 6,
  },
];

export const safetyRubricById: Record<string, RubricCriterion> =
  Object.fromEntries(safetyRubricCriteria.map((c) => [c.id, c]));

export function getRubricCriterion(id: string): RubricCriterion | undefined {
  return safetyRubricById[id];
}

export function getMaxRubricWeight(): number {
  return safetyRubricCriteria.reduce((sum, c) => sum + c.weight, 0);
}

/** Format rubric criteria for inclusion in an AI evaluation prompt. */
export function formatRubricForPrompt(): string {
  return safetyRubricCriteria
    .map((c) => {
      const anchors = STAR_RATINGS.map(
        (stars) => `  ${stars}★: ${c.starAnchors[stars]}`,
      ).join("\n");

      return [
        `### ${c.label} (id: ${c.id}, weight: ${c.weight})`,
        c.description,
        `Evaluation guidance: ${c.evaluationGuidance}`,
        "Star anchors:",
        anchors,
      ].join("\n");
    })
    .join("\n\n");
}
