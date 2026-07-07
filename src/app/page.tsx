import { HomePage } from "~/components/home/HomePage";
import { ensureConstructionSiteDemoSeeded } from "~/server/db/seed-construction-demo";

export default async function Home() {
  const demoScenarioId = await ensureConstructionSiteDemoSeeded();

  return <HomePage demoScenarioId={demoScenarioId} />;
}
