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
  createdAt: Date;
  updatedAt: Date | null;
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
