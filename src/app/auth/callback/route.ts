import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/editor";

  console.log("[auth/callback]", { code: !!code, next, url: request.url });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] exchange:", error ? `FAIL: ${error.message}` : "OK");
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's no code or exchange failed, redirect to editor
  return NextResponse.redirect(`${origin}${next}`);
}
