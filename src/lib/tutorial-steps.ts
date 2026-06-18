import type { IntroSlide, SpotlightStep } from "~/types/tutorial";

export const INTRO_SLIDES: IntroSlide[] = [
  {
    id: "welcome",
    title: "Welcome to SafeTalk",
    body: "SafeTalk is a workplace hazard communication assessment tool. Practice how you would explain jobsite hazards and controls to your crew as a project manager or supervisor.",
    visual: "welcome",
  },
  {
    id: "goal",
    title: "Your goal",
    body: "Review the construction scenario, identify what could hurt someone, explain the controls that keep workers safe, and communicate clearly so everyone understands.",
    visual: "goal",
  },
  {
    id: "flow",
    title: "How the assessment works",
    body: "Study the scenario, record or type your safety talk, get reactions from AI worker listeners, then review a star-rated scorecard with specific feedback on what you missed.",
    visual: "flow",
  },
  {
    id: "ready",
    title: "Ready to begin?",
    body: "You can take a quick tour of each section on this page, or close this guide and explore on your own. You can reopen Help anytime from the header.",
    visual: "ready",
  },
];

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    id: "scenario",
    title: "Construction scenario",
    body: "This is your jobsite view. Colored labels mark hazards on the image — red for high severity, orange for medium, and violet for informational items.",
    target: "scenario",
    howToUse:
      "Scan every label before you speak. Note what could cause harm and what controls or procedures workers should follow.",
  },
  {
    id: "transcription",
    title: "Live transcription",
    body: "Record your hazard explanation here. Your words appear in the transcript as you speak, or you can type directly if your microphone is unavailable.",
    target: "transcription",
    howToUse:
      "Click Start Talking to record, Stop when finished, then click Get Feedback to send your transcript for evaluation.",
  },
  {
    id: "personas",
    title: "AI worker listeners",
    body: "Five AI worker personas stand in for your crew — experienced workers, new hires, and teammates with different communication needs.",
    target: "personas",
    howToUse:
      "While you talk they show as listening. After you request feedback, each persona reacts to whether your message was clear to them.",
  },
  {
    id: "scorecard",
    title: "Safety talk scorecard",
    body: "Your feedback appears here: an overall summary, star ratings against safety rubrics, and a list of hazards, controls, or communication gaps you missed.",
    target: "scorecard",
    howToUse:
      "Review missed items and lower-scored criteria, then try another take if you want to improve your score.",
  },
];
