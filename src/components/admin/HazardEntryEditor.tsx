"use client";

import { Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { HazardFormEntry } from "~/types/scenario";

type HazardEntryEditorProps = {
  index: number;
  value: HazardFormEntry;
  onChange: (value: HazardFormEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors?: Partial<Record<keyof HazardFormEntry, string>>;
};

export function HazardEntryEditor({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  errors,
}: HazardEntryEditorProps) {
  const updateField = <K extends keyof HazardFormEntry>(
    field: K,
    fieldValue: HazardFormEntry[K],
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          Hazard {index + 1}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Remove
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor={`hazard-title-${index}`}>Hazard name / title</Label>
          <Input
            id={`hazard-title-${index}`}
            value={value.hazardTitle}
            aria-invalid={Boolean(errors?.hazardTitle)}
            onChange={(event) => updateField("hazardTitle", event.target.value)}
            placeholder="e.g. Unprotected edge"
          />
          {errors?.hazardTitle ? (
            <p className="text-xs text-destructive">{errors.hazardTitle}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`hazard-description-${index}`}>
            Hazard description
          </Label>
          <Textarea
            id={`hazard-description-${index}`}
            value={value.hazardDescription}
            aria-invalid={Boolean(errors?.hazardDescription)}
            onChange={(event) =>
              updateField("hazardDescription", event.target.value)
            }
            placeholder="Describe what makes this a hazard in the scenario."
          />
          {errors?.hazardDescription ? (
            <p className="text-xs text-destructive">
              {errors.hazardDescription}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`control-description-${index}`}>
            Correct control or mitigation
          </Label>
          <Textarea
            id={`control-description-${index}`}
            value={value.controlDescription}
            aria-invalid={Boolean(errors?.controlDescription)}
            onChange={(event) =>
              updateField("controlDescription", event.target.value)
            }
            placeholder="Describe the control workers should hear in a strong safety talk."
          />
          {errors?.controlDescription ? (
            <p className="text-xs text-destructive">
              {errors.controlDescription}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`location-note-${index}`}>
            Location note on image{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </Label>
          <Input
            id={`location-note-${index}`}
            value={value.locationNote}
            onChange={(event) => updateField("locationNote", event.target.value)}
            placeholder='e.g. "Top left near scaffolding"'
          />
        </div>
      </div>
    </div>
  );
}
