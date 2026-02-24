import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/lib/models/user";

// ---------------------------------------------------------------------------
// GET /api/cv/plan — Fetch the authenticated user's subscription plan
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id).select("subscription").lean();
    if (!user?.subscription) {
      return NextResponse.json({ plan: "free", isActive: false, currentPeriodEnd: null });
    }

    const { plan, currentPeriodEnd } = user.subscription;
    const isActive =
      plan === "pro" && !!currentPeriodEnd && new Date(currentPeriodEnd) > new Date();

    return NextResponse.json({
      plan: isActive ? "pro" : "free",
      isActive,
      currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("GET /api/cv/plan failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan", code: "PLAN_FETCH_FAILED" },
      { status: 500 },
    );
  }
}
