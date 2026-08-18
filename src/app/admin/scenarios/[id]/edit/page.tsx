import Link from "next/link";
import { notFound } from "next/navigation";

import { ScenarioBuilderForm } from "~/components/admin/ScenarioBuilderForm";
import { ScenarioShareLink } from "~/components/admin/ScenarioShareLink";
import { AppHeader } from "~/components/demo/AppHeader";
import { isSiteAdmin } from "~/lib/roles";
import { toAssignedPersonas, toScenarioFormValues } from "~/types/scenario";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

type EditScenarioPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditScenarioPage({
  params,
}: EditScenarioPageProps) {
  const { id } = await params;
  const session = await auth();

  let scenario;
  try {
    scenario = await api.scenario.getById({ id });
  } catch {
    notFound();
  }

  const isAdmin = isSiteAdmin(session?.user.role);
  const sameOrg =
    Boolean(session?.user.organizationId) &&
    scenario.organizationId === session?.user.organizationId;

  if (!session?.user || (!isAdmin && !sameOrg)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit scenario
          </h1>
          <p className="text-sm text-slate-600">
            Update scenario details, hazards, and personas.{" "}
            <Link
              href="/admin/scenarios"
              className="text-[#1e4a8c] hover:underline"
            >
              Back to scenarios
            </Link>
          </p>
        </div>

        <div className="mb-6">
          <ScenarioShareLink
            embedded
            scenarioId={scenario.id}
            scenarioTitle={scenario.title}
          />
        </div>

        <ScenarioBuilderForm
          mode="edit"
          scenarioId={scenario.id}
          organizationId={scenario.organizationId}
          initialValues={toScenarioFormValues(scenario)}
          initialPersonas={toAssignedPersonas(scenario)}
        />
      </main>
    </div>
  );
}
