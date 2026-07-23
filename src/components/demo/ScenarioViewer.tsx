import Image from "next/image";
import { FileText } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { AssessmentScenario } from "~/types/assessment";
import { cn } from "~/lib/utils";

type ScenarioViewerProps = {
  className?: string;
  scenario: AssessmentScenario;
  onShowDescription?: () => void;
};

export function ScenarioViewer({
  className,
  scenario,
  onShowDescription,
}: ScenarioViewerProps) {
  return (
    <Card
      data-tour="scenario"
      className={cn("gap-0 overflow-hidden py-0 ring-1 ring-slate-200", className)}
    >
      <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 text-white">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
          {scenario.title}
        </h2>
        {onShowDescription ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 shrink-0 gap-1.5 bg-white/15 px-2.5 text-xs text-white hover:bg-white/25 hover:text-white"
            onClick={onShowDescription}
          >
            <FileText className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Scenario Description</span>
            <span className="sm:hidden">Description</span>
          </Button>
        ) : null}
      </div>

      <CardContent className="relative p-0">
        <Image
          src={scenario.imageSrc}
          alt={scenario.imageAlt}
          width={1672}
          height={941}
          className="block h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
      </CardContent>
    </Card>
  );
}
