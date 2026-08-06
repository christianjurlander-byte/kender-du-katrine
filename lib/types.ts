export type GameStatus = "lobby" | "active" | "finished";
export type QuestionState = "idle" | "answering" | "revealed";

export interface Game {
  id: string;
  code: string;
  status: GameStatus;
  question_state: QuestionState;
  current_question_index: number;
  katrine_player_id: string | null;
  host_token: string;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  is_katrine: boolean;
  score: number;
  connected: boolean;
  player_token: string;
  created_at: string;
}

export interface Question {
  id: string;
  game_id: string;
  index: number;
  text: string;
  options: string[];
}

export interface Answer {
  id: string;
  question_id: string;
  player_id: string;
  option_index: number;
  created_at: string;
}

// Public-safe versions (no secret tokens) sent to browser clients.
export type PublicGame = Omit<Game, "host_token">;
export type PublicPlayer = Omit<Player, "player_token">;

export interface RoundResult {
  questionId: string;
  correctOptionIndex: number | null;
  distribution: number[]; // count of answers per option index
  totalAnswers: number;
  pointsAwarded: Record<string, number>; // playerId -> points gained this round
  katrinePlayerId: string | null;
}
