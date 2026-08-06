"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { getPlayerSession, clearPlayerSession, type StoredPlayer } from "@/lib/storage";
import { AnswerOptions } from "@/components/AnswerOptions";
import { DistributionChart } from "@/components/DistributionChart";
import { Leaderboard } from "@/components/Leaderboard";
import { PlayerList } from "@/components/PlayerList";
import { ErrorBanner, GameCodeBadge, Spinner } from "@/components/Misc";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();

  const [session, setSession] = useState<StoredPlayer | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null | undefined>(undefined);

  const { state, loading, error } = useGameRealtime(code);

  // Reset local answer state whenever the current question changes, using
  // the React-recommended "adjust state while rendering" pattern instead of
  // an effect (avoids an extra render + flash of the previous question's pick).
  const currentQuestionId = state?.currentQuestion?.id ?? null;
  if (answeredQuestionId !== currentQuestionId) {
    setAnsweredQuestionId(currentQuestionId);
    setSelectedOption(null);
    setAnswered(false);
    setActionError(null);
  }

  useEffect(() => {
    const stored = getPlayerSession(code);
    if (!stored) {
      router.replace(`/join?code=${code}`);
      return;
    }

    fetch(`/api/games/${code}/reconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerToken: stored.playerToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setSession(stored);
      })
      .catch(() => {
        clearPlayerSession(code);
        router.replace(`/join?code=${code}`);
      })
      .finally(() => setCheckingSession(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (checkingSession || loading || !state) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {error ? <ErrorBanner message={error} /> : <Spinner />}
      </main>
    );
  }

  const myPlayer = state.players.find((p) => p.name === session?.name);

  async function submitAnswer(optionIndex: number) {
    if (!session || submitting || answered) return;
    setSelectedOption(optionIndex);
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/games/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerToken: session.playerToken, optionIndex }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && res.status !== 409) {
        throw new Error(data?.error ?? "Kunne ikke sende svar. Prøv igen.");
      }
      setAnswered(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Noget gik galt.");
      setSelectedOption(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 w-full max-w-sm mx-auto">
      <header className="w-full flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Spil {code}
          </p>
          <p className="font-bold">
            {myPlayer?.name ?? session?.name}
            {myPlayer?.is_katrine && " 👑"}
          </p>
        </div>
      </header>

      {myPlayer?.is_katrine && state.game.status === "lobby" && (
        <div className="card w-full text-center" style={{ borderColor: "var(--party-yellow)" }}>
          <p className="font-bold">Du er Katrine! 👑</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Svar ærligt — dit svar bliver automatisk det rigtige svar hver runde.
          </p>
        </div>
      )}

      {state.game.status === "lobby" && (
        <div className="w-full flex flex-col gap-4">
          <div className="card text-center">
            <p className="font-semibold">Venter på at værten starter spillet...</p>
          </div>
          <PlayerList players={state.players} />
        </div>
      )}

      {state.game.status === "active" && state.currentQuestion && (
        <div className="w-full flex flex-col gap-4">
          <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
            Spørgsmål {state.currentQuestion.index + 1} af {state.totalQuestions}
          </p>
          <h2 className="text-xl font-bold text-center">{state.currentQuestion.text}</h2>

          {state.game.question_state === "answering" && (
            <>
              <AnswerOptions
                options={state.currentQuestion.options}
                selectedIndex={selectedOption}
                disabled={submitting || answered}
                onSelect={submitAnswer}
              />
              {(answered || submitting) && (
                <p className="text-center font-semibold">
                  {submitting ? "Sender..." : "Svar sendt! Venter på de andre..."} (
                  {state.answeredCount}/{state.players.length})
                </p>
              )}
              {actionError && <ErrorBanner message={actionError} />}
            </>
          )}

          {state.game.question_state === "revealed" && state.roundResult && (
            <div className="flex flex-col gap-5">
              <DistributionChart
                options={state.currentQuestion.options}
                distribution={state.roundResult.distribution}
                correctOptionIndex={state.roundResult.correctOptionIndex}
                selectedOptionIndex={selectedOption}
              />
              <div>
                <p className="font-bold mb-2">Stillingen</p>
                <Leaderboard players={state.players} highlightPlayerId={myPlayer?.id} />
              </div>
              <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
                Venter på at værten går videre til næste spørgsmål...
              </p>
            </div>
          )}
        </div>
      )}

      {state.game.status === "finished" && (
        <div className="w-full flex flex-col gap-4">
          <div className="card text-center">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-lg">Spillet er slut!</p>
          </div>
          <Leaderboard players={state.players} highlightPlayerId={myPlayer?.id} />
        </div>
      )}

      <div style={{ display: "none" }}>
        <GameCodeBadge code={code} />
      </div>
    </main>
  );
}
