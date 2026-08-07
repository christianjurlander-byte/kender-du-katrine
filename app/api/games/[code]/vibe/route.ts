import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withApiErrorHandling } from "@/lib/apiHelpers";
import { LOBBY_VIBE_PROMPT, pickRandomFallback } from "@/lib/lobbyVibes";

/**
 * Public: a short, fun rotating message for the lobby. Uses Claude if
 * ANTHROPIC_API_KEY is configured, otherwise (or on any failure) falls
 * back to a fixed list of pre-written messages — this endpoint must never
 * be the reason the lobby breaks.
 */
async function handleGet() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: pickRandomFallback(), source: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 120,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: LOBBY_VIBE_PROMPT }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ message: pickRandomFallback(), source: "fallback" });
    }

    const textBlock = response.content.find((block) => block.type === "text");
    const message = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!message) {
      return NextResponse.json({ message: pickRandomFallback(), source: "fallback" });
    }

    return NextResponse.json({ message, source: "ai" });
  } catch (err) {
    console.error("Lobby vibe generation failed, using fallback:", err);
    return NextResponse.json({ message: pickRandomFallback(), source: "fallback" });
  }
}

export const GET = withApiErrorHandling(handleGet);
