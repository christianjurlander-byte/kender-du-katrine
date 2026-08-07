"use client";

import { useEffect, useState } from "react";

interface TeaserGalleryProps {
  images: string[];
  intervalMs?: number;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Slowly rotates through teaser photos while people wait in the lobby.
 * Same pace as the AI lobby message, so the two don't compete for attention.
 */
export function TeaserGallery({ images, intervalMs = FIVE_MINUTES_MS }: TeaserGalleryProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden mx-auto flex items-center justify-center"
      style={{ maxWidth: 360, maxHeight: 480, background: "var(--card-border)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={images[index]}
        src={images[index]}
        alt="Teaser-billede af Katrine"
        className="max-w-full max-h-full w-auto h-auto object-contain"
        style={{ animation: "fadeIn 0.4s ease" }}
      />
    </div>
  );
}
