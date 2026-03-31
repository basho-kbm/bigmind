import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

const ACTIVE_STATUSES = new Set(["trialing", "active"]);

type ProfileRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  onboarding_completed: boolean;
  beginner_focus: boolean;
  sleep_focus: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
};

export const getBillingProfile = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw error;
  }

  return {
    user,
    profile: data,
    isSubscribed: Boolean(data?.subscription_status && ACTIVE_STATUSES.has(data.subscription_status)),
  };
});

export async function ensureStripeCustomer(params: {
  userId: string;
  email: string | null | undefined;
  fullName?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", params.userId)
    .maybeSingle<{ stripe_customer_id?: string | null; full_name?: string | null }>();

  if (loadError) {
    throw loadError;
  }

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: params.email ?? undefined,
    name: params.fullName ?? existing?.full_name ?? undefined,
    metadata: {
      supabase_user_id: params.userId,
    },
  });

  const { error: updateError } = await admin
    .from("profiles")
    .upsert(
      {
        id: params.userId,
        stripe_customer_id: customer.id,
        full_name: params.fullName ?? existing?.full_name ?? null,
      },
      { onConflict: "id" },
    );

  if (updateError) {
    throw updateError;
  }

  return customer.id;
}

export async function syncSubscriptionFromStripe(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.supabase_user_id || subscription.items.data[0]?.price.metadata?.supabase_user_id;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  if (!userId || !customerId) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      },
      { onConflict: "id" },
    );

  if (error) {
    throw error;
  }

  return subscription;
}

export async function markSubscriptionCanceled(params: { subscriptionId: string; customerId?: string | null }) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("profiles").update({
    subscription_status: "canceled",
  });

  if (params.subscriptionId) {
    query = query.eq("stripe_subscription_id", params.subscriptionId);
  }

  const { error } = await query;

  if (error && params.customerId) {
    const retry = await admin
      .from("profiles")
      .update({ subscription_status: "canceled" })
      .eq("stripe_customer_id", params.customerId);

    if (retry.error) {
      throw retry.error;
    }
  } else if (error) {
    throw error;
  }
}
