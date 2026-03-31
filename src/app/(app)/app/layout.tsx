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
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind</p>
            <h1 className="text-2xl font-semibold">Roshi-bot operator shell</h1>
            <p className="text-sm text-stone-300">Signed in as {user.email ?? "unknown user"}</p>
          </div>
          <nav className="mt-8 space-y-2">
            {appNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm text-stone-200 transition hover:bg-stone-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6">
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
