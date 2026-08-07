"use client";

import { useEffect, useState } from "react";
import { formatCountdown, getCountdownParts } from "@/lib/countdown";

interface LobbyCountdownProps {
  targetIso: string;
  big?: boolean;
}

export function LobbyCountdown({ targetIso, big }: LobbyCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const parts = getCountdownParts(targetIso, now);

  return (
    <div className="text-center">
      <p className="text-sm font-bold mb-1" style={{ color: "var(--muted)" }}>
        {parts.isPast ? "Quizzen begynder om lidt..." : "Quizzen starter om"}
      </p>
      <p
        className="font-black"
        style={{
          fontSize: big ? "2.5rem" : "1.5rem",
          background: "linear-gradient(135deg, var(--party-purple), var(--party-pink))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {formatCountdown(parts)}
      </p>
    </div>
  );
}
