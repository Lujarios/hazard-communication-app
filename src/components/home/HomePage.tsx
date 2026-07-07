import Link from "next/link";
import { ClipboardCheck, Mic, Users } from "lucide-react";

import { AppHeader } from "~/components/demo/AppHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type HomePageProps = {
  demoScenarioId: string;
};

const steps = [
  {
    icon: ClipboardCheck,
    title: "Review the scenario",
    description:
      "Study the jobsite image and instructions to understand the work environment and what you should address.",
  },
  {
    icon: Mic,
    title: "Record your safety talk",
    description:
      "Explain the hazards you see and the controls that should be in place, using speech or typed text.",
  },
  {
    icon: Users,
    title: "Get AI worker feedback",
    description:
      "AI worker personas listen to your talk and provide reactions, plus a rubric-based scorecard.",
  },
] as const;

export function HomePage({ demoScenarioId }: HomePageProps) {
  const sampleAssessmentPath = `/assessment/${demoScenarioId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Workplace safety training
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Practice hazard communication before the job starts
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
            SafeTalk helps trainees and supervisors practice pre-job hazard
            identification and communication. Review a workplace scenario,
            deliver a spoken safety talk, and receive structured feedback from
            AI worker personas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
            >
              <Link href={sampleAssessmentPath}>Try sample assessment</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin/scenarios">Manage scenarios</Link>
            </Button>
          </div>
        </section>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="gap-0 py-0 ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Icon className="size-4 text-[#1e4a8c]" aria-hidden />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <CardDescription className="text-sm leading-relaxed text-slate-600">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              For administrators
            </CardTitle>
            <CardDescription>
              Build custom workplace scenarios with reference photos, hazard
              answer keys, and selected AI listener personas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 py-4">
            <Button asChild variant="outline">
              <Link href="/admin/scenarios">View all scenarios</Link>
            </Button>
            <Button asChild className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90">
              <Link href="/admin/scenarios/new">Create new scenario</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
