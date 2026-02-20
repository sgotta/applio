import { createClient } from "./server";
import type { CVRow } from "./db";

/**
 * Fetch a published CV by slug — server-side version.
 * Uses the server Supabase client (reads cookies for auth context).
 * The RLS policy "Anyone can view published CVs" allows this without auth.
 */
export async function fetchPublishedCVServer(slug: string): Promise<CVRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.warn("[Share] Failed to fetch published CV (server):", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[Share] fetchPublishedCVServer exception:", err);
    return null;
  }
}
