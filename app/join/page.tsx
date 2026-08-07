"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/Misc";
import { AvatarPicker } from "@/components/AvatarPicker";
import { Badge18 } from "@/components/Badge18";
import { normalizeGameCode, isValidGameCode } from "@/lib/gameCode";
import { savePlayerSession } from "@/lib/storage";
import { AVATAR_OPTIONS } from "@/lib/avatars";
import { fetchGameState } from "@/lib/gameState";

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => normalizeGameCode(searchParams.get("code") ?? ""));
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takenAvatars, setTakenAvatars] = useState<Set<string>>(new Set());

  useEffect(() => {
    const cleanCode = normalizeGameCode(code);
    if (!isValidGameCode(cleanCode)) return;

    let cancelled = false;
    function refresh() {
      fetchGameState(cleanCode)
        .then((state) => {
          if (cancelled) return;
          setTakenAvatars(new Set(state.players.map((p) => p.avatar).filter((a): a is string => !!a)));
        })
        .catch(() => {
          /* ignore — game code might just not exist yet, form validation handles that on submit */
        });
    }
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = normalizeGameCode(code);
    const cleanName = name.trim();

    if (!isValidGameCode(cleanCode)) {
      setError("Indtast den 4-cifrede spilkode.");
      return;
    }
    if (!cleanName) {
      setError("Indtast dit navn.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${cleanCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, avatar }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Kunne ikke deltage i spillet. Prøv igen.");
      }

      savePlayerSession(cleanCode, { playerToken: data.playerToken, name: cleanName });
      router.push(`/play/${cleanCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="text-center flex flex-col gap-2 items-center">
        <span className="text-5xl">📱</span>
        <h1 className="text-2xl font-black">Deltag i spillet</h1>
        <Badge18 />
        <p style={{ color: "var(--muted)" }}>Spørg værten om koden til spillet.</p>
      </div>

      <form onSubmit={handleJoin} className="w-full max-w-sm flex flex-col gap-4">
        <input
          className="input"
          style={{ letterSpacing: "0.4em", fontSize: "1.5rem" }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="0000"
          value={code}
          onChange={(e) => setCode(normalizeGameCode(e.target.value))}
          autoFocus
        />
        <input
          className="input"
          placeholder="Dit navn"
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AvatarPicker value={avatar} onChange={setAvatar} takenAvatars={takenAvatars} />
        <Button type="submit" disabled={loading}>
          {loading ? "Tilslutter..." : "Deltag 🎉"}
        </Button>
      </form>

      {error && <ErrorBanner message={error} />}
    </main>
  );
}
