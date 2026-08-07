"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  code: string;
  className?: string;
}

/** Copies the player join link (with the code pre-filled) to the clipboard. */
export function CopyLinkButton({ code, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (e.g. no https, no permission) — nothing
      // sensitive here, so just silently no-op rather than showing an error.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn btn-secondary !w-auto !min-h-0 !py-2 !px-4 !text-sm ${className ?? ""}`}
    >
      {copied ? "✅ Link kopieret!" : "🔗 Kopiér link til deltagelse"}
    </button>
  );
}
