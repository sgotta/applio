import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (!userId) {
      console.error("No supabase_user_id in session metadata");
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Idempotency: check if already premium before updating
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (existing?.plan !== "premium") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: "premium",
          stripe_customer_id: session.customer as string,
          stripe_payment_id: session.payment_intent as string,
          premium_since: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update profile:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
