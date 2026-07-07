import Link from "next/link";

import { ScenarioList } from "~/components/admin/ScenarioList";
import { AppHeader } from "~/components/demo/AppHeader";
import { Button } from "~/components/ui/button";

export default function AdminScenariosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
              Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Scenarios
            </h1>
            <p className="text-sm text-slate-600">
              View, edit, and share saved workplace safety scenarios.
            </p>
          </div>
          <Button asChild className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90">
            <Link href="/admin/scenarios/new">Create scenario</Link>
          </Button>
        </div>

        <ScenarioList />
      </main>
    </div>
  );
}
