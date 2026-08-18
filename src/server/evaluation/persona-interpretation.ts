import {
  formatPersonaCharacteristicsForPrompt,
  getJobRoleTagLabel,
  type PersonaCharacteristicFields,
} from "~/types/persona";

export type PersonaInterpretationInput = PersonaCharacteristicFields & {
  id: string;
  name: string;
  description: string;
  evaluationInstructions: string;
};

function experienceNotes(level: string | null): string | null {
  switch (level) {
    case "entry":
      return "New/entry-level: needs hazards, controls, locations, and timing stated explicitly. Trade shorthand, assumed knowledge, or 'you know the drill' language counts as unclear.";
    case "intermediate":
      return "Intermediate experience: can fill some routine gaps, but still needs key controls, PPE, and stop-work expectations stated.";
    case "experienced":
      return "Experienced worker: understands common jobsite shorthand and standard controls. Do not punish normal trade language. Still needs THIS job's specific hazards and controls, not generic 'be careful' talk.";
    case "very-experienced":
      return "Very experienced worker: can infer context that a new worker could not. Judge whether the talk was specific enough for this job, not whether every basic term was defined.";
    default:
      return null;
  }
}

function jobRoleNotes(
  jobRole: string | null,
  jobRoleOther: string | null,
): string | null {
  const customRole = getJobRoleTagLabel(jobRole, jobRoleOther);

  switch (jobRole) {
    case "labourer":
      return "Labourer: focus on personal actions — where to stand, what to wear, what to keep clear of, and when to stop.";
    case "apprentice":
      return "Apprentice: needs explicit teaching. Do not assume they already know standard controls for this task.";
    case "foreman":
      return "Foreman: can follow shorthand, but notices missing crew assignments, sequencing, and whether controls are actually specific.";
    case "site-supervisor":
      return "Site supervisor: evaluates completeness, accountability, and whether the talk sets clear expectations for the whole crew.";
    case "engineer":
      return "Engineer: pays attention to technical accuracy of named hazards and controls. Vague or incorrect technical detail is a problem; missing basic labourer coaching is less central unless it creates a real safety gap.";
    case "equipment-operator":
      return "Equipment operator: needs signals, exclusion zones, swing radius, and duties that affect their machine. Personal labourer PPE lists matter less than lift/path/signal instructions unless they work on the ground too.";
    case "project-manager":
      return "Project manager: looks for the overall plan, who is responsible, and whether stop-work and coordination were addressed.";
    case "other":
      return customRole
        ? `Job role (${customRole}): interpret the talk in terms of what this role would need to hear to work safely.`
        : "Custom job role: interpret the talk based on the persona description and evaluation instructions.";
    default:
      return null;
  }
}

function englishLiteracyNotes(level: string | null): string | null {
  switch (level) {
    case "limited":
      return "Limited English: needs short, direct sentences and concrete actions. Idioms, stacked clauses, unexplained jargon, or fast rambling lower understandability even if the content is complete for a fluent worker.";
    case "developing":
      return "Developing English: common workplace words are OK if explained once. Dense explanations or multiple instructions in one sentence may be lost.";
    case "professional":
      return "Professional English: standard site language is fine. Only flag wording that would confuse a competent workplace English speaker.";
    case "fluent":
      return "Fluent English: do not score down for ordinary jobsite vocabulary or sentence complexity.";
    default:
      return null;
  }
}

function projectExperienceNotes(level: string | null): string | null {
  switch (level) {
    case "none":
      return "No project-type experience: needs context for this kind of work explained (what the equipment is, why a control matters, what 'the lift' refers to).";
    case "limited":
      return "Limited project experience: can recognize some context but still needs this site's specific hazards and controls explained.";
    case "moderate":
      return "Moderate project experience: some assumed context is OK. Still needs this job's unusual or high-risk items called out.";
    case "extensive":
      return "Extensive project experience: understands this type of work. Do not treat skipped background as a miss; still require THIS site's actual hazards and controls.";
    default:
      return null;
  }
}

/** Controlled, explainable notes for how a persona should interpret a safety talk. */
export function getPersonaInterpretationNotes(
  persona: PersonaCharacteristicFields,
): string[] {
  return [
    experienceNotes(persona.experienceLevel),
    jobRoleNotes(persona.jobRole, persona.jobRoleOther),
    englishLiteracyNotes(persona.englishLiteracy),
    projectExperienceNotes(persona.projectExperience),
  ].filter((note): note is string => Boolean(note));
}

export function formatPersonaForEvaluationPrompt(
  persona: PersonaInterpretationInput,
): string {
  const characteristics = formatPersonaCharacteristicsForPrompt(persona);
  const header = characteristics
    ? `- ${persona.name} (id: ${persona.id}): ${characteristics}`
    : `- ${persona.name} (id: ${persona.id})`;
  const interpretation = getPersonaInterpretationNotes(persona);
  const interpretationBlock =
    interpretation.length > 0
      ? ["  How this worker interprets the talk:", ...interpretation.map((note) => `    - ${note}`)].join(
          "\n",
        )
      : null;

  return [
    header,
    `  Role: ${persona.description}`,
    `  Evaluation instructions: ${persona.evaluationInstructions}`,
    interpretationBlock,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
