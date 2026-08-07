export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target time has passed. */
  isPast: boolean;
}

/** Pure function: breaks the time between `nowMs` and `targetIso` into parts. */
export function getCountdownParts(targetIso: string, nowMs: number): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const totalMs = targetMs - nowMs;

  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast: false };
}

/** Formats countdown parts as a short Danish string, e.g. "1 dag 3 t 12 min". */
export function formatCountdown(parts: CountdownParts): string {
  if (parts.isPast) return "Starter snart!";

  const segments: string[] = [];
  if (parts.days > 0) segments.push(`${parts.days} ${parts.days === 1 ? "dag" : "dage"}`);
  if (parts.days > 0 || parts.hours > 0) segments.push(`${parts.hours} t`);
  segments.push(`${parts.minutes} min`);
  if (parts.days === 0 && parts.hours === 0) segments.push(`${parts.seconds} sek`);

  return segments.join(" ");
}
