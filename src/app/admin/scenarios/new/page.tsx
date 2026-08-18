import Link from "next/link";

import { ScenarioBuilderForm } from "~/components/admin/ScenarioBuilderForm";
import { AppHeader } from "~/components/demo/AppHeader";
import { auth } from "~/server/auth";

export default async function NewScenarioPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create scenario
          </h1>
          <p className="text-sm text-slate-600">
            Build a workplace safety scenario with hazards, controls, and AI
            listener personas.{" "}
            <Link href="/admin/scenarios" className="text-[#1e4a8c] hover:underline">
              View all scenarios
            </Link>
          </p>
        </div>

        <ScenarioBuilderForm
          organizationId={session?.user.organizationId}
        />
      </main>
    </div>
  );
}
