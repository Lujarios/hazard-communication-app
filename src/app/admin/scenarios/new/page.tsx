import Link from "next/link";

import { ScenarioBuilderForm } from "~/components/admin/ScenarioBuilderForm";
import { AppHeader } from "~/components/demo/AppHeader";

export default function NewScenarioPage() {
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
            <Link href="/" className="text-[#1e4a8c] hover:underline">
              Back to assessment demo
            </Link>
          </p>
        </div>

        <ScenarioBuilderForm />
      </main>
    </div>
  );
}
