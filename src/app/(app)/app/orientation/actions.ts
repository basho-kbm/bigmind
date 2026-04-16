"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function completeOrientation() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw error;
  }

  revalidatePath("/app/orientation");
  revalidatePath("/app/settings");
  redirect("/app/today");
}
