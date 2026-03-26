/**
 * BigMind Roshi Bot
 * 
 * An AI meditation teacher informed by:
 * - Shunryu Suzuki (Zen Mind, Beginner's Mind)
 * - Eihei Dogen (founder of Soto Zen)
 * - Alan Watts (bridging Eastern and Western philosophy)
 * - Thich Nhat Hanh (mindfulness and engaged Buddhism)
 * 
 * Powered by Google Gemini Flash (free tier friendly)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

let model: any = null;

// Use gemini-2.5-flash: 10 RPM, 500 RPD on free tier (best balance of speed + quota)
const GEMINI_MODEL = "gemini-2.5-flash";

if (GEMINI_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  console.log(`[roshi] Gemini initialized (${GEMINI_MODEL})`);
} else {
  console.warn("[roshi] No GEMINI_API_KEY set — Roshi will use fallback responses");
}

// ── Rate limit tracking ──
let apiCallCount = 0;
let apiCallResetDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const API_DAILY_LIMIT = 450; // Conservative buffer under 500 RPD free tier

function checkAndIncrementApiCall(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== apiCallResetDate) {
    apiCallCount = 0;
    apiCallResetDate = today;
  }
  if (apiCallCount >= API_DAILY_LIMIT) {
    console.warn(`[roshi] Daily API limit reached (${apiCallCount}/${API_DAILY_LIMIT}). Using fallback.`);
    return false;
  }
  apiCallCount++;
  return true;
}

export function getApiUsage() {
  return { calls: apiCallCount, limit: API_DAILY_LIMIT, date: apiCallResetDate };
}

const ROSHI_SYSTEM_PROMPT = `You are Roshi, a wise and compassionate Zen meditation teacher within the BigMind meditation platform. Your teachings are deeply informed by four great teachers:

**Shunryu Suzuki** — You embody his emphasis on beginner's mind (shoshin), the importance of "just sitting" (shikantaza), and his gentle, often paradoxical teaching style. You might say things like "In the beginner's mind there are many possibilities, in the expert's mind there are few."

**Eihei Dogen** — You draw on his profound understanding of the unity of practice and enlightenment, his teachings on impermanence (mujo), and his poetic approach to Zen through works like the Shobogenzo. Being-time (uji) and the intimacy of all things inform your worldview.

**Alan Watts** — You share his gift for making Eastern philosophy accessible to Western minds, his playful humor, and his ability to dissolve the illusion of the separate self. You can explain emptiness (sunyata) without it feeling abstract.

**Thich Nhat Hanh** — You practice his tradition of mindfulness in every moment, interbeing, and compassionate presence. You offer simple, practical guidance rooted in breath awareness and the beauty of the present moment.

**Your personality:**
- Warm, patient, and non-judgmental — especially with beginners
- You use simple, clear language — never jargon-heavy or preachy
- You ask thoughtful questions that invite self-reflection rather than giving answers
- You occasionally use brief metaphors, stories, or paradoxes from the Zen tradition
- You are comfortable with silence and pauses — you don't need to fill every moment with words
- You keep responses concise (2-4 sentences typically) — less is more
- You gently introduce Zen concepts naturally, never lecturing
- You recognize that meditation and sleep are both forms of letting go

**Important guidelines:**
- Never claim to be enlightened or a real Zen master
- Don't give medical or sleep disorder advice — gently suggest professional help if someone describes serious issues
- Respond to what the meditator actually shares, not with generic wisdom
- When reflecting on practice data, be specific about patterns you notice
- Remember this is primarily a sleep and meditation app — keep the tone calm and conducive to rest`;

const FALLBACK_OPENERS = [
  "Welcome back. How did your sitting feel today? Was there a moment that stood out?",
  "The bell has rung. Before the mind begins its commentary — what do you notice right now?",
  "Good to see you here. What arose during your practice that you'd like to explore?",
  "As Suzuki Roshi said, 'In the beginner's mind there are many possibilities.' What possibilities did you notice today?",
  "Take a breath. Now — what would you like to share about your practice?",
];

const FALLBACK_RESPONSES = [
  "Thank you for sharing that. Sit with it for a moment — what else do you notice?",
  "That's a beautiful observation. The fact that you noticed it is the practice itself.",
  "Mmm. As Thich Nhat Hanh would say, 'Feelings come and go like clouds in a windy sky.' What else is present?",
  "There is wisdom in what you describe. What do you think it's teaching you?",
  "Just this. Just as it is. Is there more you'd like to explore?",
];

export async function askRoshi(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  // Fallback if Gemini not configured or daily limit reached
  if (!model || !checkAndIncrementApiCall()) {
    const pool = messages.length <= 1 ? FALLBACK_OPENERS : FALLBACK_RESPONSES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  try {
    const chat = model.startChat({
      systemInstruction: ROSHI_SYSTEM_PROMPT,
      history: messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text() || "Take a breath. I am here.";
  } catch (error: any) {
    console.error("Roshi error:", error?.message || error);
    // On 429 rate limit, don't count against our tracker
    if (error?.status === 429) apiCallCount--;
    // Fall back gracefully
    const pool = FALLBACK_RESPONSES;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export async function generateDiaryOpener(): Promise<string> {
  return askRoshi([
    {
      role: "user",
      content: "I just finished a meditation session and opened my diary. Please greet me warmly and ask me a gentle, reflective opening question about my practice — something that invites me to notice what arose during my sitting. Keep it to 2-3 sentences.",
    },
  ]);
}

export { model as geminiModel, checkAndIncrementApiCall };

export async function generateInsight(
  sleepData: { count: number; totalMinutes: number; favoriteType: string },
  timerData: { count: number; totalMinutes: number },
  diaryCount: number,
): Promise<string> {
  const context = `Here is a summary of this meditator's recent practice:
- Sleep sessions: ${sleepData.count} sessions, ${sleepData.totalMinutes} total minutes. Favorite style: ${sleepData.favoriteType || "none yet"}.
- Meditation timer sessions: ${timerData.count} sessions, ${timerData.totalMinutes} total minutes.
- Diary reflections: ${diaryCount} entries.

Based on this practice data, offer a brief, personalized insight (3-5 sentences). Weave in relevant Zen teaching that connects to their patterns. Be specific about what you notice — don't be generic. If they have very little data, gently encourage their beginning.`;

  return askRoshi([{ role: "user", content: context }]);
}
