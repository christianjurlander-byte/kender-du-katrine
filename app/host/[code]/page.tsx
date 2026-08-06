"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { getHostToken } from "@/lib/storage";
import { hostFetch } from "@/lib/hostApi";
import { Button } from "@/components/Button";
import { PlayerList } from "@/components/PlayerList";
import { DistributionChart } from "@/components/DistributionChart";
import { Leaderboard } from "@/components/Leaderboard";
import { ErrorBanner, GameCodeBadge, Spinner } from "@/components/Misc";
import { QuestionEditor, type EditableQuestion } from "@/components/QuestionEditor";

export default function HostGamePage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [hostToken, setHostToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);

  const { state, loading, error } = useGameRealtime(code);

  useEffect(() => {
    // Reading localStorage is a sync with an external system that only
    // exists in the browser, so this must happen after mount (avoids an
    // SSR/CSR hydration mismatch from reading it during render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHostToken(getHostToken(code));
    setTokenChecked(true);
  }, [code]);

  async function runAction(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  async function openQuestionEditor() {
    if (!hostToken) return;
    try {
      const data = await hostFetch(`/api/games/${code}/questions`, hostToken);
      setQuestions(data.questions);
      setEditingQuestions(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Kunne ikke hente spørgsmål.");
    }
  }

  async function saveQuestions(updated: EditableQuestion[]) {
    if (!hostToken) return;
    await hostFetch(`/api/games/${code}/questions`, hostToken, {
      method: "PATCH",
      body: { questions: updated },
    });
  }

  if (!tokenChecked || loading || !state) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {error ? <ErrorBanner message={error} /> : <Spinner />}
      </main>
    );
  }

  if (!hostToken) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ErrorBanner message="Denne browser har ikke værtsadgang til dette spil." />
        <Link href="/host" className="btn btn-secondary max-w-xs">
          Opret et nyt spil
        </Link>
      </main>
    );
  }

  const { game, players, currentQuestion, roundResult, answeredCount, totalQuestions } = state;
  const katrineChosen = players.some((p) => p.is_katrine);

  return (
    <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 w-full max-w-md mx-auto">
      <header className="w-full text-center flex flex-col gap-1">
        <p className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          VÆRT
        </p>
        <GameCodeBadge code={code} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Spillerne skriver koden på kenderdukatrine.vercel.app/join
        </p>
      </header>

      {game.status === "lobby" && (
        <div className="w-full flex flex-col gap-5">
          <div className="card flex flex-col gap-3">
            <p className="font-bold">1. Vælg hvem der er Katrine</p>
            <PlayerList
              players={players}
              selectable
              onSelectKatrine={(playerId) =>
                runAction(() =>
                  hostFetch(`/api/games/${code}/katrine`, hostToken, {
                    method: "POST",
                    body: { playerId },
                  })
                )
              }
            />
          </div>

          <Button variant="secondary" onClick={openQuestionEditor}>
            ✏️ Rediger spørgsmål ({totalQuestions})
          </Button>

          <Button
            disabled={busy || !katrineChosen || players.length < 2}
            onClick={() => runAction(() => hostFetch(`/api/games/${code}/start`, hostToken, { method: "POST" }))}
          >
            🚀 Start spil
          </Button>
          {!katrineChosen && (
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
              Vælg Katrine, før spillet kan starte.
            </p>
          )}
        </div>
      )}

      {game.status === "active" && currentQuestion && (
        <div className="w-full flex flex-col gap-5">
          <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
            Spørgsmål {currentQuestion.index + 1} af {totalQuestions}
          </p>
          <h2 className="text-xl font-bold text-center">{currentQuestion.text}</h2>

          {game.question_state === "answering" && (
            <>
              <p className="text-center font-semibold">
                {answeredCount} af {players.length} har svaret
              </p>
              <Button
                disabled={busy}
                onClick={() =>
                  runAction(() => hostFetch(`/api/games/${code}/reveal`, hostToken, { method: "POST" }))
                }
              >
                🔒 Luk afstemning og vis svar
              </Button>
            </>
          )}

          {game.question_state === "revealed" && roundResult && (
            <div className="flex flex-col gap-5">
              <DistributionChart
                options={currentQuestion.options}
                distribution={roundResult.distribution}
                correctOptionIndex={roundResult.correctOptionIndex}
              />
              <div>
                <p className="font-bold mb-2">Stillingen</p>
                <Leaderboard players={players} />
              </div>
              <Button
                disabled={busy}
                onClick={() =>
                  runAction(() => hostFetch(`/api/games/${code}/next`, hostToken, { method: "POST" }))
                }
              >
                {currentQuestion.index + 1 >= totalQuestions ? "🏁 Afslut spil" : "➡️ Næste spørgsmål"}
              </Button>
            </div>
          )}
        </div>
      )}

      {game.status === "finished" && (
        <div className="w-full flex flex-col gap-4">
          <div className="card text-center">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-lg">Spillet er slut!</p>
          </div>
          <Leaderboard players={players} />
          <Link href="/host" className="btn btn-secondary">
            Opret et nyt spil
          </Link>
        </div>
      )}

      {actionError && <ErrorBanner message={actionError} />}

      {editingQuestions && (
        <QuestionEditor
          initialQuestions={questions}
          onSave={saveQuestions}
          onClose={() => setEditingQuestions(false)}
        />
      )}
    </main>
  );
}
