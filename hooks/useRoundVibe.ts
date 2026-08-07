"use client";

import { useEffect, useState } from "react";

/**
 * Fetches one AI (or fallback) commentary line per revealed round, keyed by
 * questionId so a new round always gets a fresh fetch instead of briefly
 * showing the previous round's message.
 */
export function useRoundVibe(
  code: string | null,
  questionId: string | null | undefined,
  active: boolean
): string | null {
  const [lastQuestionId, setLastQuestionId] = useState<string | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);

  // Reset to the render-phase pattern (not an effect) so a new round never
  // briefly shows the previous round's leftover commentary.
  if (lastQuestionId !== questionId) {
    setLastQuestionId(questionId);
    setMessage(null);
  }

  useEffect(() => {
    if (!code || !active || !questionId) return;
    let cancelled = false;

    fetch(`/api/games/${code}/round-vibe`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.message) setMessage(json.message);
      })
      .catch(() => {
        /* the reveal screen works fine without a commentary line */
      });

    return () => {
      cancelled = true;
    };
  }, [code, questionId, active]);

  return message;
}
