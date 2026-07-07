/** Example filenames for local development in /public/scenarios/ */
export const SAMPLE_SCENARIO_IMAGE_FILENAMES = [
  "construction-site-demo.png",
] as const;

export function getScenarioImagePath(imageFileName: string) {
  return `/scenarios/${imageFileName.trim()}`;
}
