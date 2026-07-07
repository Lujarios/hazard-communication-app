"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CONSTRUCTION_SITE_DEMO_SCENARIO_ID } from "~/lib/scenario-constants";
import { getScenarioImagePath } from "~/lib/scenario-images";
import { api } from "~/trpc/react";

export function ScenarioList() {
  const scenariosQuery = api.scenario.list.useQuery();

  if (scenariosQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading scenarios…</p>;
  }

  if (scenariosQuery.error) {
    return (
      <p className="text-sm text-destructive">
        Unable to load scenarios. Check your database connection.
      </p>
    );
  }

  const scenarios = scenariosQuery.data ?? [];

  if (scenarios.length === 0) {
    return (
      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-600">No scenarios saved yet.</p>
          <Button asChild className="mt-4 bg-[#1e4a8c] hover:bg-[#1e4a8c]/90">
            <Link href="/admin/scenarios/new">Create your first scenario</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => {
        const assessmentPath = `/assessment/${scenario.id}`;

        return (
          <Card key={scenario.id} className="gap-0 py-0 ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-100 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    {scenario.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {scenario.description}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      scenario.status === "ready"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }
                  >
                    {scenario.status}
                  </Badge>
                  {scenario.id === CONSTRUCTION_SITE_DEMO_SCENARIO_ID ? (
                    <Badge
                      variant="outline"
                      className="border-[#1e4a8c] bg-[#1e4a8c]/5 text-[#1e4a8c]"
                    >
                      Sample
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-xs text-slate-500">
                {scenario.hazards.length} hazard
                {scenario.hazards.length === 1 ? "" : "s"} ·{" "}
                {scenario.scenarioPersonas.length} persona
                {scenario.scenarioPersonas.length === 1 ? "" : "s"} ·{" "}
                {getScenarioImagePath(scenario.imageFileName)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/scenarios/${scenario.id}/edit`}>
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90">
                  <Link href={assessmentPath}>
                    <ExternalLink className="size-3.5" aria-hidden />
                    Open assessment
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
