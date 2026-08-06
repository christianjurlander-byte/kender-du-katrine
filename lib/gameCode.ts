/** Generates a random 4-digit game code, e.g. "0483". */
export function generateGameCode(): string {
  const n = Math.floor(Math.random() * 10000);
  return n.toString().padStart(4, "0");
}

/** Normalizes user-typed codes: trims whitespace, keeps digits only. */
export function normalizeGameCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 4);
}

export function isValidGameCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}
