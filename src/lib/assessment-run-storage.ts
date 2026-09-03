/**
 * Persist the current assessment run id in localStorage so a trainee can
 * resume the same conversation after a refresh.
 */
const runStorageKey = (scenarioId: string) =>
  `safetalk.assessmentRun.${scenarioId}`;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function getStoredAssessmentRunId(scenarioId: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const value = window.localStorage.getItem(runStorageKey(scenarioId))?.trim();
    return value && isUuid(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function storeAssessmentRunId(scenarioId: string, runId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(runStorageKey(scenarioId), runId);
  } catch {
    // Private browsing / blocked storage — resume still works via participant id.
  }
}

export function clearStoredAssessmentRunId(scenarioId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(runStorageKey(scenarioId));
  } catch {
    // Ignore storage failures.
  }
}

const justCompletedKey = (runId: string) => `safetalk.justCompleted.${runId}`;

/** Marks a run so the thank-you page can show immediately after submit. */
export function markAssessmentJustCompleted(runId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(justCompletedKey(runId), "1");
  } catch {
    // Private browsing / blocked storage — thank-you page may be skipped.
  }
}

export function wasAssessmentJustCompleted(runId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(justCompletedKey(runId)) === "1";
  } catch {
    return false;
  }
}

export function clearAssessmentJustCompleted(runId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(justCompletedKey(runId));
  } catch {
    // Ignore storage failures.
  }
}
