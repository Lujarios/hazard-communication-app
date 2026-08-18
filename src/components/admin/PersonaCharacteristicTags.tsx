import { Badge } from "~/components/ui/badge";
import {
  getPersonaCharacteristicTags,
  type PersonaCharacteristicFields,
} from "~/types/persona";
import { cn } from "~/lib/utils";

type PersonaCharacteristicTagsProps = {
  persona: PersonaCharacteristicFields;
  limit?: number;
  className?: string;
};

export function PersonaCharacteristicTags({
  persona,
  limit,
  className,
}: PersonaCharacteristicTagsProps) {
  const tags = getPersonaCharacteristicTags(persona);
  if (tags.length === 0) {
    return null;
  }

  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;
  const hiddenCount = tags.length - visibleTags.length;
  const fullLabel = tags.map((tag) => tag.label).join(" · ");

  return (
    <div
      className={cn("mt-1.5 flex flex-wrap gap-1", className)}
      title={fullLabel}
    >
      {visibleTags.map((tag) => (
        <Badge
          key={tag.key}
          variant="outline"
          className="h-auto max-w-full px-1.5 py-0 text-[10px] font-medium leading-4 text-slate-600"
        >
          <span className="truncate">{tag.label}</span>
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge
          variant="secondary"
          className="h-auto px-1.5 py-0 text-[10px] font-medium leading-4"
        >
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
