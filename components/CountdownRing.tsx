"use client";

import { useEffect, useState } from "react";

interface CountdownRingProps {
  startedAt: string | null;
  /** Seconds before the ring appears — gives people time to read the question first. */
  graceSeconds?: number;
  /** Total seconds the ring counts down over, once it appears. */
  durationSeconds?: number;
}

/**
 * A purely visual countdown — it never closes the question itself, the
 * host always does that manually. It's just a bit of festive pressure.
 */
export function CountdownRing({
  startedAt,
  graceSeconds = 4,
  durationSeconds = 20,
}: CountdownRingProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, []);

  if (!startedAt) return null;

  const elapsedSeconds = (now - new Date(startedAt).getTime()) / 1000;
  if (elapsedSeconds < graceSeconds) return null;

  const countdownElapsed = elapsedSeconds - graceSeconds;
  const remaining = Math.max(0, durationSeconds - countdownElapsed);
  const fraction = Math.min(1, countdownElapsed / durationSeconds);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * fraction;
  const isLow = remaining <= 5;

  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle
          cx={26}
          cy={26}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={4}
        />
        <circle
          cx={26}
          cy={26}
          r={radius}
          fill="none"
          stroke={isLow ? "#ef4444" : "var(--party-purple)"}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
        <text
          x="26"
          y="30"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill={isLow ? "#ef4444" : "var(--foreground)"}
        >
          {Math.ceil(remaining)}
        </text>
      </svg>
    </div>
  );
}
