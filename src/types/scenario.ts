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
