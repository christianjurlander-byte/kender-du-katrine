"use client";

import Link from "next/link";
import { Badge18 } from "@/components/Badge18";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="text-center flex flex-col gap-3 items-center">
        <span className="text-5xl">🎉</span>
        <h1 className="text-3xl font-black">Kender du Katrine?</h1>
        <Badge18 />
        <p style={{ color: "var(--muted)" }}>Den festlige quiz til Katrines 18-års fødselsdag 🎂</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link href="/host" className="btn btn-primary">
          🎤 Vær vært for et spil
        </Link>
        <Link href="/join" className="btn btn-secondary">
          📱 Deltag i et spil
        </Link>
      </div>

      <p className="text-sm text-center max-w-sm" style={{ color: "var(--muted)" }}>
        Ingen konto nødvendig. Værten opretter et spil og får en 4-cifret kode — spillerne
        indtaster koden og deres navn for at deltage.
      </p>
    </main>
  );
}
