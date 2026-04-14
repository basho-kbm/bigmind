import type { Metadata } from "next";

import { MarketingArticlePage } from "../marketing-article-page";

export const metadata: Metadata = {
  title: "Body Scan for Sleep | A Gentle Way to Fall Asleep Faster",
  description:
    "Learn how to use a gentle body scan for sleep, calm a racing mind, release physical tension, and start BigMind Sleep free tonight.",
};

const sections = [
  {
    title: "What a body scan is",
    paragraphs: [
      "A body scan is a meditation practice where you move gentle attention through different parts of your body, one area at a time.",
      "The goal is not to analyze everything you feel. The goal is to notice tension and soften around it enough that sleep has a better chance to happen.",
    ],
    bullets: [
      "your forehead",
      "jaw",
      "shoulders",
      "chest",
      "stomach",
      "hands",
      "legs",
      "feet",
    ],
  },
  {
    title: "Why a body scan helps with sleep",
    paragraphs: [
      "A lot of nighttime stress shows up in the body before we can explain it clearly. You may notice a clenched jaw, raised shoulders, tight breathing, a tense stomach, or restless legs.",
      "A body scan helps because it shifts attention away from looping thought and back into the body. That often makes the mind feel less sticky too.",
    ],
  },
  {
    title: "How to do a body scan tonight",
    paragraphs: [
      "Keep it simple. Start in bed, stop trying to force relaxation, move slowly through the body, and if your mind wanders, come back to the last body area.",
      "At each step, notice what is there first. Then let that area soften a little if it wants to.",
    ],
    bullets: [
      "forehead",
      "jaw",
      "neck",
      "shoulders",
      "chest",
      "stomach",
      "hands",
      "hips",
      "legs",
      "feet",
    ],
  },
  {
    title: "What if I cannot feel much in my body?",
    paragraphs: [
      "That is normal. Sometimes notice just means pressure against the bed, warmth, heaviness, tightness, or almost nothing at all.",
      "Almost nothing still counts. You are building steadier attention, not chasing the perfect experience.",
    ],
  },
  {
    title: "What if the body scan makes me more aware of stress?",
    paragraphs: [
      "That can happen too. Sometimes a body scan reveals how tense you already were. That does not mean it is making you worse.",
      "If that happens, shorten the scan, keep the tone gentle, use guided audio instead of self-guiding, and focus more on heaviness and warmth than on fixing everything.",
    ],
  },
  {
    title: "Why guided body scans often work better",
    paragraphs: [
      "Guided body scans often help more at bedtime because they keep the pace steady, reduce mental effort, make it easier to come back when attention drifts, and help the practice feel more supportive than effortful.",
      "That matters when the day is over and your brain is still loud.",
    ],
  },
] as const;

const faq = [
  {
    question: "Does a body scan help you fall asleep?",
    answer:
      "It can. For many people, it helps release physical tension, reduce racing thoughts, and create a calmer state that supports sleep.",
  },
  {
    question: "How long should a body scan for sleep be?",
    answer:
      "For many people, 10 to 20 minutes is enough to help them settle without making it feel like work.",
  },
  {
    question: "What if I fall asleep before the body scan ends?",
    answer: "That is completely fine. For sleep, falling asleep is not failure.",
  },
  {
    question: "Is guided audio better than doing a body scan alone?",
    answer:
      "For many beginners, yes. Guided audio reduces effort and makes it easier to stay with the practice when you are tired.",
  },
] as const;

export default function BodyScanForSleepPage() {
  return (
    <MarketingArticlePage
      eyebrow="BigMind Sleep guide"
      title="Body Scan for Sleep"
      description="A gentle way to release tension, calm a racing mind, and make it easier to fall asleep tonight."
      sections={sections}
      faq={faq}
      inlineCta={{
        title: "Need gentle guidance?",
        body: "BigMind Sleep gives you a beginner-friendly guided session so you do not have to self-guide the whole thing when you are already tired.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      finalCta={{
        title: "Try one calmer bedtime tonight",
        body: "You do not need a complicated nighttime routine. You need one gentle way to stop carrying the whole day into bed.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      relatedLinks={[
        { href: "/sleep-meditation-for-beginners", label: "Sleep Meditation for Beginners" },
        { href: "/", label: "BigMind Sleep home" },
      ]}
    />
  );
}
