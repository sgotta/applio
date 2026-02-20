import { createClient } from "./client";
import type { CVData } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Shape of the settings JSONB stored in the cvs table */
export interface CloudSettings {
  colorScheme: string;
  fontFamily: string;
  fontSizeLevel: number;
  theme: string;
  locale: string;
  pattern: {
    name: string;
    sidebarIntensity: number;
    mainIntensity: number;
    scope: string;
  };
}

/** Shape of a row from the cvs table */
export interface CVRow {
  id: string;
  user_id: string;
  title: string;
  cv_data: CVData;
  settings: CloudSettings;
  is_published: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Ensure a profile row exists for the user.
 * Needed for users who signed up before the profiles migration was applied.
 * Uses upsert (INSERT ... ON CONFLICT DO NOTHING) so it's safe to call repeatedly.
 */
export async function ensureProfile(user: User): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          email: user.email ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (error) {
      console.warn("[CloudSync] Failed to ensure profile:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] ensureProfile exception:", err);
    return false;
  }
}

/**
 * Fetch the most recently updated CV for a user.
 * Returns null if user has no CVs yet or on error.
 */
export async function fetchUserCV(userId: string): Promise<CVRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[CloudSync] Failed to fetch CV:", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[CloudSync] fetchUserCV exception:", err);
    return null;
  }
}

/**
 * Insert a new CV row for the user (first-ever login scenario).
 * Returns the created row or null on error.
 */
export async function createCV(
  userId: string,
  cvData: CVData,
  settings: CloudSettings,
  title?: string,
): Promise<CVRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id: userId,
        title: title || "Mi CV",
        cv_data: cvData,
        settings,
      })
      .select()
      .single();

    if (error) {
      console.warn("[CloudSync] Failed to create CV:", error.message);
      return null;
    }
    return data as CVRow;
  } catch (err) {
    console.warn("[CloudSync] createCV exception:", err);
    return null;
  }
}

/**
 * Update an existing CV row. Only sends the fields provided.
 */
export async function updateCV(
  cvId: string,
  updates: {
    cv_data?: CVData;
    settings?: CloudSettings;
    title?: string;
    is_published?: boolean;
    slug?: string;
  },
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("cvs")
      .update(updates)
      .eq("id", cvId);

    if (error) {
      console.warn("[CloudSync] Failed to update CV:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] updateCV exception:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sharing (publish / fetch public CV)
// ---------------------------------------------------------------------------

function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * Publish (or re-publish) the user's CV.
 * Uploads the latest cv_data + settings, sets is_published = true,
 * and generates a slug if the row doesn't have one yet.
 * Returns the slug on success, null on error.
 */
export async function publishCV(
  userId: string,
  cvData: CVData,
  settings: CloudSettings,
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Fetch current row to check for existing slug
    const { data: row, error: fetchErr } = await supabase
      .from("cvs")
      .select("id, slug")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !row) {
      console.warn("[Share] Failed to fetch CV for publish:", fetchErr?.message);
      return null;
    }

    const slug = row.slug || generateSlug();

    const { error: updateErr } = await supabase
      .from("cvs")
      .update({
        cv_data: cvData,
        settings,
        is_published: true,
        slug,
      })
      .eq("id", row.id);

    if (updateErr) {
      console.warn("[Share] Failed to publish CV:", updateErr.message);
      return null;
    }

    return slug;
  } catch (err) {
    console.warn("[Share] publishCV exception:", err);
    return null;
  }
}

/**
 * Fetch a published CV by slug. Intended for the public /cv/[slug] page.
 * Uses the browser client — for SSR use fetchPublishedCVServer().
 */
export async function fetchPublishedCV(slug: string): Promise<CVRow | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.warn("[Share] Failed to fetch published CV:", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[Share] fetchPublishedCV exception:", err);
    return null;
  }
}
