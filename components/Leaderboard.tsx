import type { PublicPlayer } from "@/lib/types";

interface LeaderboardProps {
  players: PublicPlayer[];
  highlightPlayerId?: string | null;
  /** Splits the list into 2 compact columns, handy on the shared screen with many players. */
  columns?: 1 | 2;
}

export function Leaderboard({ players, highlightPlayerId, columns = 1 }: LeaderboardProps) {
  const sorted = [...players]
    .filter((p) => !p.is_katrine)
    .sort((a, b) => b.score - a.score);
  const compact = columns === 2;

  return (
    <div className={compact ? "grid grid-cols-2 gap-1.5 w-full" : "flex flex-col gap-2 w-full"}>
      {sorted.map((player, i) => (
        <div
          key={player.id}
          className={`card flex items-center justify-between ${compact ? "!p-2" : "!p-3"}`}
          style={
            player.id === highlightPlayerId
              ? { borderColor: "var(--party-purple)", borderWidth: 2 }
              : undefined
          }
        >
          <div className={`flex items-center ${compact ? "gap-1.5 min-w-0" : "gap-3"}`}>
            <span
              className={`text-center font-bold shrink-0 ${compact ? "w-4 text-xs" : "w-7"}`}
              style={{ color: "var(--muted)" }}
            >
              {i + 1}
            </span>
            {player.avatar && (
              <span aria-hidden className="shrink-0">
                {player.avatar}
              </span>
            )}
            <span className={`font-semibold truncate ${compact ? "text-sm" : ""}`}>{player.name}</span>
            {!player.connected && (
              <span className="badge shrink-0" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                offline
              </span>
            )}
          </div>
          <span className={`font-extrabold shrink-0 ${compact ? "text-sm pl-1" : "text-lg"}`}>
            {player.score}
          </span>
        </div>
      ))}
      {sorted.length === 0 && (
        <p className="text-center" style={{ color: "var(--muted)" }}>
          Ingen spillere endnu.
        </p>
      )}
    </div>
  );
}
