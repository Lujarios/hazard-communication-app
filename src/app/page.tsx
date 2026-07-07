import { AssessmentExperience } from "~/components/demo/AssessmentExperience";
import { demoAssessmentScenario } from "~/lib/assessment-scenario";

export default function Home() {
  return (
    <AssessmentExperience
      scenario={demoAssessmentScenario}
      showTutorial
      showDemoHazardOverlays
    />
  );
}
