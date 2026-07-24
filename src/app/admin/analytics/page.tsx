import { ScenarioAnalytics } from "~/components/admin/ScenarioAnalytics";
import { AppHeader } from "~/components/demo/AppHeader";

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Scenario analytics
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Anonymous performance across completed assessments in your
            organization — attempt counts, score trends, and commonly missed
            items. No trainee names or contact details are stored or shown.
          </p>
        </div>

        <ScenarioAnalytics />
      </main>
    </div>
  );
}
