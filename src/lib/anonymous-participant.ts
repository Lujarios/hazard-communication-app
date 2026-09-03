const STORAGE_KEY = "safetalk.anonymousParticipantId";

/**
 * Stable anonymous trainee id for analytics (no name, role, or other PII).
 * Persisted in localStorage so assessment stages for the same participant can be linked.
 */
export function getOrCreateAnonymousParticipantId(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (existing && isUuid(existing)) {
      return existing;
    }

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Private browsing / blocked storage — still evaluate; attempts may not link.
    return crypto.randomUUID();
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
