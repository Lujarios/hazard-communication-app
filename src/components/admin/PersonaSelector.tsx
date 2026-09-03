"use client";

/**
 * Pick built-in and custom personas for a scenario; opens CreatePersonaForm.
 */
import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { CreatePersonaForm } from "~/components/admin/CreatePersonaForm";
import { PersonaCharacteristicTags } from "~/components/admin/PersonaCharacteristicTags";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { PersonaRecord } from "~/types/persona";
import { cn } from "~/lib/utils";

type PersonaSelectorProps = {
  personas: PersonaRecord[];
  selectedIds: string[];
  organizationId?: string | null;
  onChange: (selectedIds: string[]) => void;
  onPersonaSaved?: (persona: PersonaRecord) => void;
  error?: string;
  isLoading?: boolean;
};

function PersonaCard({
  persona,
  isSelected,
  onToggle,
  onEdit,
}: {
  persona: PersonaRecord;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-[#1e4a8c] bg-[#1e4a8c]/5 ring-1 ring-[#1e4a8c]/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback
            className={cn("text-xs font-semibold", persona.avatarColor)}
          >
            {persona.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-800">
                  {persona.name}
                </p>
                {persona.isCustom ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-medium"
                  >
                    Custom
                  </Badge>
                ) : null}
              </div>
            </div>
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                isSelected
                  ? "border-[#1e4a8c] bg-[#1e4a8c] text-white"
                  : "border-slate-300 bg-white text-transparent",
              )}
              aria-hidden
            >
              <Check className="size-3" />
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {persona.roleDescription}
          </p>
          <PersonaCharacteristicTags persona={persona} />
        </div>
      </button>

      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-slate-500 hover:text-slate-800"
          onClick={onEdit}
          aria-label={`Edit ${persona.name}`}
        >
          <Pencil className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export function PersonaSelector({
  personas,
  selectedIds,
  organizationId,
  onChange,
  onPersonaSaved,
  error,
  isLoading = false,
}: PersonaSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaRecord | null>(
    null,
  );

  const premadePersonas = personas.filter((persona) => !persona.isCustom);
  const customPersonas = personas.filter((persona) => persona.isCustom);
  const visibleCustomPersonas = customPersonas.filter(
    (persona) => persona.id !== editingPersona?.id,
  );
  const selectedCount = selectedIds.length;

  const togglePersona = (personaId: string) => {
    if (selectedIds.includes(personaId)) {
      onChange(selectedIds.filter((id) => id !== personaId));
      return;
    }

    onChange([...selectedIds, personaId]);
  };

  if (isLoading) {
    return (
      <p className="text-sm text-slate-500">Loading AI personas…</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        {selectedCount} selected. Selected personas are highlighted and marked
        with a check.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Premade
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {premadePersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={selectedIds.includes(persona.id)}
              onToggle={() => togglePersona(persona.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Custom
          </p>
          {!isCreating && !editingPersona ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="size-3.5" aria-hidden />
              Create persona
            </Button>
          ) : null}
        </div>

        {isCreating ? (
          <CreatePersonaForm
            organizationId={organizationId}
            onSaved={(persona) => {
              setIsCreating(false);
              onPersonaSaved?.(persona);
              if (!selectedIds.includes(persona.id)) {
                onChange([...selectedIds, persona.id]);
              }
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : null}

        {editingPersona ? (
          <CreatePersonaForm
            persona={editingPersona}
            organizationId={organizationId}
            onSaved={(persona) => {
              setEditingPersona(null);
              onPersonaSaved?.(persona);
            }}
            onCancel={() => setEditingPersona(null)}
          />
        ) : null}

        {visibleCustomPersonas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCustomPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isSelected={selectedIds.includes(persona.id)}
                onToggle={() => togglePersona(persona.id)}
                onEdit={() => {
                  setIsCreating(false);
                  setEditingPersona(persona);
                }}
              />
            ))}
          </div>
        ) : !isCreating && !editingPersona ? (
          <p className="text-xs text-slate-500">
            No custom personas yet. Create one tailored to your crew or jobsite.
          </p>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
