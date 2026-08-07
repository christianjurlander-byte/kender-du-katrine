"use client";

import { useRef, useState } from "react";
import { Button } from "./Button";
import { hostFetch, hostUploadFile } from "@/lib/hostApi";

interface LobbySettingsPanelProps {
  code: string;
  hostToken: string;
  scheduledStartAt: string | null;
  teaserImageUrls: string[];
}

/** Converts an ISO string to the value a <input type="datetime-local"> expects, in local time. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function LobbySettingsPanel({
  code,
  hostToken,
  scheduledStartAt,
  teaserImageUrls,
}: LobbySettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [datetimeValue, setDatetimeValue] = useState(() => toDatetimeLocalValue(scheduledStartAt));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function saveScheduledStart() {
    setSaving(true);
    setError(null);
    try {
      await hostFetch(`/api/games/${code}/lobby-settings`, hostToken, {
        method: "PATCH",
        body: { scheduledStartAt: datetimeValue ? new Date(datetimeValue).toISOString() : null },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke gemme tidspunkt.");
    } finally {
      setSaving(false);
    }
  }

  async function clearScheduledStart() {
    setDatetimeValue("");
    setSaving(true);
    setError(null);
    try {
      await hostFetch(`/api/games/${code}/lobby-settings`, hostToken, {
        method: "PATCH",
        body: { scheduledStartAt: null },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke fjerne nedtælling.");
    } finally {
      setSaving(false);
    }
  }

  async function addTeaserImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { imageUrl } = await hostUploadFile(`/api/games/${code}/upload-image`, hostToken, file);
      const updated = [...teaserImageUrls, imageUrl];
      await hostFetch(`/api/games/${code}/lobby-settings`, hostToken, {
        method: "PATCH",
        body: { teaserImageUrls: updated },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke uploade billedet.");
    } finally {
      setUploading(false);
    }
  }

  async function removeTeaserImage(url: string) {
    setError(null);
    try {
      const updated = teaserImageUrls.filter((u) => u !== url);
      await hostFetch(`/api/games/${code}/lobby-settings`, hostToken, {
        method: "PATCH",
        body: { teaserImageUrls: updated },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke fjerne billedet.");
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        ⏰ Nedtælling &amp; teaser-billeder
      </Button>
    );
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-bold">Byg forventning i lobbyen</p>
        <button className="btn btn-secondary !w-auto !min-h-0 !py-2 !px-3 !text-sm" onClick={() => setOpen(false)}>
          Luk
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          Quiz starter (valgfrit)
        </label>
        <input
          type="datetime-local"
          className="input !text-left"
          value={datetimeValue}
          onChange={(e) => setDatetimeValue(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={saveScheduledStart} disabled={saving || !datetimeValue}>
            {saving ? "Gemmer..." : "Gem tidspunkt"}
          </Button>
          {scheduledStartAt && (
            <Button variant="secondary" onClick={clearScheduledStart} disabled={saving}>
              Fjern
            </Button>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Vises som en nedtælling for alle i lobbyen. Spillet starter først, når du selv trykker
          &quot;Start spil&quot;.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          Teaser-billeder af Katrine ({teaserImageUrls.length}/8)
        </label>
        {teaserImageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {teaserImageUrls.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="rounded-lg object-cover" style={{ width: 64, height: 64 }} />
                <button
                  className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                  style={{ width: 22, height: 22, background: "#ef4444", color: "white", fontSize: 12 }}
                  onClick={() => removeTeaserImage(url)}
                  aria-label="Fjern billede"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {teaserImageUrls.length < 8 && (
          <button
            className="btn btn-secondary !w-auto !min-h-0 !py-2 !px-3 !text-sm"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? "Uploader..." : "🖼️ Tilføj teaser-billede"}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => addTeaserImage(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}
    </div>
  );
}
