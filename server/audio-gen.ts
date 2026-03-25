/**
 * BigMind Audio Generator
 *
 * Generates meditation scripts via Anthropic LLM, then converts to speech
 * via Gemini TTS. Saves MP3 files to public/audio/ with a JSON manifest.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { textToSpeechPython } from "./tts-bridge";

const anthropic = new Anthropic();

const AUDIO_DIR = path.resolve(process.cwd(), "public/audio");
const MANIFEST_PATH = path.join(AUDIO_DIR, "manifest.json");

const SCRIPT_SYSTEM_PROMPT = `You are a meditation script writer for BigMind, a sleep and meditation app.
Write meditation scripts that will be read aloud by a TTS voice.

Guidelines:
- Write in second person ("you")
- Use simple, calming language
- Include natural pauses marked with "..." (the TTS voice will pause)
- Include breathing cues ("breathe in... breathe out...")
- For sleep meditations, gradually slow the pace toward the end
- End with a gentle transition toward sleep or stillness
- Write ONLY the words that should be spoken aloud
- No stage directions, sound effects, or non-spoken text

Informed by: Shunryu Suzuki, Dogen, Alan Watts, Thich Nhat Hanh.`;

interface AudioEntry {
  meditationType: string;
  duration: number;
  voiceId: string;
  script: string;
  filename: string;
  fileSize: number;
  generatedAt: string;
  expiresAt: string;
}

interface Manifest {
  entries: AudioEntry[];
  lastGenerated: string | null;
}

// Keep scripts under 600 words (~3600 chars) to stay within TTS limits (4000 char max)
const SCRIPT_PROMPTS: Record<string, (dur: number) => string> = {
  "body-scan": (d) => `Write a ${d}-minute body scan meditation for sleep. Guide attention from head to toes, releasing tension. Use lots of "..." pauses to fill time. STRICT: maximum 500 words.`,
  "open-awareness": (d) => `Write a ${d}-minute open awareness meditation. Rest in spacious awareness. Inspired by shikantaza. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "breath-awareness": (d) => `Write a ${d}-minute breath awareness meditation for sleep. Focus on the natural rhythm of breathing. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "exploring-self": (d) => `Write a ${d}-minute contemplation on the nature of self. 'Who is the one who meditates?' Draw from Alan Watts. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "impermanence": (d) => `Write a ${d}-minute reflection on impermanence. Contemplate changing nature of thoughts and moments. Draw from Dogen. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "emptiness": (d) => `Write a ${d}-minute meditation on emptiness — interconnected nature of all things. Draw from Thich Nhat Hanh's interbeing. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "beginners-mind": (d) => `Write a ${d}-minute beginner's mind meditation. Each breath as if first. Draw from Shunryu Suzuki. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "zen-stories": (d) => `Write a ${d}-minute meditation weaving in a brief Zen story. Tell slowly, then sit with it. Use lots of "..." pauses. STRICT: maximum 500 words.`,
  "ocean-sounds": (_d) => `Write a brief 30-second spoken intro for an ocean sounds sleep meditation. Describe waves, invite rest. About 60 words.`,
  "forest-sounds": (_d) => `Write a brief 30-second intro for a forest sounds sleep meditation. Rustling leaves, birdsong. About 60 words.`,
  "orchestra-warmup": (_d) => `Write a brief 30-second intro for an orchestra warm-up meditation. Instruments tuning. About 60 words.`,
  "jungle-sounds": (_d) => `Write a brief 30-second intro for a jungle sounds meditation. Lush canopy, rain on leaves. About 60 words.`,
};

const TYPE_VOICE_MAP: Record<string, string> = {
  "body-scan": "kore",
  "open-awareness": "charon",
  "breath-awareness": "aoede",
  "exploring-self": "fenrir",
  "impermanence": "puck",
  "emptiness": "zephyr",
  "beginners-mind": "kore",
  "zen-stories": "charon",
  "ocean-sounds": "aoede",
  "forest-sounds": "kore",
  "orchestra-warmup": "puck",
  "jungle-sounds": "zephyr",
};

const SOUND_TYPES = ["ocean-sounds", "forest-sounds", "orchestra-warmup", "jungle-sounds"];

async function generateScript(meditationType: string, duration: number): Promise<string> {
  const promptFn = SCRIPT_PROMPTS[meditationType];
  if (!promptFn) return "";

  const response = await anthropic.messages.create({
    model: "claude_haiku_4_5",
    max_tokens: 2048,
    system: SCRIPT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: promptFn(duration) }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return (textBlock as any)?.text || "";
}

async function textToSpeech(text: string, voice: string, outputPath: string): Promise<void> {
  // Use Python TTS worker (pplx SDK) via subprocess
  await textToSpeechPython(text, voice, outputPath);
}

function loadManifest(): Manifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return { entries: [], lastGenerated: null };
}

function saveManifest(manifest: Manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function generateSingleAudio(
  meditationType: string,
  duration: number,
  voice: string,
  log: (msg: string) => void = console.log
): Promise<AudioEntry | null> {
  const filename = `${meditationType}_${duration}min_${voice}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);

  log(`Generating script: ${meditationType} (${duration}min, voice=${voice})...`);

  try {
    const script = await generateScript(meditationType, duration);
    if (!script.trim()) {
      log(`  ⚠ Empty script for ${meditationType}`);
      return null;
    }
    log(`  Script: ${script.split(/\s+/).length} words`);

    log(`  Converting to speech...`);
    await textToSpeech(script, voice, filepath);
    const fileSize = fs.statSync(filepath).size;
    log(`  ✓ Saved: ${filename} (${(fileSize / 1024).toFixed(0)} KB)`);

    const now = new Date();
    return {
      meditationType,
      duration,
      voiceId: voice,
      script,
      filename,
      fileSize: fs.statSync(filepath).size,
      generatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error: any) {
    log(`  ✗ Error: ${error.message}`);
    return null;
  }
}

export async function generateAudioLibrary(
  log: (msg: string) => void = console.log
): Promise<{ generated: number; total: number }> {
  // Ensure directory exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const manifest = loadManifest();
  const existing = new Set(manifest.entries.map(e => `${e.meditationType}_${e.duration}_${e.voiceId}`));

  // Build task list
  const tasks: Array<{ type: string; dur: number; voice: string }> = [];

  for (const [mtype, voice] of Object.entries(TYPE_VOICE_MAP)) {
    const isAmbient = SOUND_TYPES.includes(mtype);
    const durations = isAmbient ? [5] : [5, 10];

    for (const dur of durations) {
      const key = `${mtype}_${dur}_${voice}`;
      if (existing.has(key)) {
        log(`  Skipping (exists): ${mtype} ${dur}min`);
        continue;
      }
      tasks.push({ type: mtype, dur, voice });
    }
  }

  if (tasks.length === 0) {
    log("All audio already generated.");
    return { generated: 0, total: manifest.entries.length };
  }

  log(`Generating ${tasks.length} audio files...`);
  let generated = 0;

  for (let i = 0; i < tasks.length; i++) {
    const { type, dur, voice } = tasks[i];
    log(`\n[${i + 1}/${tasks.length}]`);
    const entry = await generateSingleAudio(type, dur, voice, log);
    if (entry) {
      manifest.entries.push(entry);
      generated++;
      // Save manifest after each successful generation (for resilience)
      manifest.lastGenerated = new Date().toISOString();
      saveManifest(manifest);
    }
  }

  log(`\n✓ Generated ${generated} audio files`);
  return { generated, total: manifest.entries.length };
}
