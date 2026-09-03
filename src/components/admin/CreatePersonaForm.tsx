"use client";

/**
 * Form to create or edit an org-owned custom worker persona.
 */
import { useState } from "react";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  ENGLISH_LITERACY_LEVELS,
  ENGLISH_LITERACY_VALUES,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_VALUES,
  JOB_ROLES,
  JOB_ROLE_VALUES,
  PERSONA_AVATAR_COLORS,
  PROJECT_EXPERIENCE_LEVELS,
  PROJECT_EXPERIENCE_VALUES,
  derivePersonaInitials,
  type PersonaRecord,
} from "~/types/persona";

const selectClassName =
  "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

const personaFormSchema = z
  .object({
    name: z.string().trim().min(1, "Persona name is required"),
    roleDescription: z.string().trim().min(1, "Role / description is required"),
    evaluationInstructions: z
      .string()
      .trim()
      .min(1, "Evaluation instructions are required"),
    initials: z.string().trim().max(8),
    avatarColor: z.string().min(1),
    experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES, {
      errorMap: () => ({ message: "Select an experience level" }),
    }),
    jobRole: z.enum(JOB_ROLE_VALUES, {
      errorMap: () => ({ message: "Select a job / role" }),
    }),
    jobRoleOther: z.string().trim().max(128),
    englishLiteracy: z.enum(ENGLISH_LITERACY_VALUES, {
      errorMap: () => ({ message: "Select an English literacy level" }),
    }),
    projectExperience: z.enum(PROJECT_EXPERIENCE_VALUES, {
      errorMap: () => ({ message: "Select project experience" }),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.jobRole === "other" && value.jobRoleOther.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a job / role",
        path: ["jobRoleOther"],
      });
    }
  });

type PersonaFormErrors = Partial<
  Record<keyof z.infer<typeof personaFormSchema>, string>
> & { form?: string };

type CreatePersonaFormProps = {
  persona?: PersonaRecord;
  organizationId?: string | null;
  onSaved: (persona: PersonaRecord) => void;
  onCancel: () => void;
};

function optionValue<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | "" {
  if (value && allowed.includes(value as T)) {
    return value as T;
  }

  return "";
}

export function CreatePersonaForm({
  persona,
  organizationId,
  onSaved,
  onCancel,
}: CreatePersonaFormProps) {
  const isEditing = Boolean(persona);
  const [name, setName] = useState(persona?.name ?? "");
  const [roleDescription, setRoleDescription] = useState(
    persona?.roleDescription ?? "",
  );
  const [evaluationInstructions, setEvaluationInstructions] = useState(
    persona?.evaluationInstructions ?? "",
  );
  const [initials, setInitials] = useState(persona?.initials ?? "");
  const [avatarColor, setAvatarColor] = useState<string>(
    persona?.avatarColor ?? PERSONA_AVATAR_COLORS[0].value,
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    optionValue(persona?.experienceLevel, EXPERIENCE_LEVEL_VALUES),
  );
  const [jobRole, setJobRole] = useState<string>(
    optionValue(persona?.jobRole, JOB_ROLE_VALUES),
  );
  const [jobRoleOther, setJobRoleOther] = useState(
    persona?.jobRole === "other" ? (persona.jobRoleOther ?? "") : "",
  );
  const [englishLiteracy, setEnglishLiteracy] = useState<string>(
    optionValue(persona?.englishLiteracy, ENGLISH_LITERACY_VALUES),
  );
  const [projectExperience, setProjectExperience] = useState<string>(
    optionValue(persona?.projectExperience, PROJECT_EXPERIENCE_VALUES),
  );
  const [errors, setErrors] = useState<PersonaFormErrors>({});

  const createPersona = api.scenario.createPersona.useMutation({
    onSuccess: (savedPersona) => {
      onSaved(savedPersona);
    },
    onError: (error) => {
      setErrors({
        form:
          error.message ||
          "Unable to create persona. Check your inputs and try again.",
      });
    },
  });

  const updatePersona = api.scenario.updatePersona.useMutation({
    onSuccess: (savedPersona) => {
      onSaved(savedPersona);
    },
    onError: (error) => {
      setErrors({
        form:
          error.message ||
          "Unable to update persona. Check your inputs and try again.",
      });
    },
  });

  const isSaving = createPersona.isPending || updatePersona.isPending;

  const handleSave = () => {
    setErrors({});

    const validation = personaFormSchema.safeParse({
      name,
      roleDescription,
      evaluationInstructions,
      initials,
      avatarColor,
      experienceLevel,
      jobRole,
      jobRoleOther,
      englishLiteracy,
      projectExperience,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        roleDescription: fieldErrors.roleDescription?.[0],
        evaluationInstructions: fieldErrors.evaluationInstructions?.[0],
        initials: fieldErrors.initials?.[0],
        avatarColor: fieldErrors.avatarColor?.[0],
        experienceLevel: fieldErrors.experienceLevel?.[0],
        jobRole: fieldErrors.jobRole?.[0],
        jobRoleOther: fieldErrors.jobRoleOther?.[0],
        englishLiteracy: fieldErrors.englishLiteracy?.[0],
        projectExperience: fieldErrors.projectExperience?.[0],
      });
      return;
    }

    const avatarColorValue = PERSONA_AVATAR_COLORS.some(
      (color) => color.value === validation.data.avatarColor,
    )
      ? (validation.data.avatarColor as (typeof PERSONA_AVATAR_COLORS)[number]["value"])
      : undefined;

    const payload = {
      name: validation.data.name,
      roleDescription: validation.data.roleDescription,
      evaluationInstructions: validation.data.evaluationInstructions,
      initials: validation.data.initials || undefined,
      avatarColor: avatarColorValue,
      experienceLevel: validation.data.experienceLevel,
      jobRole: validation.data.jobRole,
      jobRoleOther:
        validation.data.jobRole === "other"
          ? validation.data.jobRoleOther
          : undefined,
      englishLiteracy: validation.data.englishLiteracy,
      projectExperience: validation.data.projectExperience,
    };

    if (persona) {
      updatePersona.mutate({
        id: persona.id,
        ...payload,
      });
      return;
    }

    createPersona.mutate({
      ...payload,
      organizationId: organizationId ?? undefined,
    });
  };

  const previewInitials =
    initials.trim() || derivePersonaInitials(name) || "CP";

  // Use a div (not <form>) — this UI nests inside ScenarioBuilderForm's <form>.
  return (
    <div
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
      onKeyDown={(event) => {
        if (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
          handleSave();
        }
      }}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">
          {isEditing ? "Edit custom persona" : "Create custom persona"}
        </p>
        <p className="text-xs text-slate-500">
          Saved to your organization and available when selecting listeners for
          any scenario.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="persona-name">Name</Label>
        <Input
          id="persona-name"
          value={name}
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Night-shift ironworker"
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="persona-job-role">Job / role</Label>
          <select
            id="persona-job-role"
            value={jobRole}
            aria-invalid={Boolean(errors.jobRole)}
            onChange={(event) => setJobRole(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select job / role</option>
            {JOB_ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.jobRole ? (
            <p className="text-xs text-destructive">{errors.jobRole}</p>
          ) : null}
        </div>

        {jobRole === "other" ? (
          <div className="space-y-2">
            <Label htmlFor="persona-job-role-other">Custom job / role</Label>
            <Input
              id="persona-job-role-other"
              value={jobRoleOther}
              aria-invalid={Boolean(errors.jobRoleOther)}
              onChange={(event) => setJobRoleOther(event.target.value)}
              placeholder="e.g. Safety coordinator"
            />
            {errors.jobRoleOther ? (
              <p className="text-xs text-destructive">{errors.jobRoleOther}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="persona-experience">Experience level</Label>
            <select
              id="persona-experience"
              value={experienceLevel}
              aria-invalid={Boolean(errors.experienceLevel)}
              onChange={(event) => setExperienceLevel(event.target.value)}
              className={selectClassName}
            >
              <option value="">Select experience</option>
              {EXPERIENCE_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.experienceLevel ? (
              <p className="text-xs text-destructive">{errors.experienceLevel}</p>
            ) : null}
          </div>
        )}
      </div>

      {jobRole === "other" ? (
        <div className="space-y-2">
          <Label htmlFor="persona-experience">Experience level</Label>
          <select
            id="persona-experience"
            value={experienceLevel}
            aria-invalid={Boolean(errors.experienceLevel)}
            onChange={(event) => setExperienceLevel(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select experience</option>
            {EXPERIENCE_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.experienceLevel ? (
            <p className="text-xs text-destructive">{errors.experienceLevel}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="persona-literacy">English literacy</Label>
          <select
            id="persona-literacy"
            value={englishLiteracy}
            aria-invalid={Boolean(errors.englishLiteracy)}
            onChange={(event) => setEnglishLiteracy(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select literacy</option>
            {ENGLISH_LITERACY_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.englishLiteracy ? (
            <p className="text-xs text-destructive">{errors.englishLiteracy}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="persona-project-experience">
            Specific project experience
          </Label>
          <select
            id="persona-project-experience"
            value={projectExperience}
            aria-invalid={Boolean(errors.projectExperience)}
            onChange={(event) => setProjectExperience(event.target.value)}
            className={selectClassName}
          >
            <option value="">Select project experience</option>
            {PROJECT_EXPERIENCE_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.projectExperience ? (
            <p className="text-xs text-destructive">
              {errors.projectExperience}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="persona-role">Role / description</Label>
        <Input
          id="persona-role"
          value={roleDescription}
          aria-invalid={Boolean(errors.roleDescription)}
          onChange={(event) => setRoleDescription(event.target.value)}
          placeholder="e.g. 8 years on structural steel crews"
        />
        {errors.roleDescription ? (
          <p className="text-xs text-destructive">{errors.roleDescription}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="persona-instructions">Evaluation instructions</Label>
        <Textarea
          id="persona-instructions"
          value={evaluationInstructions}
          aria-invalid={Boolean(errors.evaluationInstructions)}
          onChange={(event) => setEvaluationInstructions(event.target.value)}
          placeholder="How should this persona react? What do they care about when listening to a safety talk?"
          className="min-h-24"
        />
        {errors.evaluationInstructions ? (
          <p className="text-xs text-destructive">
            {errors.evaluationInstructions}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="persona-initials">Initials (optional)</Label>
          <Input
            id="persona-initials"
            value={initials}
            maxLength={8}
            aria-invalid={Boolean(errors.initials)}
            onChange={(event) => setInitials(event.target.value)}
            placeholder={previewInitials}
          />
          {errors.initials ? (
            <p className="text-xs text-destructive">{errors.initials}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Avatar color</Label>
          <div className="flex flex-wrap gap-1.5">
            {PERSONA_AVATAR_COLORS.map((color) => {
              const isSelected = avatarColor === color.value;
              return (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={isSelected}
                  onClick={() => setAvatarColor(color.value)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-[10px] font-semibold ring-offset-1 transition",
                    color.value,
                    isSelected
                      ? "ring-2 ring-[#1e4a8c]"
                      : "hover:ring-1 hover:ring-slate-300",
                  )}
                >
                  {previewInitials.slice(0, 2)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {errors.form ? (
        <p className="text-xs text-destructive">{errors.form}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : "Save persona"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
