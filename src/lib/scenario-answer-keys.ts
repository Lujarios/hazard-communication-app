import { scenario, type HazardSeverity } from "~/lib/demo-data";

export type ScenarioHazardAnswer = {
  id: string;
  name: string;
  severity: HazardSeverity;
  /** Whether this hazard should be emphasized as life-threatening / SIF-potential. */
  isLifeThreatening: boolean;
  /** What the trainee should verbally call out when describing this hazard. */
  calloutPoints: string[];
  /** Controls or corrective actions expected in a strong safety talk. */
  requiredControls: string[];
};

export type ScenarioAnswerKey = {
  id: string;
  title: string;
  imageSrc: string;
  workSteps: string[];
  environmentalHazards: string[];
  hazards: ScenarioHazardAnswer[];
  /** Example of a high-quality pre-job talk for this scenario (evaluator reference). */
  modelSummary: string;
};

export const CONSTRUCTION_SITE_DEMO_ID = scenario.id;

export const constructionSiteDemoAnswerKey: ScenarioAnswerKey = {
  id: CONSTRUCTION_SITE_DEMO_ID,
  title: "Commercial Building Construction",
  imageSrc: "/images/construction-site-demo.png",
  workSteps: [
    "Concrete work and structural activities on the multi-story building under construction",
    "Material handling with mobile crane (pipe bundles and structural components)",
    "Access to upper levels via ladder and scaffold systems",
    "Ground-level material staging, housekeeping, and worker movement around the site",
  ],
  environmentalHazards: [
    "Overhead crane operations and swing radius affecting workers below",
    "Multiple crews and equipment sharing the active construction zone",
    "Uneven ground, debris, and staged materials creating trip and strike-by exposure",
    "Weather and visibility affecting crane signals and edge work (assess daily)",
  ],
  hazards: [
    {
      id: "unprotected-edge",
      name: "Unprotected Edge",
      severity: "high",
      isLifeThreatening: true,
      calloutPoints: [
        "Open edge on the upper floor with no guardrails or mid-rail protection",
        "Worker positioned near the unprotected edge with fall exposure",
        "Potential for serious injury or fatality from a fall to a lower level",
      ],
      requiredControls: [
        "Install guardrails or approved fall-protection systems before work at the edge",
        "Keep workers back from the edge until protection is in place",
        "Use personal fall arrest where guardrails are not feasible",
        "Establish a controlled access zone and brief crew on fall hazards before starting",
      ],
    },
    {
      id: "suspended-load",
      name: "Suspended Load",
      severity: "high",
      isLifeThreatening: true,
      calloutPoints: [
        "Crane is lifting a bundle of pipes; load is suspended over the work area",
        "Workers must never stand or walk under a suspended load",
        "Dropped or swinging load could cause serious injury or fatality",
      ],
      requiredControls: [
        "Establish and mark an exclusion zone under and around the lift path",
        "Use a qualified signal person and maintain clear radio or hand signals",
        "Use tag lines to control load swing when conditions require",
        "Confirm rigging, capacity, and lift plan before hoisting; stop work if rigging is questionable",
      ],
    },
    {
      id: "unsecured-ladder",
      name: "Unsecured Ladder",
      severity: "medium",
      isLifeThreatening: true,
      calloutPoints: [
        "Portable ladder leaning against the structure without visible tie-off or securing",
        "Risk of ladder shift or slip during climb or descent",
        "Fall from height if the ladder moves or user overreaches",
      ],
      requiredControls: [
        "Secure the ladder at the top and/or base per manufacturer and site rules",
        "Maintain proper ladder angle (approximately 4:1 height-to-base ratio)",
        "Inspect ladder before use; remove damaged ladders from service",
        "Maintain three points of contact; do not carry materials while climbing",
      ],
    },
    {
      id: "spilled-materials",
      name: "Spilled Materials / Trip Hazard",
      severity: "medium",
      isLifeThreatening: false,
      calloutPoints: [
        "Spilled liquid and debris on the ground create slip, trip, and fall hazards",
        "Buckets and scattered materials reduce clear walking paths",
        "Poor housekeeping increases risk of sprains, falls, and struck-by incidents",
      ],
      requiredControls: [
        "Clean up spills promptly and post wet-floor or hazard signage as needed",
        "Keep walkways and egress routes clear of materials and cords",
        "Stage materials in designated areas; dispose of waste regularly",
        "Report and barricade areas until cleanup is complete",
      ],
    },
    {
      id: "missing-ppe",
      name: "Missing PPE",
      severity: "info",
      isLifeThreatening: false,
      calloutPoints: [
        "At least one worker on site is not wearing a required hard hat",
        "Minimum PPE expectations must be enforced before work begins",
        "Missing head protection increases injury severity from falling objects and bumps",
      ],
      requiredControls: [
        "Stop and correct workers not wearing required hard hats before they enter the work zone",
        "Confirm hi-vis apparel and task-specific PPE (eye, foot, hearing) for each activity",
        "Supervisor to verify PPE compliance during the pre-job brief and throughout the shift",
        "Provide spare PPE on site or send workers to obtain PPE before continuing",
      ],
    },
  ],
  modelSummary: `Before we start on the commercial building today, let's walk through the work and the hazards we can see from right here. Our main tasks are structural work on the upper levels, crane picks for pipe bundles, ladder access to elevation, and ground-level staging—everyone stays out of the crane swing and lift path.

First, the life-threatening stuff: there is an unprotected edge on the upper floor—no guardrails yet. Nobody goes near that edge until guardrails or approved fall protection is in place, and we keep a clear controlled access zone. The crane has a suspended load of pipes over the site. We never walk under a suspended load. Tag lines and a dedicated signal person control the lift, and only riggers inside the exclusion zone handle the load.

We also have an unsecured ladder against the building. Before anyone climbs, we secure it, check the 4-to-1 angle, inspect it, and use three points of contact. On the ground, spilled material and debris are a trip and slip hazard—clean it up now, keep paths clear, and mark wet areas. I also see a worker without a hard hat. Hard hats and hi-vis are mandatory here—get one before entering the work area.

If anything changes—the lift plan, weather, or a new hazard—stop work and re-brief the crew. Does everyone understand the edges, the lift zone, ladder rules, housekeeping, and PPE? Any hazards or controls I missed?`,
};

export const scenarioAnswerKeys: Record<string, ScenarioAnswerKey> = {
  [CONSTRUCTION_SITE_DEMO_ID]: constructionSiteDemoAnswerKey,
};

export function getScenarioAnswerKey(
  scenarioId: string,
): ScenarioAnswerKey | undefined {
  return scenarioAnswerKeys[scenarioId];
}

/** Format an answer key for inclusion in an AI evaluation prompt. */
export function formatAnswerKeyForPrompt(answerKey: ScenarioAnswerKey): string {
  const hazardBlocks = answerKey.hazards
    .map((h) => {
      const callouts = h.calloutPoints.map((p) => `- ${p}`).join("\n");
      const controls = h.requiredControls.map((c) => `- ${c}`).join("\n");
      const lifeThreat = h.isLifeThreatening
        ? " (life-threatening — must be emphasized)"
        : "";

      return [
        `#### ${h.name} (id: ${h.id}, severity: ${h.severity})${lifeThreat}`,
        "Call out:",
        callouts,
        "Required controls:",
        controls,
      ].join("\n");
    })
    .join("\n\n");

  const workSteps = answerKey.workSteps.map((s) => `- ${s}`).join("\n");
  const environmental = answerKey.environmentalHazards
    .map((s) => `- ${s}`)
    .join("\n");

  return [
    `# Scenario: ${answerKey.title} (id: ${answerKey.id})`,
    "",
    "## Major work steps",
    workSteps,
    "",
    "## Environmental / surrounding hazards",
    environmental,
    "",
    "## Scenario hazards and expected controls",
    hazardBlocks,
    "",
    "## Model high-quality talk (reference only)",
    answerKey.modelSummary,
  ].join("\n");
}
