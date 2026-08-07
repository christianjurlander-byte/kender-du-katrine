"use client";

import { useEffect, useState } from "react";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useLobbyVibe(code: string | null, active: boolean): string | null {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !active) return;
    let cancelled = false;

    function refresh() {
      fetch(`/api/games/${code}/vibe`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!cancelled && json?.message) setMessage(json.message);
        })
        .catch(() => {
          /* keep showing the previous message rather than clearing it */
        });
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code, active]);

  return message;
}
