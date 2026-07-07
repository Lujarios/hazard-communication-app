"use client";

import { Check } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { PersonaRecord } from "~/types/persona";
import { cn } from "~/lib/utils";

type PersonaSelectorProps = {
  personas: PersonaRecord[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  error?: string;
  isLoading?: boolean;
};

export function PersonaSelector({
  personas,
  selectedIds,
  onChange,
  error,
  isLoading = false,
}: PersonaSelectorProps) {
  const togglePersona = (personaId: string) => {
    if (selectedIds.includes(personaId)) {
      onChange(selectedIds.filter((id) => id !== personaId));
      return;
    }

    onChange([...selectedIds, personaId]);
  };

  if (isLoading) {
    return (
      <p className="text-sm text-slate-500">Loading premade AI personas…</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {personas.map((persona) => {
          const isSelected = selectedIds.includes(persona.id);

          return (
            <button
              key={persona.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => togglePersona(persona.id)}
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
                  <p className="text-sm font-semibold text-slate-800">
                    {persona.name}
                  </p>
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
        })}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-xs text-slate-500">
        Custom persona creation will be supported in a future release. For now,
        choose from the premade worker personas used by the assessment tool.
      </p>
    </div>
  );
}
