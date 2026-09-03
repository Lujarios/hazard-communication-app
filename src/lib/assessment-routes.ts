export function assessmentPath(
  scenarioId: string,
  options?: { sessionId?: string; startNew?: boolean },
): string {
  const params = new URLSearchParams();
  if (options?.sessionId) {
    params.set("session", options.sessionId);
  }
  if (options?.startNew) {
    params.set("new", "1");
  }

  const query = params.toString();
  return query
    ? `/assessment/${scenarioId}?${query}`
    : `/assessment/${scenarioId}`;
}

export function assessmentCompletePath(
  scenarioId: string,
  runId: string,
  sessionId?: string,
): string {
  const params = new URLSearchParams();
  params.set("run", runId);
  if (sessionId) {
    params.set("session", sessionId);
  }

  return `/assessment/${scenarioId}/complete?${params.toString()}`;
}
