"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";

import { CreatePersonaForm } from "~/components/admin/CreatePersonaForm";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { PersonaRecord } from "~/types/persona";
import { cn } from "~/lib/utils";

type PersonaSelectorProps = {
  personas: PersonaRecord[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  onPersonaCreated?: (persona: PersonaRecord) => void;
  error?: string;
  isLoading?: boolean;
};

function PersonaCard({
  persona,
  isSelected,
  onToggle,
}: {
  persona: PersonaRecord;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-[#1e4a8c] bg-[#1e4a8c]/5 ring-1 ring-[#1e4a8c]/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
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
          {isSelected ? (
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1e4a8c] text-white">
              <Check className="size-3" aria-hidden />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {persona.roleDescription}
        </p>
      </div>
    </button>
  );
}

export function PersonaSelector({
  personas,
  selectedIds,
  onChange,
  onPersonaCreated,
  error,
  isLoading = false,
}: PersonaSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);

  const premadePersonas = personas.filter((persona) => !persona.isCustom);
  const customPersonas = personas.filter((persona) => persona.isCustom);

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
          {!isCreating ? (
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
            onCreated={(persona) => {
              setIsCreating(false);
              onPersonaCreated?.(persona);
              if (!selectedIds.includes(persona.id)) {
                onChange([...selectedIds, persona.id]);
              }
            }}
            onCancel={() => setIsCreating(false)}
          />
        ) : null}

        {customPersonas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {customPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isSelected={selectedIds.includes(persona.id)}
                onToggle={() => togglePersona(persona.id)}
              />
            ))}
          </div>
        ) : !isCreating ? (
          <p className="text-xs text-slate-500">
            No custom personas yet. Create one tailored to your crew or jobsite.
          </p>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
