"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchGameState, type GameStateResponse } from "@/lib/gameState";

interface UseGameRealtimeResult {
  state: GameStateResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Loads a game's public state and keeps it live: whenever games, players or
 * answer receipts change in Supabase, the full state is refetched from our
 * API route (which is what enforces "don't reveal answers early").
 */
export function useGameRealtime(code: string | null): UseGameRealtimeResult {
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const pendingRefetch = useRef(false);

  const refetch = useCallback(() => {
    if (!code) return;

    async function run(gameCode: string): Promise<void> {
      if (inFlight.current) {
        pendingRefetch.current = true;
        return;
      }
      inFlight.current = true;
      try {
        const data = await fetchGameState(gameCode);
        setState(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Noget gik galt.");
      } finally {
        setLoading(false);
        inFlight.current = false;
        if (pendingRefetch.current) {
          pendingRefetch.current = false;
          run(gameCode);
        }
      }
    }

    run(code);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refetch();

    const channel = supabase
      .channel(`game-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refetch)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answer_receipts" },
        refetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return { state, loading, error, refetch };
}
