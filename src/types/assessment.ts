export type AssessmentPersona = {
  id: string;
  name: string;
  description: string;
  initials: string;
  avatarColor: string;
};

export type AssessmentScenario = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  personas: AssessmentPersona[];
};
