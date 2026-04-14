import type { Metadata } from "next";

import { MarketingArticlePage } from "../marketing-article-page";

export const metadata: Metadata = {
  title: "Zen Meditation for Sleep | A Simpler Way to Calm Down at Night",
  description:
    "Curious about Zen meditation for sleep? Learn a simple, beginner-friendly way to calm mental noise at night and start BigMind Sleep free.",
};

const sections = [
  {
    title: "What Zen meditation means for sleep",
    paragraphs: [
      "In a sleep context, Zen-inspired meditation usually means noticing thoughts without chasing them, returning to the breath or body without drama, choosing simplicity over overstimulation, and letting the night be quieter without demanding instant silence.",
      "It is less about doing more and more about dropping what keeps the mind activated.",
    ],
  },
  {
    title: "Why it helps at night",
    paragraphs: [
      "A lot of sleep struggle comes from resistance. The mind starts saying things like why am I still awake, I need to fall asleep now, or I have to stop thinking.",
      "That pressure often creates even more wakefulness. Zen helps by interrupting the struggle and returning attention to something simpler.",
    ],
  },
  {
    title: "A beginner-friendly Zen approach",
    paragraphs: [
      "Try this tonight: lie down and let your body get heavy, notice the breath without trying to improve it, and when a thought appears, notice it without following it.",
      "Then return to the breath, body, or a gentle line of guidance. Repeat without judgment. That is enough.",
    ],
    orderedItems: [
      "Lie down and let your body get heavy.",
      "Notice the breath without trying to improve it.",
      "When a thought appears, notice it without following it.",
      "Return to the breath, body, or a gentle line of guidance.",
      "Repeat without judgment.",
    ],
  },
  {
    title: "What it should feel like",
    paragraphs: [
      "A useful Zen-inspired sleep meditation should feel simple, spacious, calm, low-pressure, and uncluttered.",
      "It should not feel like a performance, a philosophy lesson, or one more thing to get right before bed.",
    ],
  },
  {
    title: "What if your mind keeps talking?",
    paragraphs: [
      "That is normal. Zen does not require a silent mind. If thoughts keep coming, notice them and return.",
      "That return is the practice. The goal is not to crush thought. The goal is to stop feeding it.",
    ],
  },
  {
    title: "How BigMind approaches Zen for sleep",
    paragraphs: [
      "For sleep, Zen does not have to mean sitting upright in silence. A more useful approach is usually gentle breath awareness, light body awareness, calm guidance, and an optional soundscape if it helps reduce mental noise.",
      "The point is not purity. The point is usefulness.",
    ],
  },
] as const;

const faq = [
  {
    question: "Is Zen meditation good for sleep?",
    answer:
      "It can be, especially when it is adapted for bedtime. The most useful part is the shift away from struggle and toward simple awareness.",
  },
  {
    question: "Do I need Zen experience first?",
    answer:
      "No. A beginner-friendly Zen sleep meditation should feel simple and accessible, not formal or intimidating.",
  },
  {
    question: "What if I cannot stop thinking?",
    answer:
      "That is normal. The goal is not zero thoughts. The goal is to notice thoughts without following all of them.",
  },
  {
    question: "Does Zen meditation for sleep have to be silent?",
    answer:
      "Not at all. Many people do better with light guidance or a soundscape, especially at the beginning.",
  },
] as const;

export default function ZenMeditationForSleepPage() {
  return (
    <MarketingArticlePage
      eyebrow="BigMind Sleep guide"
      title="Zen Meditation for Sleep"
      description="A simpler way to calm mental noise at night, without turning bedtime into one more thing to do perfectly."
      sections={sections}
      faq={faq}
      inlineCta={{
        title: "Need a calmer starting point?",
        body: "BigMind Sleep uses Zen-inspired simplicity to help beginners wind down with less pressure and less mental noise.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      finalCta={{
        title: "Start with less effort tonight",
        body: "You do not need to work harder at sleep. You need a calmer, simpler way to stop feeding the mental noise that keeps you awake.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      relatedLinks={[
        { href: "/sleep-meditation-for-beginners", label: "Sleep Meditation for Beginners" },
        { href: "/body-scan-for-sleep", label: "Body Scan for Sleep" },
        { href: "/", label: "BigMind Sleep home" },
      ]}
    />
  );
}
