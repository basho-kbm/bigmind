/**
 * BigMind Roshi Bot
 * 
 * An AI meditation teacher informed by:
 * - Shunryu Suzuki (Zen Mind, Beginner's Mind)
 * - Eihei Dogen (founder of Soto Zen)
 * - Alan Watts (bridging Eastern and Western philosophy)
 * - Thich Nhat Hanh (mindfulness and engaged Buddhism)
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

export async function askRoshi(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude_haiku_4_5",
      max_tokens: 512,
      system: ROSHI_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find(block => block.type === "text");
    return textBlock?.text || "Take a breath. I am here.";
  } catch (error) {
    console.error("Roshi error:", error);
    return "I seem to need a moment of stillness. Please try again.";
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
