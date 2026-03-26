/**
 * Daily Meditation Generator
 *
 * Generates one meditation per day, cycling through 5 core Zen concepts.
 * Uses Gemini for script generation and TTS bridge for audio.
 */

import { geminiModel, checkAndIncrementApiCall } from "./roshi";
import { textToSpeechPython } from "./tts-bridge";
import { storage } from "./storage";
import type { DailyMeditation } from "@shared/schema";
import path from "path";
import fs from "fs";

// The 5 concepts, rotating daily
const CONCEPTS = [
  {
    id: "no-self",
    label: "No Self",
    paliName: "Anattā",
    description:
      "The idea that there is no fixed, unchanging \"you\" inside. Like a river that's always flowing, you're a process — not a thing. In meditation, we gently notice that thoughts, feelings, and sensations come and go, and none of them are \"us.\"",
    voiceId: "charon",
  },
  {
    id: "impermanence",
    label: "Impermanence",
    paliName: "Anicca",
    description:
      "Everything changes — your breath, your thoughts, the seasons. Nothing stays the same forever, and that's actually okay. In meditation, we practice watching things arise and pass away, and we find a kind of peace in the flow.",
    voiceId: "kore",
  },
  {
    id: "emptiness",
    label: "Emptiness",
    paliName: "Śūnyatā",
    description:
      "Nothing exists all by itself — everything is connected to everything else. A flower needs sun, rain, and soil to exist. In meditation, we relax our grip on seeing things as separate and start to feel the web of connection.",
    voiceId: "aoede",
  },
  {
    id: "beginners-mind",
    label: "Beginner's Mind",
    paliName: "Shoshin",
    description:
      "Approaching each moment as if it were completely new — with curiosity and openness, free from expectations. Like a child seeing the ocean for the first time. In meditation, we let go of \"knowing\" and simply experience.",
    voiceId: "puck",
  },
  {
    id: "non-attachment",
    label: "Non-Attachment",
    paliName: "Upādāna",
    description:
      "Letting go of clinging — to outcomes, to thoughts, to how things \"should\" be. It doesn't mean not caring; it means holding things lightly. In meditation, we practice noticing our grip and gently releasing it.",
    voiceId: "zephyr",
  },
] as const;

/** Get today's concept based on day of year */
export function getTodaysConcept(date?: Date) {
  const d = date || new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CONCEPTS[dayOfYear % 5];
}

/** Get tomorrow's concept */
export function getTomorrowsConcept() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getTodaysConcept(tomorrow);
}

/** Get all concept info (for the public API) */
export function getAllConcepts() {
  return CONCEPTS;
}

// Hardcoded fallback meditation for when Gemini is not available
const FALLBACK_SCRIPTS: Record<string, string> = {
  "no-self": `Welcome. Find a comfortable position and gently close your eyes...

Take a deep breath in... and let it out slowly...

Today, we're going to explore something interesting together. We often think of ourselves as one solid, unchanging thing — like a statue. But what if we're more like a river?...

Let's start by just noticing your breath... Feel the air entering through your nose... filling your lungs... and then releasing...

Each breath is a little different, isn't it?... The "you" that breathed in a moment ago has already changed — new air, new sensations, new thoughts...

Now, gently notice any thoughts passing through your mind... You don't need to grab onto them or push them away... Just watch them drift by, like clouds moving across the sky...

Notice — who is watching these thoughts?... Is it a fixed thing? Or is the watcher also shifting, moment to moment?...

This is the gentle teaching of "no self" — not that you don't exist, but that you're something more beautiful than a fixed thing... You're alive, flowing, always becoming...

Take another deep breath...

Right now, just be the breathing... Be the listening... Be this moment, without needing to label it as "me" or "mine"...

Rest here for a while... in this open, flowing awareness...

...

When you're ready, gently deepen your breath... Wiggle your fingers and toes... And slowly open your eyes...

Carry this lightness with you. You are not stuck. You are always free to flow.`,

  "impermanence": `Welcome. Let's begin by settling into stillness...

Take a slow, deep breath in... and release it completely...

Today we're going to sit with something very simple — the fact that everything changes...

Start by noticing your breath... Feel how each inhale is slightly different from the last... Each exhale unique...

Nothing repeats exactly the same way twice...

Now, notice the sounds around you... They come... and they go... Rising and fading like waves on a shore...

Everything in your life has this quality — your feelings, your thoughts, even this very moment... It's already changing...

This might sound sad, but there's something freeing about it... If difficult feelings always pass, we don't have to fear them so much... And if beautiful moments are fleeting, we can appreciate them more deeply...

Take a breath and feel this moment... Right here... Right now...

It will never come again exactly like this... And that's what makes it precious...

Let your awareness rest in this gentle flow... Not holding on... Not pushing away... Just being present with what is...

...

Now, slowly begin to return... Take a deeper breath... Feel your body in the space around you...

Open your eyes when you're ready... and step into the ever-changing day with openness and ease.`,

  "emptiness": `Welcome. Let's find our way into stillness together...

Begin with a slow breath in... and a long, easy breath out...

Today we're exploring a beautiful idea — that nothing exists all by itself...

Start by feeling your breath... Notice that you're breathing air that was once part of the sky... part of the trees... part of the ocean...

You don't create your breath alone — it's a collaboration between you and the whole world...

Now, feel your body sitting here... The ground supports you... The air surrounds you... The warmth or coolness touches your skin...

You are not separate from all of this... You are woven into it...

Think of a flower for a moment... A flower needs sunlight, water, soil, and air to exist... Without any of those things, there is no flower... The flower is made of "non-flower" things...

In the same way, you are made of all the people, experiences, and moments that have shaped you...

This is what "emptiness" really means — not that nothing is real, but that everything is connected... Everything belongs...

Rest in this feeling of connection for a while...

...

When you're ready, take a deeper breath... Gently open your eyes...

You are not alone. You never were.`,

  "beginners-mind": `Welcome. Take a moment to arrive, right here, right now...

Close your eyes gently and take a full, deep breath...

Today we're practicing something wonderfully simple — seeing things fresh, as if for the first time...

Remember what it was like to be a child? Everything was interesting... A puddle, a bug, the way light came through a window... Nothing was boring because nothing was "already known"...

Let's try to bring that freshness to this moment...

Take a breath... But breathe as if you've never breathed before... What does it actually feel like?... The coolness of air entering your nose... The way your chest rises... The subtle pause between in and out...

...

Now, listen to the sounds around you — not labeling them as "traffic" or "birds" or "air conditioning"... Just hear them as pure sound... Vibrations arriving at your ears...

Everything becomes richer when we drop our assumptions...

This is beginner's mind — not ignorance, but openness... The willingness to meet each moment without deciding in advance what it is...

Rest in this open awareness for a while... Let everything be new...

...

When you're ready, take a gentle breath and open your eyes... Look around as if you're seeing this room — this world — for the very first time.`,

  "non-attachment": `Welcome. Let yourself settle into a comfortable position...

Take a long, slow breath in... and release it with a sigh...

Today we're going to explore something that can change how you experience everything — the art of letting go...

Start by noticing your breath... Don't try to control it... Just let it happen on its own...

This is already a small act of letting go — trusting that breathing will take care of itself...

Now, notice any thoughts in your mind... Maybe plans for later... Maybe a memory... Maybe a worry...

Instead of following these thoughts or pushing them away, try something different... Just notice them and let them pass... Like leaves floating down a stream...

You don't have to catch every leaf...

Non-attachment doesn't mean not caring... It means holding things lightly... Loving without gripping... Wanting without demanding...

Think of holding a baby bird in your hands... You hold gently — firm enough to protect, soft enough not to crush... That's non-attachment...

Now, notice if there's any tension in your body — in your shoulders, your jaw, your hands... These are places where we often grip without knowing it...

Gently release that tension... Let your shoulders drop... Soften your jaw... Open your hands...

...

Rest in this open, released state for a while... Not needing this moment to be anything other than what it is...

...

When you're ready, gently deepen your breath... Open your eyes...

Go forward today holding everything — your plans, your hopes, your worries — just a little more lightly.`,
};

/** Main generation function */
export async function generateDailyMeditation(): Promise<DailyMeditation & { conceptDescription: string }> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const concept = getTodaysConcept(today);

  // Check if already generated for today
  const existing = await storage.getDailyMeditation(dateStr);
  if (existing) {
    return { ...existing, conceptDescription: concept.description };
  }

  // Generate script
  let script: string;

  if (geminiModel && checkAndIncrementApiCall()) {
    try {
      const prompt = `Write a guided meditation script for beginners on the theme of "${concept.label}" (${concept.paliName}).

Context: This is for BigMind, a meditation app for beginner to early intermediate meditators. The script will be read aloud by a TTS voice.

Guidelines:
- Write in second person ("you")
- Simple, warm, accessible language — no jargon
- Introduce the concept gently, as if the listener has never heard of it
- Include natural pauses marked with "..." 
- Include breathing cues throughout
- About 500 words (roughly 10 minutes when read slowly with pauses)
- End with a gentle return to awareness
- Write ONLY the words to be spoken — no stage directions, no headers, no formatting marks

The concept: ${concept.description}`;

      const result = await geminiModel.generateContent(prompt);
      script = result.response.text() || FALLBACK_SCRIPTS[concept.id];
    } catch (error) {
      console.error("[daily-gen] Gemini generation failed, using fallback:", error);
      script = FALLBACK_SCRIPTS[concept.id];
    }
  } else {
    console.log("[daily-gen] Gemini not configured, using fallback script");
    script = FALLBACK_SCRIPTS[concept.id];
  }

  // Ensure the daily audio directory exists
  const audioDir = path.resolve(process.cwd(), "public/audio/daily");
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Generate TTS audio
  const audioFilename = `daily_${concept.id}_${dateStr}_${concept.voiceId}.mp3`;
  const audioPath = path.join(audioDir, audioFilename);

  try {
    await textToSpeechPython(script, concept.voiceId, audioPath);
    console.log(`[daily-gen] Audio generated: ${audioFilename}`);
  } catch (error) {
    console.error("[daily-gen] TTS generation failed:", error);
    // Continue without audio — the client can handle missing audio
  }

  // Save to DB
  const entry = await storage.createDailyMeditation({
    date: dateStr,
    concept: concept.id,
    conceptLabel: concept.label,
    script,
    voiceId: concept.voiceId,
    audioFilename: fs.existsSync(audioPath) ? audioFilename : null,
    generatedAt: new Date().toISOString(),
  });

  return { ...entry, conceptDescription: concept.description };
}

export { CONCEPTS };
