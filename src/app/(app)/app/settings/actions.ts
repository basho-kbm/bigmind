"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/billing";

export async function saveProfileSettings(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile({
    userId: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name ?? null,
  });

  const admin = createSupabaseAdminClient();
  const fullNameRaw = formData.get("full_name");
  const fullName = typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName || null,
      beginner_focus: formData.get("beginner_focus") === "on",
      sleep_focus: formData.get("sleep_focus") === "on",
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/app/orientation");
  revalidatePath("/app/settings");
  redirect("/app/settings");
}
