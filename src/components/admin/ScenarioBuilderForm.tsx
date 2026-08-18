"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { HazardEntryEditor } from "~/components/admin/HazardEntryEditor";
import { ImageFilenameField } from "~/components/admin/ImageFilenameField";
import { PersonaSelector } from "~/components/admin/PersonaSelector";
import { ScenarioShareLink } from "~/components/admin/ScenarioShareLink";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  emptyHazardEntry,
  initialScenarioFormValues,
  type HazardFormEntry,
  type ScenarioFormValues,
} from "~/types/scenario";
import { mergePersonaRecords, type PersonaRecord } from "~/types/persona";
import { api } from "~/trpc/react";

const hazardValidationSchema = z.object({
  hazardTitle: z.string().trim().min(1, "Hazard title is required"),
  hazardDescription: z.string().trim().min(1, "Hazard description is required"),
  controlDescription: z
    .string()
    .trim()
    .min(1, "Control description is required"),
  locationNote: z.string(),
});

const formValidationSchema = z.object({
  title: z.string().trim().min(1, "Scenario title is required"),
  description: z.string().trim().min(1, "Scenario description is required"),
  imageFileName: z.string().trim().min(1, "Image filename is required"),
  hazards: z
    .array(hazardValidationSchema)
    .min(1, "Add at least one hazard and control"),
  personaIds: z
    .array(z.string())
    .min(1, "Select at least one AI persona"),
});

type FormErrors = {
  title?: string;
  description?: string;
  imageFileName?: string;
  personaIds?: string;
  hazards?: Array<Partial<Record<keyof HazardFormEntry, string>>>;
  form?: string;
};

function mapZodErrors(error: z.ZodError): FormErrors {
  const fieldErrors = error.flatten().fieldErrors;
  const hazardErrors: FormErrors["hazards"] = [];

  for (const [key, messages] of Object.entries(fieldErrors)) {
    const hazardMatch = /^hazards\.(\d+)\.(\w+)$/.exec(key);
    if (hazardMatch) {
      const index = Number(hazardMatch[1]);
      const field = hazardMatch[2] as keyof HazardFormEntry;
      hazardErrors[index] = {
        ...hazardErrors[index],
        [field]: messages?.[0],
      };
    }
  }

  return {
    title: fieldErrors.title?.[0],
    description: fieldErrors.description?.[0],
    imageFileName: fieldErrors.imageFileName?.[0],
    personaIds: fieldErrors.personaIds?.[0],
    hazards: hazardErrors.length > 0 ? hazardErrors : undefined,
  };
}

type ScenarioBuilderFormProps = {
  mode?: "create" | "edit";
  scenarioId?: string;
  organizationId?: string | null;
  initialValues?: ScenarioFormValues;
  initialPersonas?: PersonaRecord[];
};

export function ScenarioBuilderForm({
  mode = "create",
  scenarioId,
  organizationId,
  initialValues,
  initialPersonas,
}: ScenarioBuilderFormProps) {
  const [formValues, setFormValues] = useState<ScenarioFormValues>(
    initialValues ?? initialScenarioFormValues(),
  );
  const [catalogExtras, setCatalogExtras] = useState<PersonaRecord[]>(
    initialPersonas ?? [],
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedScenario, setSavedScenario] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const personasQuery = api.scenario.listPersonas.useQuery({
    organizationId: organizationId ?? undefined,
  });
  const personas = useMemo(
    () => mergePersonaRecords(personasQuery.data, catalogExtras),
    [personasQuery.data, catalogExtras],
  );

  const rememberPersona = (persona: PersonaRecord) => {
    setCatalogExtras((current) => mergePersonaRecords(current, [persona]));
  };

  const createScenario = api.scenario.create.useMutation({
    onSuccess: (scenario) => {
      setSavedScenario({ id: scenario.id, title: scenario.title });
      setErrors({});
    },
    onError: (error) => {
      setErrors({
        form:
          error.message ||
          "Unable to save the scenario. Check your inputs and try again.",
      });
    },
  });

  const updateScenario = api.scenario.update.useMutation({
    onSuccess: (scenario) => {
      setSavedScenario({ id: scenario.id, title: scenario.title });
      setErrors({});
    },
    onError: (error) => {
      setErrors({
        form:
          error.message ||
          "Unable to update the scenario. Check your inputs and try again.",
      });
    },
  });

  const isSaving = createScenario.isPending || updateScenario.isPending;

  const updateForm = (partial: Partial<ScenarioFormValues>) => {
    setFormValues((current) => ({ ...current, ...partial }));
  };

  const updateHazard = (index: number, hazard: HazardFormEntry) => {
    setFormValues((current) => ({
      ...current,
      hazards: current.hazards.map((entry, entryIndex) =>
        entryIndex === index ? hazard : entry,
      ),
    }));
  };

  const addHazard = () => {
    setFormValues((current) => ({
      ...current,
      hazards: [...current.hazards, emptyHazardEntry()],
    }));
  };

  const removeHazard = (index: number) => {
    setFormValues((current) => ({
      ...current,
      hazards: current.hazards.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const validation = formValidationSchema.safeParse(formValues);
    if (!validation.success) {
      setErrors(mapZodErrors(validation.error));
      return;
    }

    if (mode === "edit" && scenarioId) {
      updateScenario.mutate({
        id: scenarioId,
        ...validation.data,
        status: formValues.status,
      });
      return;
    }

    createScenario.mutate({
      ...validation.data,
      status: formValues.status,
    });
  };

  if (savedScenario) {
    return (
      <div className="space-y-6">
        <ScenarioShareLink
          scenarioId={savedScenario.id}
          scenarioTitle={savedScenario.title}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSavedScenario(null);
            if (mode === "edit") {
              return;
            }
            setFormValues(initialScenarioFormValues());
            setCatalogExtras([]);
          }}
        >
          {mode === "edit" ? "Edit again" : "Create another scenario"}
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Scenario details
          </CardTitle>
          <CardDescription>
            Title and instructions shown to trainees before they record their
            safety talk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Scenario title</Label>
            <Input
              id="title"
              value={formValues.title}
              aria-invalid={Boolean(errors.title)}
              onChange={(event) => updateForm({ title: event.target.value })}
              placeholder="e.g. Commercial building construction"
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Scenario description / instructions</Label>
            <Textarea
              id="description"
              value={formValues.description}
              aria-invalid={Boolean(errors.description)}
              onChange={(event) =>
                updateForm({ description: event.target.value })
              }
              placeholder="Explain the jobsite context and what the trainee should cover in their talk."
              className="min-h-28"
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Reference photo
          </CardTitle>
          <CardDescription>
            Enter the filename for a jobsite image stored locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <ImageFilenameField
            value={formValues.imageFileName}
            onChange={(imageFileName) => updateForm({ imageFileName })}
            error={errors.imageFileName}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Correct hazards and controls
          </CardTitle>
          <CardDescription>
            Define the answer key hazards and mitigations used for evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          {formValues.hazards.map((hazard, index) => (
            <HazardEntryEditor
              key={index}
              index={index}
              value={hazard}
              onChange={(entry) => updateHazard(index, entry)}
              onRemove={() => removeHazard(index)}
              canRemove={formValues.hazards.length > 1}
              errors={errors.hazards?.[index]}
            />
          ))}

          <Button type="button" variant="outline" onClick={addHazard}>
            <Plus className="size-4" aria-hidden />
            Add hazard
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            AI personas
          </CardTitle>
          <CardDescription>
            Choose which worker personas will listen and provide feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <PersonaSelector
            personas={personas}
            selectedIds={formValues.personaIds}
            organizationId={organizationId}
            onChange={(personaIds) => updateForm({ personaIds })}
            onPersonaSaved={(persona) => {
              rememberPersona(persona);
              void personasQuery.refetch();
            }}
            error={errors.personaIds}
            isLoading={personasQuery.isLoading}
          />
        </CardContent>
      </Card>

      {errors.form ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
          disabled={isSaving}
        >
          {isSaving
            ? mode === "edit"
              ? "Saving changes…"
              : "Saving scenario…"
            : mode === "edit"
              ? "Save changes"
              : "Save scenario"}
        </Button>
        <p className="text-xs text-slate-500">
          Scenarios are saved as ready to share. Draft status support can be
          added later.
        </p>
      </div>
    </form>
  );
}
