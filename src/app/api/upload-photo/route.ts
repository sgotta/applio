import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// In-memory rate limiter (resets when serverless function recycles)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("photo");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No photo provided.", code: "NO_PHOTO" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.", code: "INVALID_TYPE" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB.", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // Optimize: resize to 300x300 max, convert to WebP 80% quality
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimized = await sharp(buffer)
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    // Generate unique filename
    const id = crypto.randomUUID();
    const key = `${id}.webp`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: optimized,
        ContentType: "image/webp",
      })
    );

    const url = `${R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again.", code: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}
