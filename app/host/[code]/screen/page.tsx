"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useInsights } from "@/hooks/useInsights";
import { QrCode } from "@/components/QrCode";
import { CountdownRing } from "@/components/CountdownRing";
import { Confetti } from "@/components/Confetti";
import { AnsweredGrid } from "@/components/AnsweredGrid";
import { DistributionChart } from "@/components/DistributionChart";
import { Leaderboard } from "@/components/Leaderboard";
import { GameCodeBadge, ErrorBanner, Spinner } from "@/components/Misc";
import { LobbyCountdown } from "@/components/LobbyCountdown";
import { TeaserGallery } from "@/components/TeaserGallery";
import { LobbyVibeMessage } from "@/components/LobbyVibeMessage";
import { useLobbyVibe } from "@/hooks/useLobbyVibe";
import { Badge18 } from "@/components/Badge18";
import { pickHighlightFacts } from "@/lib/insights";
import { playTadaChime } from "@/lib/sound";

/**
 * The "fælles skærm" — meant to be AirPlayed / HDMI'd to a TV. Purely a
 * display: no controls live here, the host still drives the game from
 * their own phone/laptop on /host/[code].
 */
export default function SharedScreenPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const { state, loading, error } = useGameRealtime(code);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // window.location only exists in the browser, so this must happen
    // after mount (avoids an SSR/CSR hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const refreshKey = state
    ? `${state.game.question_state}-${state.game.current_question_index}-${state.game.status}`
    : "";
  const { insights, awards } = useInsights(code, refreshKey);
  const lobbyVibe = useLobbyVibe(code, state?.game.status === "lobby");

  const revealed = !!state && state.game.question_state === "revealed" && !!state.currentQuestion;

  useEffect(() => {
    if (revealed) playTadaChime();
  }, [revealed, state?.currentQuestion?.id, state?.game.status]);

  if (loading || !state) {
    return (
      <main className="flex-1 flex items-center justify-center">
        {error ? <ErrorBanner message={error} /> : <Spinner />}
      </main>
    );
  }

  const { game, players, currentQuestion, roundResult, answeredCount, answeredPlayerIds, totalQuestions } =
    state;

  const joinUrl = origin ? `${origin}/join?code=${code}` : "";
  const playerNames = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const highlightFacts = pickHighlightFacts(insights, playerNames);

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-10 py-10 w-full max-w-5xl mx-auto text-center">
      {game.status === "lobby" && (
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-3">
            <span className="text-6xl">🎉</span>
            <h1 className="text-5xl font-black mt-2">Kender du Katrine?</h1>
            <Badge18 large />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10">
            {joinUrl && <QrCode value={joinUrl} size={240} />}
            <div className="text-left flex flex-col gap-2">
              <p className="text-2xl font-bold">Sådan deltager du:</p>
              <p className="text-xl">📱 Scan QR-koden med kameraet</p>
              <p className="text-xl">
                🔢 Eller indtast koden: <span className="font-black">{code}</span>
              </p>
              <div className="mt-2">
                <GameCodeBadge code={code} />
              </div>
            </div>
          </div>

          {game.scheduled_start_at && <LobbyCountdown targetIso={game.scheduled_start_at} big />}
          {game.teaser_image_urls.length > 0 && <TeaserGallery images={game.teaser_image_urls} />}

          <div>
            <p className="text-lg font-bold mb-3" style={{ color: "var(--muted)" }}>
              {players.length} {players.length === 1 ? "spiller er" : "spillere er"} med
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {players.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: 56,
                      height: 56,
                      fontSize: "1.75rem",
                      background: "linear-gradient(135deg, var(--party-purple), var(--party-pink))",
                    }}
                  >
                    {p.avatar ?? "🙂"}
                  </div>
                  <span className="text-sm font-semibold">
                    {p.name}
                    {p.is_katrine && " 👑"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <LobbyVibeMessage message={lobbyVibe} />
        </div>
      )}

      {game.status === "active" && currentQuestion && (
        <div className="flex flex-col items-center gap-6 w-full">
          <p className="text-lg font-bold" style={{ color: "var(--muted)" }}>
            Spørgsmål {currentQuestion.index + 1} af {totalQuestions}
          </p>
          <h2 className="text-4xl font-black max-w-3xl">{currentQuestion.text}</h2>
          {currentQuestion.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentQuestion.image_url}
              alt=""
              className="rounded-2xl object-cover"
              style={{ maxHeight: 320, maxWidth: "100%" }}
            />
          )}

          {game.question_state === "answering" && (
            <div className="flex flex-col items-center gap-5 w-full">
              <CountdownRing startedAt={game.question_started_at} />
              <p className="text-xl font-semibold">
                {answeredCount} af {players.length} har svaret
              </p>
              <AnsweredGrid players={players} answeredPlayerIds={answeredPlayerIds} />
            </div>
          )}

          {game.question_state === "revealed" && roundResult && (
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
              <DistributionChart
                options={currentQuestion.options}
                distribution={roundResult.distribution}
                correctOptionIndex={roundResult.correctOptionIndex}
              />
              {roundResult.fastestCorrectPlayerId && (
                <p className="text-lg font-bold" style={{ color: "var(--party-purple)" }}>
                  ⚡ {playerNames[roundResult.fastestCorrectPlayerId] ?? "Nogen"} svarede hurtigst rigtigt!
                </p>
              )}
              {highlightFacts.map((fact) => (
                <p key={fact} className="text-lg font-semibold">
                  {fact}
                </p>
              ))}
              <div className="w-full max-w-md">
                <p className="text-xl font-bold mb-2">Stillingen</p>
                <Leaderboard players={players} />
              </div>
            </div>
          )}
        </div>
      )}

      {game.status === "finished" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <span className="text-6xl">🏆</span>
          <h1 className="text-4xl font-black">Spillet er slut!</h1>
          <Leaderboard players={players} />

          {awards && awards.length > 0 && (
            <div className="w-full flex flex-col gap-3 mt-2">
              <p className="text-xl font-bold">Aftenens priser</p>
              {awards.map((award) => (
                <div key={award.title} className="card !p-4 flex items-center gap-3">
                  <span className="text-3xl">{award.emoji}</span>
                  <div className="text-left">
                    <p className="font-bold">{award.title}</p>
                    <p style={{ color: "var(--muted)" }}>{award.playerName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(revealed || game.status === "finished") && (
        <Confetti burstKey={`${game.status}-${currentQuestion?.id ?? "end"}`} />
      )}
    </main>
  );
}
