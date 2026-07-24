"use client";

import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { joinPathForCode } from "~/lib/join-code";
import { api } from "~/trpc/react";

type ScenarioShareLinkProps = {
  scenarioId: string;
  scenarioTitle: string;
  /** When true, skips the "Scenario saved" success framing (e.g. edit page). */
  embedded?: boolean;
};

export function ScenarioShareLink({
  scenarioId,
  scenarioTitle,
  embedded = false,
}: ScenarioShareLinkProps) {
  const [copiedTarget, setCopiedTarget] = useState<"code" | "link" | null>(
    null,
  );
  const didAutoGenerate = useRef(false);

  const activeQuery = api.assessmentSession.getActiveForScenario.useQuery({
    scenarioId,
  });
  const utils = api.useUtils();
  const generateMutation = api.assessmentSession.generateForScenario.useMutation(
    {
      onSuccess: async (session) => {
        utils.assessmentSession.getActiveForScenario.setData(
          { scenarioId },
          session,
        );
      },
    },
  );

  const joinCode = activeQuery.data?.joinCode ?? null;
  const sharePath = joinCode ? joinPathForCode(joinCode) : null;
  const isBusy = activeQuery.isLoading || generateMutation.isPending;

  useEffect(() => {
    if (didAutoGenerate.current) {
      return;
    }
    if (!activeQuery.isSuccess) {
      return;
    }
    if (activeQuery.data) {
      didAutoGenerate.current = true;
      return;
    }
    didAutoGenerate.current = true;
    generateMutation.mutate({ scenarioId });
  }, [activeQuery.data, activeQuery.isSuccess, generateMutation, scenarioId]);

  const copyText = async (text: string, target: "code" | "link") => {
    const value =
      target === "link" && typeof window !== "undefined"
        ? `${window.location.origin}${text}`
        : text;

    await navigator.clipboard.writeText(value);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 2000);
  };

  return (
    <Card
      className={`gap-0 py-0 ring-1 ${embedded ? "ring-slate-200" : "ring-emerald-200"}`}
    >
      <CardHeader
        className={`border-b py-4 ${embedded ? "border-slate-100" : "border-emerald-100 bg-emerald-50/60"}`}
      >
        <CardTitle
          className={`flex items-center gap-2 text-base font-semibold ${embedded ? "text-slate-800" : "text-emerald-900"}`}
        >
          {!embedded ? <Check className="size-4" aria-hidden /> : null}
          {embedded ? "Trainee access" : "Scenario saved"}
        </CardTitle>
        <CardDescription className={embedded ? undefined : "text-emerald-800/80"}>
          {embedded
            ? `Share a join code so trainees can open “${scenarioTitle}” without logging in.`
            : `${scenarioTitle} is ready to share with trainees.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {activeQuery.isError ? (
          <p className="text-sm text-destructive">
            Unable to load join code. Check your connection and try again.
          </p>
        ) : null}

        {generateMutation.isError ? (
          <p className="text-sm text-destructive">
            {generateMutation.error.message}
          </p>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Join code</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={joinCode ?? (isBusy ? "Generating…" : "")}
              aria-label="Assessment join code"
              className="font-mono text-lg tracking-[0.2em]"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!joinCode}
                onClick={() => {
                  if (joinCode) {
                    void copyText(joinCode, "code");
                  }
                }}
              >
                {copiedTarget === "code" ? (
                  <>
                    <Check className="size-4" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden />
                    Copy code
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => generateMutation.mutate({ scenarioId })}
              >
                <RefreshCw
                  className={`size-4 ${generateMutation.isPending ? "animate-spin" : ""}`}
                  aria-hidden
                />
                New code
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Link2 className="size-4 text-[#1e4a8c]" aria-hidden />
            Shareable join link
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={sharePath ?? ""}
              aria-label="Shareable join link"
              placeholder={isBusy ? "Generating…" : undefined}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!sharePath}
              onClick={() => {
                if (sharePath) {
                  void copyText(sharePath, "link");
                }
              }}
            >
              {copiedTarget === "link" ? (
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
        </div>

        <p className="text-xs text-slate-500">
          Trainees open the link or enter the code at /join — no login required.
          Generating a new code closes the previous one. Direct UUID links at
          /assessment/[id] still work.
        </p>
      </CardContent>
    </Card>
  );
}
