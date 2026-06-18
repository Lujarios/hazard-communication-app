/** Current phase of the help walkthrough. */
export type TutorialPhase = "closed" | "intro" | "spotlight";

/** Stable `data-tour` attribute values for spotlight targets. */
export type TourTargetId =
  | "scenario"
  | "transcription"
  | "personas"
  | "scorecard";

export const TOUR_TARGET_IDS = [
  "scenario",
  "transcription",
  "personas",
  "scorecard",
] as const satisfies readonly TourTargetId[];

/** Which code-based infographic to render on an intro slide. */
export type IntroSlideVisual = "welcome" | "goal" | "flow" | "ready";

export type IntroSlide = {
  id: string;
  title: string;
  body: string;
  /** Drives the lucide + Tailwind infographic in the intro modal. */
  visual: IntroSlideVisual;
};

export type SpotlightStep = {
  id: string;
  title: string;
  body: string;
  target: TourTargetId;
  /** Interactive how-to copy shown below the summary. */
  howToUse?: string;
};

export type TutorialStep = IntroSlide | SpotlightStep;

export function isIntroSlide(step: TutorialStep): step is IntroSlide {
  return "visual" in step;
}

export function isSpotlightStep(step: TutorialStep): step is SpotlightStep {
  return "target" in step;
}

export type TutorialState = {
  phase: TutorialPhase;
  introIndex: number;
  spotlightIndex: number;
};

export const initialTutorialState: TutorialState = {
  phase: "closed",
  introIndex: 0,
  spotlightIndex: 0,
};
