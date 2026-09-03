import { HomePage } from "~/components/home/HomePage";
import { ensureConstructionSiteDemoSeeded } from "~/server/db/seed-construction-demo";

/** Landing page. Seeds the construction demo (orgs, personas, scenario) if missing. */
export default async function Home() {
  const demoScenarioId = await ensureConstructionSiteDemoSeeded();

  return <HomePage demoScenarioId={demoScenarioId} />;
}
