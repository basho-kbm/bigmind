import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env/server";

const requestSchema = z.object({
  segments: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(4000),
        durationSeconds: z.number().int().positive().max(3600),
      }),
    )
    .min(1)
    .max(20),
  voiceDirection: z
    .object({
      pace: z.string().min(1).optional(),
      tone: z.string().min(1).optional(),
      emphasis: z.string().min(1).optional(),
      pauseStyle: z.string().min(1).optional(),
      avoid: z.array(z.string().min(1)).optional(),
    })
    .optional(),
});

function buildInstructions(voiceDirection?: z.infer<typeof requestSchema>["voiceDirection"]) {
  return [
    "Read this as a calm bedtime meditation guide.",
    "Keep the delivery grounded, unhurried, warm, and sleep-safe.",
    "Use natural pauses and never sound salesy, performative, or theatrical.",
    voiceDirection?.pace ? `Pace: ${voiceDirection.pace}.` : null,
    voiceDirection?.tone ? `Tone: ${voiceDirection.tone}.` : null,
    voiceDirection?.emphasis ? `Emphasis: ${voiceDirection.emphasis}.` : null,
    voiceDirection?.pauseStyle ? `Pause style: ${voiceDirection.pauseStyle}.` : null,
    voiceDirection?.avoid?.length ? `Avoid: ${voiceDirection.avoid.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(request: Request) {
  const env = getServerEnv();

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const instructions = buildInstructions(parsed.data.voiceDirection);
  const renderedSegments: Array<{ id: string; durationSeconds: number; audioBase64: string }> = [];

  for (const segment of parsed.data.segments) {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "sage",
        format: "mp3",
        input: segment.text,
        instructions,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "tts_failed", detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    renderedSegments.push({
      id: segment.id,
      durationSeconds: segment.durationSeconds,
      audioBase64: buffer.toString("base64"),
    });
  }

  return NextResponse.json({
    mimeType: "audio/mpeg",
    segments: renderedSegments,
  });
}
