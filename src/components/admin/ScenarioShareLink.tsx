"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

type ScenarioShareLinkProps = {
  scenarioId: string;
  scenarioTitle: string;
};

export function ScenarioShareLink({
  scenarioId,
  scenarioTitle,
}: ScenarioShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const sharePath = `/assessment/${scenarioId}`;

  const copyLink = async () => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${sharePath}`
        : sharePath;

    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="gap-0 py-0 ring-1 ring-emerald-200">
      <CardHeader className="border-b border-emerald-100 bg-emerald-50/60 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-emerald-900">
          <Check className="size-4" aria-hidden />
          Scenario saved
        </CardTitle>
        <CardDescription className="text-emerald-800/80">
          {scenarioTitle} is ready to share with trainees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Link2 className="size-4 text-[#1e4a8c]" aria-hidden />
          Shareable assessment link
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={sharePath} aria-label="Shareable assessment link" />
          <Button type="button" variant="outline" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="size-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Copy link
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Dynamic assessment loading from saved scenarios is not wired up yet.
          This link confirms the scenario ID for future trainee routes.
        </p>
      </CardContent>
    </Card>
  );
}
