import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Moon,
  Timer,
  BookHeart,
  BarChart3,
  Sunrise,
  Check,
  Sparkles,
  Crown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BigMindLogo } from "@/components/BigMindLogo";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={`scroll-mt-20 ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
    >
      {children}
    </motion.section>
  );
}

/* ─── pricing data ─── */
const features = [
  "Guided sleep meditations",
  "Daily guided meditation",
  "Meditation timer with bells",
  "AI meditation journal (Roshi)",
  "Personal practice insights",
  "Full audio library access",
  "New content added regularly",
];

/* ─── main component ─── */
export default function LandingPage() {
  const [showHeader, setShowHeader] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (y) => {
      setShowHeader(y > 100);
    });
  }, [scrollY]);

  const smoothScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ═══ STICKY HEADER ═══ */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl"
        initial={{ y: -80 }}
        animate={{ y: showHeader ? 0 : -80 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BigMindLogo className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight">BigMind</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => smoothScroll("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => smoothScroll("how-it-works")} className="hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => smoothScroll("pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => smoothScroll("faq")} className="hover:text-foreground transition-colors">FAQ</button>
          </nav>
          <Link href="/register">
            <Button size="sm">Start Free Trial</Button>
          </Link>
        </div>
      </motion.header>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px]" />
        </div>

        <motion.div
          className="relative z-10 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* breathing logo */}
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block"
            >
              <BigMindLogo className="w-20 h-20 text-primary mx-auto" />
            </motion.div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-display font-semibold tracking-tight leading-[1.1] mb-6"
          >
            Sleep deeply.
            <br />
            Wake mindfully.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10"
          >
            AI-guided meditations and a Zen companion that adapts to your practice
          </motion.p>

          <motion.div variants={fadeUp} custom={3}>
            <Link href="/register">
              <Button size="lg" className="text-base px-8 py-3 h-auto rounded-lg">
                Start Your Free Trial
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              14 days free. No credit card required.
            </p>
          </motion.div>
        </motion.div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ opacity: [0.3, 0.7, 0.3], y: [0, 6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <Section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold">
              Everything you need to deepen your practice
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
          >
            {[
              {
                icon: Moon,
                title: "BigMind Sleep",
                desc: "Choose from 12 meditation styles — body scan, breath awareness, Zen stories, ambient soundscapes — each generated fresh by AI in the voice of your choice.",
              },
              {
                icon: Timer,
                title: "Meditation Timer",
                desc: "A clean, distraction-free timer with gentle bells. Set your duration, sit, and let the silence do its work.",
              },
              {
                icon: BookHeart,
                title: "Roshi AI",
                desc: "Your personal Zen teacher, informed by the great masters. Reflect on your practice through guided conversation.",
              },
              {
                icon: BarChart3,
                title: "Practice Insights",
                desc: "AI-powered observations about your meditation journey. See patterns, track consistency, and deepen your understanding.",
              },
              {
                icon: Sunrise,
                title: "Daily Meditation",
                desc: "A fresh guided meditation every day, exploring core Zen concepts. Just press play \u2014 no choices needed.",
              },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 h-full transition-colors hover:border-primary/20 hover:bg-card/70">
                  <f.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ═══ HOW IT WORKS ═══ */}
      <Section id="how-it-works" className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold">
              Three steps to stillness
            </h2>
          </motion.div>

          <div className="relative">
            {/* connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2" />

            <motion.div className="space-y-12 md:space-y-16" variants={stagger}>
              {[
                {
                  num: "1",
                  title: "Choose your practice",
                  desc: "Pick a guided sleep meditation or set the silent timer for open awareness.",
                },
                {
                  num: "2",
                  title: "Let AI create your session",
                  desc: "Our AI generates a unique meditation script and narrates it in your preferred voice.",
                },
                {
                  num: "3",
                  title: "Reflect with Roshi",
                  desc: "After your practice, Roshi — your AI Zen companion — guides a journal conversation about what arose.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  custom={i}
                  className={`flex flex-col md:flex-row items-center gap-6 md:gap-10 ${
                    i % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1 text-center md:text-left">
                    {i % 2 === 1 && <div className="hidden md:block" />}
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary bg-background text-primary font-display text-xl font-semibold shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══ WISDOM / CREDIBILITY ═══ */}
      <Section id="wisdom" className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">Wisdom</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold">
              Guided by Zen Masters
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            variants={stagger}
          >
            {[
              {
                name: "Beginner's Mind",
                concept: "Shoshin",
                desc: "In the beginner's mind there are many possibilities; in the expert's mind there are few.",
              },
              {
                name: "Being-Time",
                concept: "Uji",
                desc: "Every moment is all being; each moment is the entire world. Reflect on whether any being or world is left out.",
              },
              {
                name: "The Art of Letting Go",
                concept: "Wu Wei",
                desc: "Muddy water is best cleared by leaving it alone. The mind settles when you stop trying to settle it.",
              },
              {
                name: "Mindful Presence",
                concept: "Sati",
                desc: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
              },
            ].map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <div className="rounded-xl border border-border/40 bg-card/30 p-5 md:p-6 h-full text-center">
                  <h3 className="font-semibold text-sm md:text-base mb-1">{t.name}</h3>
                  <p className="text-primary text-xs md:text-sm font-medium mb-3">
                    {t.concept}
                  </p>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ═══ PRICING ═══ */}
      <Section id="pricing" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">
              Start with 14 days free. No credit card required.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 gap-6" variants={stagger}>
            {/* Monthly */}
            <motion.div variants={fadeUp}>
              <Card className="border-border/50 bg-card/50 backdrop-blur h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Monthly</CardTitle>
                  <CardDescription>Perfect for trying premium</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$11.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Annual */}
            <motion.div variants={fadeUp}>
              <Card className="border-primary/30 bg-card/50 backdrop-blur relative ring-1 ring-primary/20 shadow-lg shadow-primary/5 h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" /> Save 17%
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Annual <Crown className="w-5 h-5 text-primary" />
                  </CardTitle>
                  <CardDescription>Best value for committed practitioners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$119</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    That's just <strong className="text-foreground">$9.92/month</strong> — save 17%
                  </p>
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button className="w-full">Start Free Trial</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold">
              Common questions
            </h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  q: "What is BigMind?",
                  a: "BigMind is an AI-powered meditation and sleep platform. It generates personalized guided meditations, provides a silent meditation timer, and includes Roshi — an AI Zen teacher for post-practice reflection.",
                },
                {
                  q: "Is the free trial really free?",
                  a: "Yes. You get 14 days of full access to every feature with no credit card required. If you love it, subscribe to continue.",
                },
                {
                  q: "What meditation styles are available?",
                  a: "12 styles across three categories: ambient soundscapes (ocean, forest, jungle, orchestra), guided meditations (body scan, breath awareness, open awareness), and Zen explorations (beginner's mind, impermanence, emptiness, exploring the self, Zen stories).",
                },
                {
                  q: "Who is Roshi?",
                  a: "Roshi is BigMind's AI meditation companion. Drawing on the wisdom of Zen masters, Roshi engages you in reflective dialogue about your practice through the meditation diary.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. Cancel your subscription at any time through your account page. No fees, no hassle.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/40 rounded-lg px-5 bg-card/30"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <Section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp}>
            <BigMindLogo className="w-12 h-12 text-primary mx-auto mb-6" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-display font-semibold mb-6"
          >
            Begin your practice
          </motion.h2>
          <motion.div variants={fadeUp}>
            <Link href="/register">
              <Button size="lg" className="text-base px-8 py-3 h-auto rounded-lg">
                Start Your Free Trial
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/30 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BigMindLogo className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">BigMind</span>
            <span className="text-muted-foreground text-sm">· Meditation & Sleep</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 BigMind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
