import type { Game, Player, PublicGame, PublicPlayer } from "./types";

export function toPublicGame(game: Game): PublicGame {
  const publicGame: Partial<Game> = { ...game };
  delete publicGame.host_token;
  return publicGame as PublicGame;
}

export function toPublicPlayer(player: Player): PublicPlayer {
  const publicPlayer: Partial<Player> = { ...player };
  delete publicPlayer.player_token;
  return publicPlayer as PublicPlayer;
}
