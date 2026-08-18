import type { HazardLabel } from "~/lib/demo-data";
import type { PersonaCharacteristicFields } from "~/types/persona";

export type AssessmentPersona = {
  id: string;
  name: string;
  description: string;
  initials: string;
  avatarColor: string;
} & PersonaCharacteristicFields;

export type AssessmentScenario = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  personas: AssessmentPersona[];
  hazardLabels?: HazardLabel[];
};
