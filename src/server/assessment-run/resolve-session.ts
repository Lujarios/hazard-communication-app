/**
 * Confirm a join-session id belongs to the given scenario (used when persisting attempts).
 */
import { and, eq } from "drizzle-orm";

import { assessmentSessions } from "~/server/db/schema";
import type { db } from "~/server/db";

export async function resolveAssessmentSession(
  database: typeof db,
  scenarioId: string,
  assessmentSessionId: string | undefined,
): Promise<{ id: string; joinCode: string } | null> {
  if (!assessmentSessionId) {
    return null;
  }

  const session = await database.query.assessmentSessions.findFirst({
    where: and(
      eq(assessmentSessions.id, assessmentSessionId),
      eq(assessmentSessions.scenarioId, scenarioId),
    ),
    columns: { id: true, joinCode: true },
  });

  return session ?? null;
}
