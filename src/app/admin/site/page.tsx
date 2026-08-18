import Link from "next/link";
import { Building2, ChartColumn, Users } from "lucide-react";

import { AppHeader } from "~/components/demo/AppHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { requireSiteAdmin } from "~/server/auth/require-site-admin";

const links = [
  {
    href: "/admin/site/users",
    title: "Users",
    description:
      "Create and update manager and Site Admin accounts across organizations.",
    icon: Users,
  },
  {
    href: "/admin/site/organizations",
    title: "Organizations",
    description: "Create companies and rename existing organizations.",
    icon: Building2,
  },
  {
    href: "/admin/site/analytics",
    title: "Global analytics",
    description:
      "View anonymous assessment results across every organization.",
    icon: ChartColumn,
  },
] as const;

export default async function SiteAdminHubPage() {
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
            Platform management
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Manage organizations, user accounts, and review assessment data
            across the whole SafeTalk platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {links.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="gap-0 py-0 ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Icon className="size-4 text-[#1e4a8c]" aria-hidden />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <CardDescription className="text-sm leading-relaxed text-slate-600">
                  {description}
                </CardDescription>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-300"
                >
                  <Link href={href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
