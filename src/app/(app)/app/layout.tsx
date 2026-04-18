import Link from "next/link";

import { requireUser } from "@/lib/auth";

import { SignOutForm } from "./sign-out-form";

const appNav = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/orientation", label: "Orientation" },
  { href: "/app/today", label: "Today" },
  { href: "/app/journal", label: "Journal" },
  { href: "/app/insights", label: "Insights" },
  { href: "/app/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8 lg:px-6 lg:py-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col rounded-3xl border border-stone-800 bg-stone-900/60 p-4 sm:p-5 lg:p-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind</p>
            <h1 className="text-2xl font-semibold">BigMind Sleep</h1>
            <p className="text-sm text-stone-300">Signed in as {user.email ?? "unknown user"}</p>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {appNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-stone-800 px-4 py-2 text-sm text-stone-200 transition hover:bg-stone-800 hover:text-white lg:block lg:rounded-2xl lg:border-transparent lg:px-4 lg:py-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 lg:mt-auto lg:pt-6">
            <SignOutForm />
          </div>
        </aside>
        <main className="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
