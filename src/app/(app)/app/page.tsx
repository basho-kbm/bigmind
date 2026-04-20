import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { ensureProfile, getBillingProfile } from "@/lib/billing";

export default async function AppPage() {
  const user = await requireUser();
  const billing = await getBillingProfile();
  const profile =
    billing?.profile ??
    (await ensureProfile({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
    }));

  redirect(profile.onboarding_completed ? "/app/today" : "/app/orientation");
}
