import { createClient } from "./client";
import type { CVData } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/** Shape of the settings JSONB stored in the cv_settings table */
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

/** Shape of a CV row as returned by load_full_cv() */
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
 * Uses load_full_cv() RPC to assemble from normalized tables.
 * Returns null if user has no CVs yet or on error.
 */
export async function fetchUserCV(userId: string): Promise<CVRow | null> {
  try {
    const supabase = createClient();

    // Get the most recent CV id for this user
    const { data: cvMeta, error: metaErr } = await supabase
      .from("cvs")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (metaErr) {
      console.warn("[CloudSync] Failed to fetch CV metadata:", metaErr.message);
      return null;
    }
    if (!cvMeta) return null;

    // Assemble from normalized tables via RPC
    const { data, error } = await supabase.rpc("load_full_cv", {
      p_cv_id: cvMeta.id,
    });

    if (error) {
      console.warn("[CloudSync] load_full_cv failed:", error.message);
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
 * Uses create_cv_full() RPC for atomic multi-table insert.
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

    const { data: cvId, error: createErr } = await supabase.rpc("create_cv_full", {
      p_user_id: userId,
      p_title: title || "Mi CV",
      p_personal_info: cvData.personalInfo,
      p_summary: cvData.summary,
      p_experience: cvData.experience,
      p_education: cvData.education,
      p_skills: cvData.skills,
      p_courses: cvData.courses,
      p_certifications: cvData.certifications,
      p_awards: cvData.awards,
      p_visibility: cvData.visibility,
      p_sidebar_order: cvData.sidebarOrder,
      p_settings: settings,
    });

    if (createErr || !cvId) {
      console.warn("[CloudSync] Failed to create CV:", createErr?.message);
      return null;
    }

    // Fetch the assembled row to return
    const { data, error } = await supabase.rpc("load_full_cv", {
      p_cv_id: cvId,
    });

    if (error) {
      console.warn("[CloudSync] load_full_cv after create failed:", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[CloudSync] createCV exception:", err);
    return null;
  }
}

/**
 * Update an existing CV row. Dispatches to save_cv_data and/or save_cv_settings RPCs.
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

    // Save CV data if provided
    if (updates.cv_data) {
      const d = updates.cv_data;
      const { error } = await supabase.rpc("save_cv_data", {
        p_cv_id: cvId,
        p_personal_info: d.personalInfo,
        p_summary: d.summary,
        p_experience: d.experience,
        p_education: d.education,
        p_skills: d.skills,
        p_courses: d.courses,
        p_certifications: d.certifications,
        p_awards: d.awards,
        p_visibility: d.visibility,
        p_sidebar_order: d.sidebarOrder,
      });
      if (error) {
        console.warn("[CloudSync] save_cv_data failed:", error.message);
        return false;
      }
    }

    // Save settings if provided
    if (updates.settings) {
      const s = updates.settings;
      const { error } = await supabase.rpc("save_cv_settings", {
        p_cv_id: cvId,
        p_color_scheme: s.colorScheme,
        p_font_family: s.fontFamily,
        p_font_size_level: s.fontSizeLevel,
        p_theme: s.theme,
        p_locale: s.locale,
        p_pattern_name: s.pattern.name,
        p_pattern_sidebar_intensity: s.pattern.sidebarIntensity,
        p_pattern_main_intensity: s.pattern.mainIntensity,
        p_pattern_scope: s.pattern.scope,
      });
      if (error) {
        console.warn("[CloudSync] save_cv_settings failed:", error.message);
        return false;
      }
    }

    // Update metadata fields if provided (title, is_published, slug)
    const metaUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) metaUpdates.title = updates.title;
    if (updates.is_published !== undefined) metaUpdates.is_published = updates.is_published;
    if (updates.slug !== undefined) metaUpdates.slug = updates.slug;

    if (Object.keys(metaUpdates).length > 0) {
      const { error } = await supabase.from("cvs").update(metaUpdates).eq("id", cvId);
      if (error) {
        console.warn("[CloudSync] metadata update failed:", error.message);
        return false;
      }
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

    // Save data + settings + publish metadata
    const success = await updateCV(row.id, {
      cv_data: cvData,
      settings,
      is_published: true,
      slug,
    });

    if (!success) {
      console.warn("[Share] Failed to publish CV");
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
 * Uses load_full_cv() RPC to assemble from normalized tables.
 * Uses the browser client — for SSR use fetchPublishedCVServer().
 */
export async function fetchPublishedCV(slug: string): Promise<CVRow | null> {
  try {
    const supabase = createClient();

    // Find the published CV by slug
    const { data: cvMeta, error: metaErr } = await supabase
      .from("cvs")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (metaErr || !cvMeta) {
      console.warn("[Share] Failed to fetch published CV metadata:", metaErr?.message);
      return null;
    }

    // Assemble from normalized tables
    const { data, error } = await supabase.rpc("load_full_cv", {
      p_cv_id: cvMeta.id,
    });

    if (error) {
      console.warn("[Share] load_full_cv failed:", error.message);
      return null;
    }
    return data as CVRow | null;
  } catch (err) {
    console.warn("[Share] fetchPublishedCV exception:", err);
    return null;
  }
}
