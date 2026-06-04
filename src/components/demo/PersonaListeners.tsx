"use client";

import { Headphones, Info } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { workerPersonas } from "~/lib/demo-data";
import { cn } from "~/lib/utils";

function AudioBars({ active }: { active: boolean }) {
  const heights = ["h-2", "h-4", "h-3", "h-5", "h-2", "h-4", "h-3"];

  return (
    <div className="flex items-end gap-0.5" aria-hidden>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-emerald-500",
            height,
            active && "animate-pulse",
          )}
          style={active ? { animationDelay: `${i * 80}ms` } : undefined}
        />
      ))}
    </div>
  );
}

type PersonaListenersProps = {
  isRecording?: boolean;
};

export function PersonaListeners({ isRecording = false }: PersonaListenersProps) {
  return (
    <Card className="h-fit w-full py-0 ring-1 ring-slate-200">
      <CardHeader className="border-b border-slate-100 py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          AI Worker Listeners
          <Info className="size-4 text-slate-400" aria-hidden />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {workerPersonas.map((persona) => (
            <li
              key={persona.id}
              className="flex items-start gap-3 px-4 py-3.5"
            >
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback
                  className={cn("text-xs font-semibold", persona.avatarColor)}
                >
                  {persona.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {persona.name}
                </p>
                <p className="text-xs text-slate-500">{persona.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                  <Headphones className="size-3.5 shrink-0" aria-hidden />
                  <span className="font-medium">Listening</span>
                  <AudioBars active={isRecording} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
