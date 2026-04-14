import Link from "next/link";

type ArticleSection = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  orderedItems?: readonly string[];
};

type FaqItem = {
  question: string;
  answer: string;
};

type CtaBlock = {
  title: string;
  body: string;
  label: string;
  href: string;
};

type RelatedLink = {
  href: string;
  label: string;
};

type MarketingArticlePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: readonly ArticleSection[];
  faq: readonly FaqItem[];
  inlineCta?: CtaBlock;
  inlineCtaAfterSection?: number;
  finalCta: CtaBlock;
  relatedLinks?: readonly RelatedLink[];
};

export function MarketingArticlePage({
  eyebrow,
  title,
  description,
  sections,
  faq,
  inlineCta,
  inlineCtaAfterSection = 2,
  finalCta,
  relatedLinks = [],
}: MarketingArticlePageProps) {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <section className="flex flex-col gap-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            {eyebrow}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
            <p className="max-w-3xl text-lg text-stone-300 sm:text-xl">{description}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href={finalCta.href}
              className="rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              {finalCta.label}
            </Link>
            <Link
              href="/"
              className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
            >
              Back to BigMind Sleep
            </Link>
          </div>
        </section>

        <article className="space-y-8 rounded-3xl border border-stone-800 bg-stone-900/50 p-8 sm:p-10">
          {sections.map((section, index) => (
            <div key={section.title} className="space-y-4">
              <h2 className="text-2xl font-medium text-stone-50">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-7 text-stone-300 sm:text-lg">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="space-y-3 pl-5 text-base text-stone-200 sm:text-lg">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="list-disc">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.orderedItems ? (
                <ol className="space-y-3 pl-5 text-base text-stone-200 sm:text-lg">
                  {section.orderedItems.map((item) => (
                    <li key={item} className="list-decimal">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : null}

              {inlineCta && index === inlineCtaAfterSection ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                  <p className="text-xl font-medium text-stone-50">{inlineCta.title}</p>
                  <p className="mt-3 text-base leading-7 text-stone-200">{inlineCta.body}</p>
                  <Link
                    href={inlineCta.href}
                    className="mt-5 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
                  >
                    {inlineCta.label}
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </article>

        <section className="rounded-3xl border border-stone-800 bg-stone-900/40 p-8 sm:p-10">
          <h2 className="text-2xl font-medium text-stone-50">FAQ</h2>
          <div className="mt-6 space-y-6">
            {faq.map((item) => (
              <div key={item.question} className="space-y-2">
                <h3 className="text-lg font-medium text-stone-100">{item.question}</h3>
                <p className="text-base leading-7 text-stone-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {relatedLinks.length ? (
          <section className="rounded-3xl border border-stone-800 bg-stone-900/40 p-8">
            <h2 className="text-2xl font-medium text-stone-50">Related guides</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8 text-center sm:p-10">
          <p className="text-3xl font-medium text-stone-50">{finalCta.title}</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-200">{finalCta.body}</p>
          <Link
            href={finalCta.href}
            className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
          >
            {finalCta.label}
          </Link>
        </section>
      </div>
    </main>
  );
}
