"use client";

import { useEffect, useState } from "react";

/** Fetches the end-of-game "what we learned about Katrine" recap once the game is finished. */
export function useKatrineRecap(code: string | null, active: boolean): string | null {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !active) return;
    let cancelled = false;

    fetch(`/api/games/${code}/recap`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.message) setMessage(json.message);
      })
      .catch(() => {
        /* the finale screen works fine without the recap */
      });

    return () => {
      cancelled = true;
    };
  }, [code, active]);

  return message;
}
