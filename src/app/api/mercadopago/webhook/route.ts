import { MercadoPagoConfig, Payment } from "mercadopago";
import { connectDB } from "@/lib/mongoose";
import User from "@/lib/models/user";

// ---------------------------------------------------------------------------
// POST /api/mercadopago/webhook — Handle Mercado Pago payment notifications
// ---------------------------------------------------------------------------

const PLAN_MONTHS: Record<string, number> = {
  "3mo": 3,
  "6mo": 6,
};

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return new Response(null, { status: 200 });
  }

  let body: { data?: { id?: string }; type?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  // Only process payment notifications
  if (body.type !== "payment" || !body.data?.id) {
    return new Response(null, { status: 200 });
  }

  try {
    const mp = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(mp).get({ id: body.data.id });

    if (payment.status !== "approved") {
      return new Response(null, { status: 200 });
    }

    // Parse external_reference: "userId|planId"
    const externalRef = payment.external_reference ?? "";
    const [userId, planId] = externalRef.split("|");

    if (!userId || !planId || !(planId in PLAN_MONTHS)) {
      console.error("Invalid external_reference:", externalRef);
      return new Response(null, { status: 200 });
    }

    const months = PLAN_MONTHS[planId];
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);

    await connectDB();

    // If user already has active pro, extend from current end date
    const user = await User.findById(userId).select("subscription").lean();
    if (
      user?.subscription?.plan === "pro" &&
      user.subscription.currentPeriodEnd &&
      new Date(user.subscription.currentPeriodEnd) > now
    ) {
      const extendFrom = new Date(user.subscription.currentPeriodEnd);
      extendFrom.setMonth(extendFrom.getMonth() + months);
      currentPeriodEnd.setTime(extendFrom.getTime());
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        "subscription.plan": "pro",
        "subscription.provider": "mercadopago",
        "subscription.customerId": String(payment.payer?.id ?? ""),
        "subscription.subscriptionId": String(payment.id ?? ""),
        "subscription.currentPeriodEnd": currentPeriodEnd,
      },
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Mercado Pago webhook processing failed:", error);
    return new Response(null, { status: 500 });
  }
}
