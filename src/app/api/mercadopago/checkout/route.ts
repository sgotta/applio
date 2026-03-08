import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// POST /api/mercadopago/checkout — Create a Mercado Pago Checkout Pro preference
// ---------------------------------------------------------------------------

const PLANS = {
  "3mo": { months: 3, price: 19000, title: "Applio Pro — 3 meses" },
  "6mo": { months: 6, price: 33000, title: "Applio Pro — 6 meses" },
} as const;

type PlanId = keyof typeof PLANS;

function isPlanId(value: string): value is PlanId {
  return value in PLANS;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("MP_ACCESS_TOKEN is not configured");
    return NextResponse.json(
      { error: "Payment provider not configured", code: "MP_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const planId = body?.planId as string | undefined;

  if (!planId || !isPlanId(planId)) {
    return NextResponse.json(
      { error: "Invalid plan", code: "INVALID_PLAN" },
      { status: 400 },
    );
  }

  const plan = PLANS[planId];
  const headerUrl = request.headers.get("origin") || request.headers.get("referer");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || headerUrl || "http://localhost:3000").replace(/\/$/, "");

  try {
    const mp = new MercadoPagoConfig({ accessToken });
    const preference = await new Preference(mp).create({
      body: {
        items: [
          {
            id: `applio-pro-${planId}`,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "ARS",
          },
        ],
        payer: {
          email: session.user.email ?? undefined,
        },
        back_urls: {
          success: `${siteUrl}/checkout/success`,
          failure: `${siteUrl}/editor`,
          pending: `${siteUrl}/checkout/success`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        external_reference: `${session.user.id}|${planId}`,
        statement_descriptor: "APPLIO PRO",
      },
    });

    return NextResponse.json({ initPoint: preference.init_point });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Mercado Pago preference creation failed:", message, error);
    return NextResponse.json(
      { error: "Failed to create payment", code: "MP_CREATE_FAILED", detail: message },
      { status: 500 },
    );
  }
}
