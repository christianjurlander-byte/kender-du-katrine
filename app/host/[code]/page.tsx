"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { getHostToken } from "@/lib/storage";
import { hostFetch, hostUploadFile } from "@/lib/hostApi";
import { Button } from "@/components/Button";
import { PlayerList } from "@/components/PlayerList";
import { DistributionChart } from "@/components/DistributionChart";
import { Leaderboard } from "@/components/Leaderboard";
import { ErrorBanner, GameCodeBadge, Spinner } from "@/components/Misc";
import { QuestionEditor, type EditableQuestion } from "@/components/QuestionEditor";
import { CountdownRing } from "@/components/CountdownRing";
import { Confetti } from "@/components/Confetti";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { LobbySettingsPanel } from "@/components/LobbySettingsPanel";
import { Badge18 } from "@/components/Badge18";
import { RoundVibeMessage } from "@/components/RoundVibeMessage";
import { useRoundVibe } from "@/hooks/useRoundVibe";
import { KatrineRecapCard } from "@/components/KatrineRecapCard";
import { useKatrineRecap } from "@/hooks/useKatrineRecap";
import { playTadaChime } from "@/lib/sound";

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
  const roundVibe = useRoundVibe(code, state?.currentQuestion?.id, state?.game.question_state === "revealed");
  const katrineRecap = useKatrineRecap(code, state?.game.status === "finished");

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

  async function uploadQuestionImage(_questionIndex: number, file: File) {
    if (!hostToken) throw new Error("Mangler værtsadgang.");
    const { imageUrl } = await hostUploadFile(`/api/games/${code}/upload-image`, hostToken, file);
    return imageUrl;
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
  const revealed = game.question_state === "revealed" && !!currentQuestion;

  return (
    <HostGameView
      code={code}
      hostToken={hostToken}
      game={game}
      players={players}
      currentQuestion={currentQuestion}
      roundResult={roundResult}
      answeredCount={answeredCount}
      totalQuestions={totalQuestions}
      katrineChosen={katrineChosen}
      revealed={revealed}
      roundVibe={roundVibe}
      katrineRecap={katrineRecap}
      busy={busy}
      actionError={actionError}
      runAction={runAction}
      openQuestionEditor={openQuestionEditor}
      editingQuestions={editingQuestions}
      questions={questions}
      saveQuestions={saveQuestions}
      uploadQuestionImage={uploadQuestionImage}
      closeEditor={() => setEditingQuestions(false)}
    />
  );
}

interface HostGameViewProps {
  code: string;
  hostToken: string;
  game: NonNullable<ReturnType<typeof useGameRealtime>["state"]>["game"];
  players: NonNullable<ReturnType<typeof useGameRealtime>["state"]>["players"];
  currentQuestion: NonNullable<ReturnType<typeof useGameRealtime>["state"]>["currentQuestion"];
  roundResult: NonNullable<ReturnType<typeof useGameRealtime>["state"]>["roundResult"];
  answeredCount: number;
  totalQuestions: number;
  katrineChosen: boolean;
  revealed: boolean;
  roundVibe: string | null;
  katrineRecap: string | null;
  busy: boolean;
  actionError: string | null;
  runAction: (fn: () => Promise<unknown>) => Promise<void>;
  openQuestionEditor: () => Promise<void>;
  editingQuestions: boolean;
  questions: EditableQuestion[];
  saveQuestions: (updated: EditableQuestion[]) => Promise<void>;
  uploadQuestionImage: (questionIndex: number, file: File) => Promise<string>;
  closeEditor: () => void;
}

function HostGameView({
  code,
  hostToken,
  game,
  players,
  currentQuestion,
  roundResult,
  answeredCount,
  totalQuestions,
  katrineChosen,
  revealed,
  roundVibe,
  katrineRecap,
  busy,
  actionError,
  runAction,
  openQuestionEditor,
  editingQuestions,
  questions,
  saveQuestions,
  uploadQuestionImage,
  closeEditor,
}: HostGameViewProps) {
  useEffect(() => {
    if (revealed) playTadaChime();
  }, [revealed, currentQuestion?.id]);

  return (
    <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 w-full max-w-md mx-auto">
      <header className="w-full text-center flex flex-col gap-1">
        <p className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          VÆRT
        </p>
        <div className="flex justify-center">
          <Badge18 />
        </div>
        <GameCodeBadge code={code} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Spillerne skriver koden på kenderdukatrine.vercel.app/join
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          <Link
            href={`/host/${code}/screen`}
            target="_blank"
            className="btn btn-secondary !w-auto !min-h-0 !py-2 !px-4 !text-sm"
          >
            📺 Åbn fælles skærm
          </Link>
          <CopyLinkButton code={code} />
        </div>
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

          <LobbySettingsPanel
            code={code}
            hostToken={hostToken}
            scheduledStartAt={game.scheduled_start_at}
            teaserImageUrls={game.teaser_image_urls}
            katrineFacts={game.katrine_facts}
          />

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
          {currentQuestion.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentQuestion.image_url}
              alt=""
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: 220 }}
            />
          )}

          {game.question_state === "answering" && (
            <>
              <CountdownRing startedAt={game.question_started_at} />
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
              <RoundVibeMessage message={roundVibe} />
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
            <p className="text-2xl">🎂</p>
            <p className="font-bold text-lg">
              Tillykke med de 18 år, {players.find((p) => p.is_katrine)?.name ?? "Katrine"}!
            </p>
          </div>
          <KatrineRecapCard message={katrineRecap} katrineName={players.find((p) => p.is_katrine)?.name} />
          <p className="font-bold text-center mt-2">🏆 Stillingen</p>
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
          onUploadImage={uploadQuestionImage}
          onClose={closeEditor}
        />
      )}

      {revealed && <Confetti burstKey={currentQuestion!.id} />}
    </main>
  );
}
