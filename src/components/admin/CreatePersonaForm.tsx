"use client";

import { useState } from "react";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  PERSONA_AVATAR_COLORS,
  derivePersonaInitials,
  type PersonaRecord,
} from "~/types/persona";

const createPersonaFormSchema = z.object({
  name: z.string().trim().min(1, "Persona name is required"),
  roleDescription: z.string().trim().min(1, "Role / description is required"),
  evaluationInstructions: z
    .string()
    .trim()
    .min(1, "Evaluation instructions are required"),
  initials: z.string().trim().max(8),
  avatarColor: z.string().min(1),
});

type CreatePersonaFormErrors = Partial<
  Record<keyof z.infer<typeof createPersonaFormSchema>, string>
> & { form?: string };

type CreatePersonaFormProps = {
  onCreated: (persona: PersonaRecord) => void;
  onCancel: () => void;
};

export function CreatePersonaForm({
  onCreated,
  onCancel,
}: CreatePersonaFormProps) {
  const [name, setName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [evaluationInstructions, setEvaluationInstructions] = useState("");
  const [initials, setInitials] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(
    PERSONA_AVATAR_COLORS[0]!.value,
  );
  const [errors, setErrors] = useState<CreatePersonaFormErrors>({});

  const createPersona = api.scenario.createPersona.useMutation({
    onSuccess: (persona) => {
      onCreated(persona);
    },
    onError: (error) => {
      setErrors({
        form:
          error.message ||
          "Unable to create persona. Check your inputs and try again.",
      });
    },
  });

  const handleSave = () => {
    setErrors({});

    const validation = createPersonaFormSchema.safeParse({
      name,
      roleDescription,
      evaluationInstructions,
      initials,
      avatarColor,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        roleDescription: fieldErrors.roleDescription?.[0],
        evaluationInstructions: fieldErrors.evaluationInstructions?.[0],
        initials: fieldErrors.initials?.[0],
        avatarColor: fieldErrors.avatarColor?.[0],
      });
      return;
    }

    createPersona.mutate({
      name: validation.data.name,
      roleDescription: validation.data.roleDescription,
      evaluationInstructions: validation.data.evaluationInstructions,
      initials: validation.data.initials || undefined,
      avatarColor: PERSONA_AVATAR_COLORS.some(
        (color) => color.value === validation.data.avatarColor,
      )
        ? (validation.data.avatarColor as (typeof PERSONA_AVATAR_COLORS)[number]["value"])
        : undefined,
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
          Create custom persona
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
          disabled={createPersona.isPending}
          onClick={handleSave}
        >
          {createPersona.isPending ? "Saving…" : "Save persona"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={createPersona.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
