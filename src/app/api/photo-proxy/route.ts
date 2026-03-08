import { NextRequest, NextResponse } from "next/server";

const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";

/**
 * Proxy route to fetch R2 photos server-side, bypassing browser CORS.
 * Only allows fetching from our own R2 public URL domain.
 *
 * GET /api/photo-proxy?url=https://pub-xxx.r2.dev/uuid.webp
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Security: only allow our R2 domain
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "image/webp";
    const buffer = Buffer.from(await res.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
