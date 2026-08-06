"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { ErrorBanner, Spinner } from "@/components/Misc";
import { saveHostToken } from "@/lib/storage";

export default function HostLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createGame() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Kunne ikke oprette spil. Prøv igen.");
      }
      saveHostToken(data.code, data.hostToken);
      router.push(`/host/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="text-center flex flex-col gap-2">
        <span className="text-5xl">🎤</span>
        <h1 className="text-2xl font-black">Vær vært</h1>
        <p style={{ color: "var(--muted)" }}>
          Opret et nyt spil og få en 4-cifret kode, som spillerne kan bruge til at deltage.
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <Button onClick={createGame}>Opret nyt spil</Button>
        </div>
      )}

      {error && <ErrorBanner message={error} />}
    </main>
  );
}
