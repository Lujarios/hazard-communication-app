import Image from "next/image";
import { Info, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  hazardLabels,
  hazardSeverityStyles,
  scenario,
} from "~/lib/demo-data";
import { cn } from "~/lib/utils";

export function ScenarioViewer({ className }: { className?: string }) {
  return (
    <Card
      data-tour="scenario"
      className={cn("gap-0 overflow-hidden py-0 ring-1 ring-slate-200", className)}
    >
      <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 text-white">
        <h2 className="flex-1 text-sm font-semibold sm:text-base">
          {scenario.title}
        </h2>
        <Info className="size-4 shrink-0 opacity-70" aria-hidden />
      </div>

      <CardContent className="relative p-0">
        <div className="relative w-full">
          <Image
            src={scenario.imageSrc}
            alt={scenario.imageAlt}
            width={scenario.imageWidth}
            height={scenario.imageHeight}
            className="block h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />

          {hazardLabels.map((hazard) => {
            const styles = hazardSeverityStyles[hazard.severity];
            return (
              <Badge
                key={hazard.id}
                variant="outline"
                className={cn(
                  "absolute z-10 max-w-[min(42%,11rem)] -translate-x-1/2 border-l-4 px-2 py-1 text-[10px] font-semibold shadow-md sm:max-w-none sm:text-xs",
                  styles.badge,
                )}
                style={{
                  top: hazard.position.top,
                  left: hazard.position.left,
                }}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block size-1.5 rounded-full",
                    styles.dot,
                  )}
                  aria-hidden
                />
                {hazard.label}
              </Badge>
            );
          })}

          <div className="absolute bottom-3 left-3 flex gap-1">
            {[ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
              <Button
                key={i}
                type="button"
                variant="secondary"
                size="icon-xs"
                className="size-7 bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                disabled
                aria-label="Decorative control"
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
