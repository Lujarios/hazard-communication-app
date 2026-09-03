"use client";

import { skipToken } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Shield,
} from "lucide-react";

import { AppHeader } from "~/components/demo/AppHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getOrCreateAnonymousParticipantId } from "~/lib/anonymous-participant";
import {
  assessmentCompletePath,
  assessmentPath,
} from "~/lib/assessment-routes";
import { getStoredAssessmentRunId, storeAssessmentRunId } from "~/lib/assessment-run-storage";
import { api } from "~/trpc/react";
import type { AssessmentScenario } from "~/types/assessment";

type AssessmentCompleteProps = {
  scenario: AssessmentScenario;
  runId?: string;
  assessmentSessionId?: string;
};

export function AssessmentComplete({
  scenario,
  runId,
  assessmentSessionId,
}: AssessmentCompleteProps) {
  const router = useRouter();
  const [participantId] = useState(() => getOrCreateAnonymousParticipantId());
  const resolvedRunId = useMemo(
    () => runId ?? getStoredAssessmentRunId(scenario.id),
    [runId, scenario.id],
  );

  const completionQuery = api.assessmentRun.getCompletion.useQuery(
    resolvedRunId
      ? {
          runId: resolvedRunId,
          scenarioId: scenario.id,
          anonymousParticipantId: participantId,
        }
      : skipToken,
    { retry: false },
  );

  useEffect(() => {
    if (!resolvedRunId) {
      router.replace(assessmentPath(scenario.id, { sessionId: assessmentSessionId }));
    }
  }, [assessmentSessionId, resolvedRunId, router, scenario.id]);

  useEffect(() => {
    if (completionQuery.data?.snapshot.runId) {
      storeAssessmentRunId(scenario.id, completionQuery.data.snapshot.runId);
    }
  }, [completionQuery.data?.snapshot.runId, scenario.id]);

  useEffect(() => {
    const code = completionQuery.error?.data?.code;
    if (code === "BAD_REQUEST") {
      router.replace(assessmentPath(scenario.id, { sessionId: assessmentSessionId }));
    }
  }, [assessmentSessionId, completionQuery.error, router, scenario.id]);

  useEffect(() => {
    if (!runId && resolvedRunId) {
      router.replace(
        assessmentCompletePath(scenario.id, resolvedRunId, assessmentSessionId),
      );
    }
  }, [assessmentSessionId, resolvedRunId, router, runId, scenario.id]);

  const errorCode = completionQuery.error?.data?.code;
  const unavailable =
    errorCode === "FORBIDDEN" || errorCode === "NOT_FOUND";
  const summary = completionQuery.data?.summary;
  const snapshot = completionQuery.data?.snapshot;
  const submittedAt = snapshot?.completedAt
    ? new Date(snapshot.completedAt).toLocaleString()
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        {unavailable ? (
          <UnavailableState scenarioId={scenario.id} sessionId={assessmentSessionId} />
        ) : !resolvedRunId || completionQuery.isLoading ? (
          <LoadingState />
        ) : completionQuery.error && errorCode !== "BAD_REQUEST" ? (
          <UnavailableState scenarioId={scenario.id} sessionId={assessmentSessionId} />
        ) : summary ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-emerald-200 bg-white px-6 py-8 text-center ring-1 ring-emerald-100">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-8" aria-hidden />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Assessment submitted
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Thank you for completing the assessment
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Your response for{" "}
                <span className="font-medium text-slate-800">{scenario.title}</span>{" "}
                was submitted successfully. This assessment session has ended,
                and no further recording or replies can be added to this attempt.
              </p>
              {submittedAt ? (
                <p className="mt-3 text-xs text-slate-500">Submitted {submittedAt}</p>
              ) : null}
            </section>

            <Card className="gap-0 py-0 ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Session status
                </CardTitle>
                <CardDescription>
                  This attempt is closed. Refreshing this page will return you
                  here, not to the recording workflow.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
                <StatusItem
                  icon={ClipboardCheck}
                  title="Submitted"
                  body={summary.completionStageLabel}
                />
                <StatusItem
                  icon={Lock}
                  title="Interaction ended"
                  body={
                    summary.clarificationRoundsUsed === 0
                      ? "You finished after the initial safety talk."
                      : `You used ${summary.clarificationRoundsUsed} clarification ${
                          summary.clarificationRoundsUsed === 1 ? "round" : "rounds"
                        }.`
                  }
                />
                <StatusItem
                  icon={Shield}
                  title="Privacy"
                  body="Stored without your name or contact details."
                />
              </CardContent>
            </Card>

            {summary.finishedEarly ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
                You chose to finish without answering remaining worker questions.
                Your latest submitted response is the final record for this attempt.
              </p>
            ) : null}

            {summary.reachedRoundLimit ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
                You reached the maximum number of clarification rounds, so this
                attempt was closed automatically.
              </p>
            ) : null}

            {summary.strengths.length > 0 || summary.improvedAreas.length > 0 ? (
              <Card className="gap-0 py-0 ring-1 ring-slate-200">
                <CardHeader className="border-b border-slate-100 py-4">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Brief recap
                  </CardTitle>
                  <CardDescription>
                    A short close-out of this attempt, not a full evaluation
                    report.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 py-4">
                  {summary.overallStars && summary.clarificationRoundsUsed > 0 ? (
                    <p className="text-sm text-slate-600">
                      Overall communication rating:{" "}
                      <span className="font-medium text-slate-800">
                        {summary.overallStars.initial} to{" "}
                        {summary.overallStars.final} stars
                      </span>
                      {summary.overallStars.delta > 0 ? " after clarification." : "."}
                    </p>
                  ) : null}

                  {summary.strengths.length > 0 ? (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Communication strengths
                      </h2>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {summary.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {summary.improvedAreas.length > 0 ? (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Areas improved through clarification
                      </h2>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {summary.improvedAreas.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="gap-0 py-0 ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  How this assessment is stored
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-4 text-sm leading-relaxed text-slate-600">
                <p>
                  You did not sign in, and this tool does not collect your name,
                  email, or other contact details.
                </p>
                <p>
                  Your responses are linked only to an internal session
                  identifier for this browser, not to a personal account. That
                  lets researchers review how the assessment progressed without
                  knowing who you are.
                </p>
                <p>
                  Anything you said or typed is stored as part of the assessment
                  record. If you used a join code, that code is stored with the
                  attempt as well.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="bg-[#1e4a8c] hover:bg-[#163a6e]">
                <Link href="/">Return home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={assessmentPath(scenario.id, {
                    sessionId: assessmentSessionId,
                    startNew: true,
                  })}
                >
                  Start a new assessment
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof CheckCircle2;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-2 text-[#1e4a8c]">
        <Icon className="size-4" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center ring-1 ring-slate-100">
        <p className="text-sm text-slate-600" role="status">
          Loading your completion summary…
        </p>
      </div>
    </div>
  );
}

function UnavailableState({
  scenarioId,
  sessionId,
}: {
  scenarioId: string;
  sessionId?: string;
}) {
  return (
    <Card className="gap-0 py-0 ring-1 ring-slate-200">
      <CardHeader className="border-b border-slate-100 py-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          This completion page is not available
        </CardTitle>
        <CardDescription>
          The completed assessment could not be opened from this browser
          session. You can return to the scenario if you need to start a new
          attempt.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 py-4">
        <Button asChild className="bg-[#1e4a8c] hover:bg-[#163a6e]">
          <Link href={assessmentPath(scenarioId, { sessionId, startNew: true })}>
            Start a new assessment
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
