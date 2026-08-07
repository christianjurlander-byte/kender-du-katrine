"use client";

import { useEffect, useState } from "react";

interface TeaserGalleryProps {
  images: string[];
  intervalMs?: number;
}

/** Slowly rotates through teaser photos while people wait in the lobby. */
export function TeaserGallery({ images, intervalMs = 4000 }: TeaserGalleryProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden mx-auto"
      style={{ maxWidth: 360, aspectRatio: "4 / 3" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={images[index]}
        src={images[index]}
        alt="Teaser-billede af Katrine"
        className="w-full h-full object-cover"
        style={{ animation: "fadeIn 0.4s ease" }}
      />
    </div>
  );
}
