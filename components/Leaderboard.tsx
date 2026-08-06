import type { PublicPlayer } from "@/lib/types";

interface LeaderboardProps {
  players: PublicPlayer[];
  highlightPlayerId?: string | null;
}

export function Leaderboard({ players, highlightPlayerId }: LeaderboardProps) {
  const sorted = [...players]
    .filter((p) => !p.is_katrine)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((player, i) => (
        <div
          key={player.id}
          className="card flex items-center justify-between !p-3"
          style={
            player.id === highlightPlayerId
              ? { borderColor: "var(--party-purple)", borderWidth: 2 }
              : undefined
          }
        >
          <div className="flex items-center gap-3">
            <span className="w-7 text-center font-bold" style={{ color: "var(--muted)" }}>
              {i + 1}
            </span>
            <span className="font-semibold">{player.name}</span>
            {!player.connected && (
              <span className="badge" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                offline
              </span>
            )}
          </div>
          <span className="font-extrabold text-lg">{player.score}</span>
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
