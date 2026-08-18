import { redirect } from "next/navigation";

import { isSiteAdmin } from "~/lib/roles";
import { auth } from "~/server/auth";

/** Server-side gate for `/admin/site/**` pages. */
export async function requireSiteAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/site");
  }

  if (!isSiteAdmin(session.user.role)) {
    redirect("/admin/scenarios");
  }

  return session;
}
