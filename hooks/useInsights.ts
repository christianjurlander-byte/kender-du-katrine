"use client";

import { useEffect, useState } from "react";
import type { Award } from "@/lib/types";
import type { PlayerInsight } from "@/lib/insights";

interface InsightsResponse {
  insights: PlayerInsight[];
  awards: Award[] | null;
}

/**
 * Fetches streaks/awards and refetches whenever `refreshKey` changes
 * (pass something that changes exactly when a new round is revealed,
 * e.g. `${questionState}-${currentQuestionIndex}-${gameStatus}`).
 */
export function useInsights(code: string | null, refreshKey: string): InsightsResponse {
  const [data, setData] = useState<InsightsResponse>({ insights: [], awards: null });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetch(`/api/games/${code}/insights`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { insights: [], awards: null }))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ insights: [], awards: null });
      });
    return () => {
      cancelled = true;
    };
  }, [code, refreshKey]);

  return data;
}
