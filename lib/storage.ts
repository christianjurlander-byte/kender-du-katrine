const PLAYER_KEY_PREFIX = "kdk_player_";
const HOST_KEY_PREFIX = "kdk_host_";

export interface StoredPlayer {
  playerToken: string;
  name: string;
}

export function savePlayerSession(code: string, session: StoredPlayer) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYER_KEY_PREFIX + code, JSON.stringify(session));
}

export function getPlayerSession(code: string): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PLAYER_KEY_PREFIX + code);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPlayer;
  } catch {
    return null;
  }
}

export function clearPlayerSession(code: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAYER_KEY_PREFIX + code);
}

export function saveHostToken(code: string, hostToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOST_KEY_PREFIX + code, hostToken);
}

export function getHostToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(HOST_KEY_PREFIX + code);
}
