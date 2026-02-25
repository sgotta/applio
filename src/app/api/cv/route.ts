import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import CV from "@/lib/models/cv";
import { toSettings, docToCVData, cvDataToDoc } from "@/lib/cv-sync";
import type { CVData, CloudSettings } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/cv — Load the authenticated user's CV
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
    const doc = await CV.findOne({ userId: session.user.id });
    if (!doc) {
      return NextResponse.json(null, { status: 200 });
    }

    const plain = doc.toObject();
    return NextResponse.json({
      id: doc._id.toString(),
      cvData: docToCVData(plain),
      settings: toSettings(plain),
      isPublished: doc.isPublished,
      slug: doc.slug ?? null,
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/cv failed:", error);
    return NextResponse.json(
      { error: "Failed to load CV", code: "LOAD_FAILED" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/cv — Save (upsert) the authenticated user's CV
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    let cvData: CVData = body.cvData;
    const settings: CloudSettings | undefined = body.settings;

    // Reject base64 photos — only R2 URLs should be persisted
    if (cvData.personalInfo.photoUrl?.startsWith("data:")) {
      cvData = {
        ...cvData,
        personalInfo: { ...cvData.personalInfo, photoUrl: undefined },
      };
    }

    await connectDB();

    const update = cvDataToDoc(cvData, settings);
    const doc = await CV.findOneAndUpdate(
      { userId: session.user.id },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({
      id: doc._id.toString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/cv failed:", error);
    return NextResponse.json(
      { error: "Failed to save CV", code: "SAVE_FAILED" },
      { status: 500 },
    );
  }
}
