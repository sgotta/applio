import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import CV from "@/lib/models/cv";

// ---------------------------------------------------------------------------
// POST /api/cv/publish — Publish the user's CV (generate slug if needed)
// ---------------------------------------------------------------------------

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const doc = await CV.findOne({ userId: session.user.id });
    if (!doc) {
      return NextResponse.json(
        { error: "CV not found", code: "CV_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (!doc.slug) {
      doc.slug = Math.random().toString(36).substring(2, 10);
    }
    doc.isPublished = true;
    await doc.save();

    return NextResponse.json({ slug: doc.slug });
  } catch (error) {
    console.error("POST /api/cv/publish failed:", error);
    return NextResponse.json(
      { error: "Failed to publish CV", code: "PUBLISH_FAILED" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/cv/publish — Unpublish the user's CV
// ---------------------------------------------------------------------------

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    await CV.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { isPublished: false } },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/cv/publish failed:", error);
    return NextResponse.json(
      { error: "Failed to unpublish CV", code: "UNPUBLISH_FAILED" },
      { status: 500 },
    );
  }
}
