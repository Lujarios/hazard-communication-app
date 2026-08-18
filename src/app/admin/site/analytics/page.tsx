import Link from "next/link";

import { ScenarioAnalytics } from "~/components/admin/ScenarioAnalytics";
import { AppHeader } from "~/components/demo/AppHeader";
import { requireSiteAdmin } from "~/server/auth/require-site-admin";

export default async function SiteAnalyticsPage() {
  await requireSiteAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Site Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Global analytics
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Anonymous performance across all organizations — filter by company,
            review attempt counts, score trends, and commonly missed items.{" "}
            <Link href="/admin/site" className="text-[#1e4a8c] hover:underline">
              Back to Site Admin
            </Link>
          </p>
        </div>

        <ScenarioAnalytics variant="site" />
      </main>
    </div>
  );
}
