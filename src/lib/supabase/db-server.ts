import { createClient } from "./server";
import type { CVRow } from "./db";

/**
 * Fetch a published CV by slug — server-side version.
 * Uses load_full_cv() RPC to assemble from normalized tables.
 * Uses the server Supabase client (reads cookies for auth context).
 * The RLS policy "Anyone can view published CVs" allows this without auth.
 */
export async function fetchPublishedCVServer(slug: string): Promise<CVRow | null> {
  try {
    const supabase = await createClient();

    // Find the published CV by slug
    const { data: cvMeta, error: metaErr } = await supabase
      .from("cvs")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (metaErr || !cvMeta) {
      console.warn("[Share] Failed to fetch published CV metadata (server):", metaErr?.message);
      return null;
    }

    // Assemble from normalized tables
    const { data, error } = await supabase.rpc("load_full_cv", {
      p_cv_id: cvMeta.id,
    });

    if (error) {
      console.warn("[Share] load_full_cv (server) failed:", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[Share] fetchPublishedCVServer exception:", err);
    return null;
  }
}
