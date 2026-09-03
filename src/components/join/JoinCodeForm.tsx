"use client";

/**
 * Join-code form: validates the 6-character code and routes into the assessment.
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { JOIN_CODE_LENGTH, normalizeJoinCode } from "~/lib/join-code";
import { api } from "~/trpc/react";

type JoinCodeFormProps = {
  initialCode?: string;
};

export function JoinCodeForm({ initialCode = "" }: JoinCodeFormProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalized = normalizeJoinCode(code);
    if (normalized.length !== JOIN_CODE_LENGTH) {
      setError(`Enter a ${JOIN_CODE_LENGTH}-character join code`);
      return;
    }

    setIsSubmitting(true);
    try {
      const resolved = await utils.assessmentSession.resolveByCode.fetch({
        code: normalized,
      });
      router.push(
        `/assessment/${resolved.scenarioId}?session=${resolved.sessionId}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or expired join code";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="join-code" className="text-sm font-medium text-slate-700">
          Join code
        </label>
        <Input
          id="join-code"
          name="code"
          value={code}
          onChange={(event) => {
            setCode(
              normalizeJoinCode(event.target.value).slice(0, JOIN_CODE_LENGTH),
            );
            setError(null);
          }}
          placeholder="ABC123"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={JOIN_CODE_LENGTH}
          className="font-mono text-lg tracking-[0.2em] uppercase"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "join-code-error" : undefined}
        />
        {error ? (
          <p id="join-code-error" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Ask your trainer for the 6-character code for this session.
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Checking…" : "Join assessment"}
      </Button>
    </form>
  );
}
