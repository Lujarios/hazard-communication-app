"use client";

/**
 * Org analytics dashboard: attempt volume, rubric trends, and missed-item breakdown.
 */
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Users,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

function formatStars(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }
  return `${value.toFixed(1)}★`;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-0 py-0 ring-1 ring-slate-200">
      <CardContent className="space-y-1 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function HorizontalBar({
  label,
  value,
  max,
  trailing,
  barClassName,
}: {
  label: string;
  value: number;
  max: number;
  trailing: string;
  barClassName?: string;
}) {
  const widthPct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-slate-700">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-500">{trailing}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-[#1e4a8c]", barClassName)}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function categoryBadgeClass(category: string) {
  switch (category) {
    case "hazard":
      return "border-red-200 bg-red-50 text-red-800";
    case "control":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "communication":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "procedure":
      return "border-sky-200 bg-sky-50 text-sky-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-600 bg-emerald-50 text-emerald-800"
      >
        <ArrowUpRight className="size-3.5" aria-hidden />+{delta}
      </Badge>
    );
  }
  if (delta < 0) {
    return (
      <Badge
        variant="outline"
        className="border-red-600 bg-red-50 text-red-800"
      >
        <ArrowDownRight className="size-3.5" aria-hidden />
        {delta}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
      <Minus className="size-3.5" aria-hidden />
      0
    </Badge>
  );
}

function ScenarioDetail({ scenarioId }: { scenarioId: string }) {
  const detailQuery = api.analytics.scenarioDetail.useQuery({ scenarioId });

  if (detailQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading scenario analytics…</p>;
  }

  if (detailQuery.error) {
    return (
      <p className="text-sm text-destructive">
        Unable to load scenario analytics. {detailQuery.error.message}
      </p>
    );
  }

  const detail = detailQuery.data;
  if (!detail) {
    return null;
  }

  const { summary, scoreDistribution, criteriaAverages, improvement, topMissed } =
    detail;
  const maxDistribution = Math.max(
    ...scoreDistribution.map((bucket) => bucket.count),
    1,
  );
  const maxMissed = Math.max(...topMissed.map((item) => item.count), 1);

  if (summary.attemptCount === 0) {
    return (
      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-600">
            No completed assessments yet for this scenario.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Results appear after trainees submit a safety talk and receive
            feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Attempts"
          value={String(summary.attemptCount)}
          hint="Completed assessments"
        />
        <StatCard
          label="Participants"
          value={String(summary.uniqueParticipants)}
          hint="Anonymous unique ids"
        />
        <StatCard
          label="Average score"
          value={formatStars(summary.averageOverallStars)}
          hint="Overall stars (1–5)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Score distribution
            </CardTitle>
            <CardDescription>
              Overall star ratings across completed attempts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-4">
            {scoreDistribution.map((bucket) => (
              <HorizontalBar
                key={bucket.stars}
                label={`${bucket.stars} star${bucket.stars === 1 ? "" : "s"}`}
                value={bucket.count}
                max={maxDistribution}
                trailing={`${bucket.count}`}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Criteria averages
            </CardTitle>
            <CardDescription>
              Lowest-scoring rubric areas appear first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 py-4">
            {criteriaAverages.length === 0 ? (
              <p className="text-sm text-slate-500">No criteria ratings yet.</p>
            ) : (
              criteriaAverages.map((criterion) => (
                <HorizontalBar
                  key={criterion.criterionId}
                  label={criterion.label}
                  value={criterion.averageStars}
                  max={5}
                  trailing={formatStars(criterion.averageStars)}
                  barClassName={
                    criterion.averageStars < 3
                      ? "bg-orange-500"
                      : criterion.averageStars >= 4
                        ? "bg-emerald-600"
                        : undefined
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Improvement across attempts
          </CardTitle>
          <CardDescription>
            Anonymous participants with two or more attempts on this scenario
            (first vs latest score).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          {improvement.repeatParticipantCount === 0 ? (
            <p className="text-sm text-slate-500">
              No repeat participants yet. Improvement trends appear when the same
              anonymous id completes this scenario more than once.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5 text-[#1e4a8c]" aria-hidden />
                  {improvement.repeatParticipantCount} repeat
                  {improvement.repeatParticipantCount === 1
                    ? " participant"
                    : " participants"}
                </span>
                <span>
                  {improvement.improvedCount} improved ·{" "}
                  {improvement.declinedCount} declined ·{" "}
                  {improvement.unchangedCount} unchanged
                </span>
                <span>
                  Avg change:{" "}
                  {improvement.averageDelta == null
                    ? "—"
                    : `${improvement.averageDelta > 0 ? "+" : ""}${improvement.averageDelta.toFixed(1)}★`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3 font-medium">Participant</th>
                      <th className="py-2 pr-3 font-medium">Attempts</th>
                      <th className="py-2 pr-3 font-medium">First</th>
                      <th className="py-2 pr-3 font-medium">Latest</th>
                      <th className="py-2 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {improvement.samples.map((sample) => (
                      <tr
                        key={sample.label}
                        className="border-b border-slate-50 text-slate-700"
                      >
                        <td className="py-2.5 pr-3">{sample.label}</td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {sample.attemptCount}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {sample.firstStars}★
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {sample.latestStars}★
                        </td>
                        <td className="py-2.5">
                          <DeltaBadge delta={sample.delta} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Top missed items
          </CardTitle>
          <CardDescription>
            Most frequently flagged gaps across attempts. Hazard titles are used
            when the evaluator linked a scenario hazard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 py-4">
          {topMissed.length === 0 ? (
            <p className="text-sm text-slate-500">
              No missed items recorded for this scenario yet.
            </p>
          ) : (
            topMissed.map((item) => (
              <div key={`${item.category}:${item.label}`} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={categoryBadgeClass(item.category)}
                  >
                    {item.category}
                  </Badge>
                  {item.highSeverityCount > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-red-600 bg-red-50 text-red-800"
                    >
                      {item.highSeverityCount} high
                    </Badge>
                  ) : null}
                </div>
                <HorizontalBar
                  label={item.label}
                  value={item.count}
                  max={maxMissed}
                  trailing={`${item.count}`}
                  barClassName="bg-slate-700"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ScenarioAnalytics({
  variant = "org",
}: {
  /** `site` shows org column + optional organization filter for Site Admins. */
  variant?: "org" | "site";
}) {
  const isSite = variant === "site";
  const [organizationId, setOrganizationId] = useState<string>("");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");

  const orgsQuery = api.siteAdmin.listOrganizations.useQuery(undefined, {
    enabled: isSite,
  });
  const overviewQuery = api.analytics.overview.useQuery(
    isSite && organizationId
      ? { organizationId }
      : isSite
        ? {}
        : undefined,
  );

  if (overviewQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading analytics…</p>;
  }

  if (overviewQuery.error) {
    return (
      <p className="text-sm text-destructive">
        Unable to load analytics. {overviewQuery.error.message}
      </p>
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return null;
  }

  const scenarios = overview.scenarios;
  const effectiveScenarioId =
    selectedScenarioId ||
    scenarios.find((scenario) => scenario.attemptCount > 0)?.id ||
    scenarios[0]?.id ||
    "";

  if (scenarios.length === 0) {
    return (
      <div className="space-y-4">
        {isSite ? (
          <OrgFilter
            organizationId={organizationId}
            onChange={(value) => {
              setOrganizationId(value);
              setSelectedScenarioId("");
            }}
            orgs={orgsQuery.data ?? []}
          />
        ) : null}
        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-slate-600">
              {isSite
                ? "No scenarios found for this filter."
                : "No scenarios in your organization yet."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Create a scenario and share a join code to start collecting results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSite ? (
        <OrgFilter
          organizationId={organizationId}
          onChange={(value) => {
            setOrganizationId(value);
            setSelectedScenarioId("");
          }}
          orgs={orgsQuery.data ?? []}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total attempts"
          value={String(overview.totals.attemptCount)}
          hint={isSite ? "Across visible scenarios" : "Across your scenarios"}
        />
        <StatCard
          label="Unique participants"
          value={String(overview.totals.uniqueParticipants)}
          hint="Anonymous aggregates only"
        />
        <StatCard
          label={isSite ? "Average score" : "Org average score"}
          value={formatStars(overview.totals.averageOverallStars)}
          hint="All completed assessments"
        />
      </div>

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Scenarios
          </CardTitle>
          <CardDescription>
            Select a scenario to view score distribution, improvement, and missed
            items. No names or contact details are shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="analytics-scenario">Scenario</Label>
            <select
              id="analytics-scenario"
              className="flex h-9 w-full max-w-xl rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs outline-none focus-visible:border-[#1e4a8c] focus-visible:ring-[3px] focus-visible:ring-[#1e4a8c]/20"
              value={effectiveScenarioId}
              onChange={(event) => setSelectedScenarioId(event.target.value)}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {isSite
                    ? `${scenario.organizationName} — ${scenario.title}`
                    : scenario.title}{" "}
                  ({scenario.attemptCount} attempt
                  {scenario.attemptCount === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  {isSite ? (
                    <th className="py-2 pr-3 font-medium">Organization</th>
                  ) : null}
                  <th className="py-2 pr-3 font-medium">Scenario</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Attempts</th>
                  <th className="py-2 pr-3 font-medium">Participants</th>
                  <th className="py-2 font-medium">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => {
                  const isSelected = scenario.id === effectiveScenarioId;
                  return (
                    <tr
                      key={scenario.id}
                      className={cn(
                        "cursor-pointer border-b border-slate-50 text-slate-700 transition-colors",
                        isSelected
                          ? "bg-[#1e4a8c]/5"
                          : "hover:bg-slate-50",
                      )}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      {isSite ? (
                        <td className="py-2.5 pr-3 text-slate-600">
                          {scenario.organizationName}
                        </td>
                      ) : null}
                      <td className="py-2.5 pr-3 font-medium text-slate-800">
                        {scenario.title}
                      </td>
                      <td className="py-2.5 pr-3">
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
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {scenario.attemptCount}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {scenario.uniqueParticipants}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {formatStars(scenario.averageOverallStars)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {effectiveScenarioId ? (
        <ScenarioDetail scenarioId={effectiveScenarioId} />
      ) : null}
    </div>
  );
}

function OrgFilter({
  organizationId,
  onChange,
  orgs,
}: {
  organizationId: string;
  onChange: (value: string) => void;
  orgs: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="analytics-org-filter">Organization filter</Label>
      <select
        id="analytics-org-filter"
        className="flex h-9 w-full max-w-xl rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs outline-none focus-visible:border-[#1e4a8c] focus-visible:ring-[3px] focus-visible:ring-[#1e4a8c]/20"
        value={organizationId}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All organizations</option>
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
