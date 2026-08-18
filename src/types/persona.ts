export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "New / Entry Level", tagLabel: "Entry Level" },
  { value: "intermediate", label: "Intermediate", tagLabel: "Intermediate" },
  { value: "experienced", label: "Experienced", tagLabel: "Experienced" },
  {
    value: "very-experienced",
    label: "Very Experienced",
    tagLabel: "Very Experienced",
  },
] as const;

export const JOB_ROLES = [
  { value: "foreman", label: "Foreman" },
  { value: "engineer", label: "Engineer" },
  { value: "labourer", label: "Labourer" },
  { value: "apprentice", label: "Apprentice" },
  { value: "project-manager", label: "Project Manager" },
  { value: "equipment-operator", label: "Equipment Operator" },
  { value: "site-supervisor", label: "Site Supervisor" },
  { value: "other", label: "Other" },
] as const;

export const ENGLISH_LITERACY_LEVELS = [
  { value: "limited", label: "Limited", tagLabel: "Limited English" },
  { value: "developing", label: "Developing", tagLabel: "Developing English" },
  {
    value: "professional",
    label: "Professional",
    tagLabel: "Professional English",
  },
  { value: "fluent", label: "Fluent", tagLabel: "Fluent English" },
] as const;

export const PROJECT_EXPERIENCE_LEVELS = [
  { value: "none", label: "None", tagLabel: "No Project Experience" },
  { value: "limited", label: "Limited", tagLabel: "Limited Project Experience" },
  {
    value: "moderate",
    label: "Moderate",
    tagLabel: "Moderate Project Experience",
  },
  {
    value: "extensive",
    label: "Extensive",
    tagLabel: "Extensive Project Experience",
  },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];
export type JobRole = (typeof JOB_ROLES)[number]["value"];
export type EnglishLiteracy =
  (typeof ENGLISH_LITERACY_LEVELS)[number]["value"];
export type ProjectExperience =
  (typeof PROJECT_EXPERIENCE_LEVELS)[number]["value"];

export const EXPERIENCE_LEVEL_VALUES = EXPERIENCE_LEVELS.map(
  (option) => option.value,
) as [ExperienceLevel, ...ExperienceLevel[]];

export const JOB_ROLE_VALUES = JOB_ROLES.map((option) => option.value) as [
  JobRole,
  ...JobRole[],
];

export const ENGLISH_LITERACY_VALUES = ENGLISH_LITERACY_LEVELS.map(
  (option) => option.value,
) as [EnglishLiteracy, ...EnglishLiteracy[]];

export const PROJECT_EXPERIENCE_VALUES = PROJECT_EXPERIENCE_LEVELS.map(
  (option) => option.value,
) as [ProjectExperience, ...ProjectExperience[]];

export type PersonaCharacteristicFields = {
  experienceLevel: string | null;
  jobRole: string | null;
  jobRoleOther: string | null;
  englishLiteracy: string | null;
  projectExperience: string | null;
};

export type PersonaRecord = {
  id: string;
  organizationId: string | null;
  isCustom: boolean;
  name: string;
  roleDescription: string;
  evaluationInstructions: string;
  initials: string;
  avatarColor: string;
  imagePath: string | null;
  experienceLevel: string | null;
  jobRole: string | null;
  jobRoleOther: string | null;
  englishLiteracy: string | null;
  projectExperience: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type PersonaCharacteristicTag = {
  key: string;
  label: string;
};

/** Tailwind class pairs used for persona avatar chips in admin + assessment UI. */
export const PERSONA_AVATAR_COLORS = [
  { label: "Blue", value: "bg-blue-100 text-blue-800" },
  { label: "Orange", value: "bg-orange-100 text-orange-800" },
  { label: "Emerald", value: "bg-emerald-100 text-emerald-800" },
  { label: "Violet", value: "bg-violet-100 text-violet-800" },
  { label: "Slate", value: "bg-slate-200 text-slate-800" },
  { label: "Amber", value: "bg-amber-100 text-amber-800" },
  { label: "Rose", value: "bg-rose-100 text-rose-800" },
  { label: "Cyan", value: "bg-cyan-100 text-cyan-800" },
] as const;

export type PersonaAvatarColor =
  (typeof PERSONA_AVATAR_COLORS)[number]["value"];

export function derivePersonaInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "CP";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function findOptionLabel<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.value === value)?.label;
}

export function getJobRoleTagLabel(
  jobRole: string | null | undefined,
  jobRoleOther: string | null | undefined,
): string | undefined {
  if (!jobRole) {
    return undefined;
  }

  if (jobRole === "other") {
    const customRole = jobRoleOther?.trim();
    return customRole && customRole.length > 0 ? customRole : undefined;
  }

  return findOptionLabel(JOB_ROLES, jobRole);
}

export function getPersonaCharacteristicTags(
  persona: PersonaCharacteristicFields,
): PersonaCharacteristicTag[] {
  const tags: PersonaCharacteristicTag[] = [];

  const jobRoleLabel = getJobRoleTagLabel(persona.jobRole, persona.jobRoleOther);
  if (jobRoleLabel) {
    tags.push({ key: "jobRole", label: jobRoleLabel });
  }

  const experience = EXPERIENCE_LEVELS.find(
    (option) => option.value === persona.experienceLevel,
  );
  if (experience) {
    tags.push({ key: "experienceLevel", label: experience.tagLabel });
  }

  const literacy = ENGLISH_LITERACY_LEVELS.find(
    (option) => option.value === persona.englishLiteracy,
  );
  if (literacy) {
    tags.push({ key: "englishLiteracy", label: literacy.tagLabel });
  }

  const projectExperience = PROJECT_EXPERIENCE_LEVELS.find(
    (option) => option.value === persona.projectExperience,
  );
  if (projectExperience) {
    tags.push({ key: "projectExperience", label: projectExperience.tagLabel });
  }

  return tags;
}

export function formatPersonaCharacteristicsForPrompt(
  persona: PersonaCharacteristicFields,
): string | null {
  const tags = getPersonaCharacteristicTags(persona);
  if (tags.length === 0) {
    return null;
  }

  return tags.map((tag) => tag.label).join(" · ");
}

export function mergePersonaRecords(
  ...lists: Array<PersonaRecord[] | undefined>
): PersonaRecord[] {
  const byId = new Map<string, PersonaRecord>();

  for (const list of lists) {
    if (!list) {
      continue;
    }

    for (const persona of list) {
      byId.set(persona.id, persona);
    }
  }

  return [...byId.values()];
}
