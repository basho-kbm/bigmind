import type { Metadata } from "next";

import { MarketingArticlePage } from "../marketing-article-page";

export const metadata: Metadata = {
  title: "Sleep Meditation for Beginners | A Simple Way to Wind Down Tonight",
  description:
    "New to sleep meditation? Learn a simple, beginner-friendly way to wind down tonight, calm a racing mind, and start BigMind Sleep free.",
};

const sections = [
  {
    title: "What sleep meditation actually is",
    paragraphs: [
      "Sleep meditation is a gentle way to help your mind and body slow down before bed.",
      "The goal is not to become good at meditation. The goal is to get quieter, less mentally hooked, and more ready for sleep.",
    ],
    bullets: [
      "slower breathing",
      "softer body awareness",
      "simple guidance that keeps you from spiraling into tomorrow",
      "a calmer rhythm that makes it easier to let go",
    ],
  },
  {
    title: "Why beginners struggle with it",
    paragraphs: [
      "Sleep meditation often feels harder than it needs to because it gets explained in vague language, feels like something you have to do correctly, offers too many choices, and creates the expectation of instant silence.",
      "None of that means it is not for you. It usually just means the starting point is wrong.",
    ],
  },
  {
    title: "A simpler way to start tonight",
    paragraphs: [
      "If you are new, keep it simple. Pick one guided sleep session, let the guidance carry the work, and aim for softer, not perfect.",
      "You do not need to clear your mind, focus perfectly, or do it the right way. You just need a calmer entry into the night.",
    ],
    orderedItems: [
      "Pick one short guided sleep session.",
      "Let the guidance carry the work.",
      "Aim for softer, not perfect.",
    ],
  },
  {
    title: "What a good beginner sleep session should feel like",
    paragraphs: [
      "A helpful beginner sleep meditation should feel calm, simple, lightly guided, easy to start when you are tired, and useful on night one.",
      "It should not feel like homework, performance, or something you need experience for first.",
    ],
  },
  {
    title: "What if your mind keeps racing?",
    paragraphs: [
      "That is normal. If thoughts keep showing up, notice them, do not fight them, and come back to the next breath, body cue, or line of guidance.",
      "That return is the practice. You do not need zero thoughts for sleep meditation to help.",
    ],
  },
  {
    title: "A beginner sleep routine for tonight",
    paragraphs: [
      "If you want the easiest possible version, use this tonight.",
    ],
    orderedItems: [
      "Get into bed first.",
      "Put your phone on audio-only mode if needed.",
      "Press play on one guided session.",
      "Follow the next instruction.",
      "If your attention drifts, gently come back.",
      "If you fall asleep, let that happen.",
    ],
  },
] as const;

const faq = [
  {
    question: "Is sleep meditation good for beginners?",
    answer:
      "Yes. Beginners often do best with short, guided sleep meditations that feel simple and low-pressure.",
  },
  {
    question: "What if I cannot stop thinking?",
    answer:
      "That is normal. The goal is not to stop thoughts completely. The goal is to stop getting pulled around by every thought long enough to settle down.",
  },
  {
    question: "How long should beginner sleep meditation be?",
    answer: "For many people, 10 to 20 minutes is a strong starting range.",
  },
  {
    question: "Should I start with breathing, a body scan, or a soundscape?",
    answer:
      "If you are new, start with the simplest guided default. You can personalize later once you know what helps you most.",
  },
] as const;

export default function SleepMeditationForBeginnersPage() {
  return (
    <MarketingArticlePage
      eyebrow="BigMind Sleep guide"
      title="Sleep Meditation for Beginners"
      description="A simple way to wind down tonight, even if meditation usually feels hard, abstract, or intimidating."
      sections={sections}
      faq={faq}
      inlineCta={{
        title: "Need an easy place to start?",
        body: "BigMind Sleep is designed to give you one simple, beginner-friendly guided session that helps you wind down tonight.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      finalCta={{
        title: "Start with one calmer night",
        body: "You do not need a perfect sleep routine. You need one simple session that helps you wind down tonight.",
        label: "Start BigMind Sleep free",
        href: "/login",
      }}
      relatedLinks={[
        { href: "/body-scan-for-sleep", label: "Body Scan for Sleep" },
        { href: "/", label: "BigMind Sleep home" },
      ]}
    />
  );
}
