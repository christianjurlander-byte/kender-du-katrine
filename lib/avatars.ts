/** A curated, party-friendly set of emoji players can pick as their avatar. */
export const AVATAR_OPTIONS = [
  "😎", "🥳", "🤩", "😂", "🤪", "🙈", "😜", "🤓",
  "👻", "🤡", "👽", "🦄", "🐸", "🐵", "🦊", "🐼",
  "🐯", "🦁", "🐶", "🐱", "🐨", "🐷", "🐔", "🦩",
  "🐢", "🦖", "🐙", "🦈", "🍕", "🍩", "🍦", "🌮",
  "🍔", "🍿", "🥑", "🎉", "🔥", "⭐", "👑", "🚀",
] as const;

export function isValidAvatar(value: unknown): value is string {
  return typeof value === "string" && (AVATAR_OPTIONS as readonly string[]).includes(value);
}
