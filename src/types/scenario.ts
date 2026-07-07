export type ScenarioStatus = "draft" | "ready";

export type HazardFormEntry = {
  hazardTitle: string;
  hazardDescription: string;
  controlDescription: string;
  locationNote: string;
};

export type ScenarioFormValues = {
  title: string;
  description: string;
  imageFileName: string;
  status: ScenarioStatus;
  hazards: HazardFormEntry[];
  personaIds: string[];
};

export const emptyHazardEntry = (): HazardFormEntry => ({
  hazardTitle: "",
  hazardDescription: "",
  controlDescription: "",
  locationNote: "",
});

export const initialScenarioFormValues = (): ScenarioFormValues => ({
  title: "",
  description: "",
  imageFileName: "",
  status: "ready",
  hazards: [emptyHazardEntry()],
  personaIds: [],
});

type DbScenarioForForm = {
  title: string;
  description: string;
  imageFileName: string;
  status: string;
  hazards: Array<{
    hazardTitle: string;
    hazardDescription: string;
    controlDescription: string;
    locationNote: string | null;
  }>;
  scenarioPersonas: Array<
    { personaId: string } | { persona: { id: string } }
  >;
};

export function toScenarioFormValues(
  scenario: DbScenarioForForm,
): ScenarioFormValues {
  return {
    title: scenario.title,
    description: scenario.description,
    imageFileName: scenario.imageFileName,
    status: scenario.status === "draft" ? "draft" : "ready",
    hazards:
      scenario.hazards.length > 0
        ? scenario.hazards.map((hazard) => ({
            hazardTitle: hazard.hazardTitle,
            hazardDescription: hazard.hazardDescription,
            controlDescription: hazard.controlDescription,
            locationNote: hazard.locationNote ?? "",
          }))
        : [emptyHazardEntry()],
    personaIds: scenario.scenarioPersonas.map((entry) =>
      "personaId" in entry ? entry.personaId : entry.persona.id,
    ),
  };
}
