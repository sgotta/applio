"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useCV } from "@/lib/cv-context";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useAppLocale } from "@/lib/locale-context";
import { useFontSettings } from "@/lib/font-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProfileSocialLinks, ProfileVisibleSections } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Check, Copy, ExternalLink,
  Github, Twitter, Instagram, Youtube,
  Linkedin, Globe, Dribbble, BookOpen,
  Code, Layers,
} from "lucide-react";

/* ── Social link definitions ────────────────────────── */

interface SocialField {
  key: keyof ProfileSocialLinks;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}

const SOCIAL_FIELDS: SocialField[] = [
  { key: "github_url", label: "GitHub", icon: Github, placeholder: "https://github.com/username" },
  { key: "twitter_url", label: "X / Twitter", icon: Twitter, placeholder: "https://x.com/username" },
  { key: "instagram_url", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/username" },
  { key: "youtube_url", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@channel" },
  { key: "linkedin_url", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
  { key: "website_url", label: "Website", icon: Globe, placeholder: "https://yoursite.com" },
  { key: "dribbble_url", label: "Dribbble", icon: Dribbble, placeholder: "https://dribbble.com/username" },
  { key: "behance_url", label: "Behance", icon: Globe, placeholder: "https://behance.net/username" },
  { key: "medium_url", label: "Medium", icon: BookOpen, placeholder: "https://medium.com/@username" },
  { key: "dev_to_url", label: "Dev.to", icon: Code, placeholder: "https://dev.to/username" },
  { key: "tiktok_url", label: "TikTok", icon: Globe, placeholder: "https://tiktok.com/@username" },
  { key: "stackoverflow_url", label: "Stack Overflow", icon: Layers, placeholder: "https://stackoverflow.com/users/id" },
];

/* ── Slug helpers ───────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ── Component ──────────────────────────────────────── */

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PublishDialog = memo(function PublishDialog({
  open,
  onOpenChange,
}: PublishDialogProps) {
  const { user } = useAuth();
  const { data } = useCV();
  const { colorSchemeName } = useColorScheme();
  const { locale } = useAppLocale();
  const { fontFamilyId } = useFontSettings();
  const t = useTranslations("publish");

  // Form state
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<ProfileSocialLinks>({});
  const [visibleSections, setVisibleSections] = useState<ProfileVisibleSections>({
    bio: true,
    skills: true,
    experience: true,
    education: true,
    courses: false,
    certifications: false,
    awards: false,
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [existingProfile, setExistingProfile] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const slugCheckTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Pre-fill form from CV data when dialog opens
  useEffect(() => {
    if (!open || !user) return;

    // Pre-fill from CV
    if (!slug) {
      setSlug(slugify(data.personalInfo.fullName));
    }
    if (!bio) {
      setBio(data.summary || "");
    }

    // Pre-fill social links from existing CV data
    setSocialLinks((prev) => ({
      ...prev,
      linkedin_url: prev.linkedin_url || data.personalInfo.linkedinUrl || "",
      website_url: prev.website_url || data.personalInfo.websiteUrl || "",
    }));

    // Load existing profile if any
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, slug, bio, visible_sections, linkedin_url, website_url, github_url, twitter_url, instagram_url, youtube_url, tiktok_url, dribbble_url, behance_url, medium_url, dev_to_url, stackoverflow_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data: profile }) => {
        if (profile) {
          setExistingProfile(profile.id);
          setSlug(profile.slug);
          if (profile.bio) setBio(profile.bio);
          if (profile.visible_sections) {
            setVisibleSections(profile.visible_sections as ProfileVisibleSections);
          }
          setSocialLinks({
            linkedin_url: profile.linkedin_url || "",
            website_url: profile.website_url || "",
            github_url: profile.github_url || "",
            twitter_url: profile.twitter_url || "",
            instagram_url: profile.instagram_url || "",
            youtube_url: profile.youtube_url || "",
            tiktok_url: profile.tiktok_url || "",
            dribbble_url: profile.dribbble_url || "",
            behance_url: profile.behance_url || "",
            medium_url: profile.medium_url || "",
            dev_to_url: profile.dev_to_url || "",
            stackoverflow_url: profile.stackoverflow_url || "",
          });
          setSlugAvailable(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  // Check slug availability with debounce
  const checkSlug = useCallback(
    (value: string) => {
      if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
      if (!value || value.length < 2) {
        setSlugAvailable(null);
        return;
      }
      setCheckingSlug(true);
      slugCheckTimeout.current = setTimeout(async () => {
        const supabase = createClient();
        const { data: existing } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("slug", value)
          .single();

        if (!existing) {
          setSlugAvailable(true);
        } else if (existing.user_id === user?.id) {
          setSlugAvailable(true); // Own slug
        } else {
          setSlugAvailable(false);
        }
        setCheckingSlug(false);
      }, 500);
    },
    [user?.id]
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      const clean = slugify(value);
      setSlug(clean);
      setSlugAvailable(null);
      checkSlug(clean);
    },
    [checkSlug]
  );

  const handleSocialChange = useCallback(
    (key: keyof ProfileSocialLinks, value: string) => {
      setSocialLinks((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleSection = useCallback(
    (key: keyof ProfileVisibleSections) => {
      setVisibleSections((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  // Upload photo to R2 and get URL
  const uploadPhoto = useCallback(async (): Promise<string | undefined> => {
    if (!data.personalInfo.photo) return undefined;
    try {
      const res = await fetch(data.personalInfo.photo);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("photo", blob, "photo.jpg");
      const uploadRes = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const result = await uploadRes.json();
      if (result.success && result.url) return result.url;
    } catch {
      // Photo upload failed — continue without
    }
    return undefined;
  }, [data.personalInfo.photo]);

  // Publish / update profile
  const handlePublish = useCallback(async () => {
    if (!user || !slug || slug.length < 2 || slugAvailable === false) return;
    setSaving(true);

    try {
      const photoUrl = await uploadPhoto();
      const supabase = createClient();

      // Build flat profile row matching DB columns
      const profileRow: Record<string, unknown> = {
        user_id: user.id,
        slug,
        display_name: data.personalInfo.fullName,
        title: data.personalInfo.title || null,
        bio: bio || null,
        // Only set photo_url if a new photo was uploaded (avoid overwriting existing with null)
        ...(photoUrl ? { photo_url: photoUrl } : existingProfile ? {} : { photo_url: null }),
        email: data.personalInfo.email || null,
        phone: data.personalInfo.phone || null,
        location: data.personalInfo.location || null,
        // Social links — flatten into columns
        linkedin_url: socialLinks.linkedin_url || null,
        website_url: socialLinks.website_url || null,
        github_url: socialLinks.github_url || null,
        twitter_url: socialLinks.twitter_url || null,
        instagram_url: socialLinks.instagram_url || null,
        youtube_url: socialLinks.youtube_url || null,
        tiktok_url: socialLinks.tiktok_url || null,
        dribbble_url: socialLinks.dribbble_url || null,
        behance_url: socialLinks.behance_url || null,
        medium_url: socialLinks.medium_url || null,
        dev_to_url: socialLinks.dev_to_url || null,
        stackoverflow_url: socialLinks.stackoverflow_url || null,
        // CV sections as JSON
        skills: data.skills,
        experience: data.experience,
        education: data.education,
        courses: data.courses,
        certifications: data.certifications,
        awards: data.awards,
        // Settings
        color_scheme: colorSchemeName,
        locale,
        font_family: fontFamilyId,
        visible_sections: visibleSections,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (existingProfile) {
        ({ error } = await supabase
          .from("profiles")
          .update(profileRow)
          .eq("id", existingProfile));
      } else {
        ({ error } = await supabase.from("profiles").insert(profileRow));
      }

      if (error) {
        console.error("Profile save error:", error);
        toast.error(t("saveError"));
      } else {
        const url = `${window.location.origin}/p/${slug}`;
        setPublishedUrl(url);
        toast.success(existingProfile ? t("updated") : t("published"));
      }
    } catch (err) {
      console.error("Publish failed:", err);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }, [
    user, slug, slugAvailable, bio, socialLinks, visibleSections,
    data, colorSchemeName, locale, fontFamilyId, existingProfile, uploadPhoto, t,
  ]);

  const copyUrl = useCallback(async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      toast.success(t("linkCopied"));
    } catch {
      window.open(publishedUrl, "_blank");
    }
  }, [publishedUrl, t]);

  if (!user) return null;

  // Success view
  if (publishedUrl) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setPublishedUrl(null); } onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t("publishedTitle")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("publishedDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
              {publishedUrl}
            </span>
            <button
              onClick={copyUrl}
              className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingProfile ? t("updateTitle") : t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Slug */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("slugLabel")}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">/p/</span>
              <div className="relative flex-1">
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="tu-nombre"
                  className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  {!checkingSlug && slugAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                  {!checkingSlug && slugAvailable === false && <span className="text-xs text-red-500">{t("slugTaken")}</span>}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">{t("slugHint")}</p>
          </div>

          <Separator />

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("bioLabel")}
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Sections to show */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("sectionsLabel")}
            </label>
            <div className="space-y-2">
              {(Object.keys(visibleSections) as (keyof ProfileVisibleSections)[]).map((key) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t(`section_${key}`)}</span>
                  <Switch checked={visibleSections[key]} onCheckedChange={() => toggleSection(key)} />
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Social links */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("socialLabel")}
            </label>
            <div className="space-y-2">
              {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <Input
                    value={(socialLinks[key] as string) || ""}
                    onChange={(e) => handleSocialChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={saving || !slug || slug.length < 2 || slugAvailable === false}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {existingProfile ? t("updateButton") : t("publishButton")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
