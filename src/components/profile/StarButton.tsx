"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ── Inline OAuth icons (same as LoginDialog) ────────── */

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ── Pending star intent key ─────────────────────────── */

const PENDING_STAR_KEY = "applio-pending-star";

/* ── Props ────────────────────────────────────────────── */

interface StarButtonProps {
  profileId: string;
  profileUserId: string;
  initialCount: number;
  accentColor: string;
  isLightSidebar: boolean;
}

/* ── Component ───────────────────────────────────────── */

export const StarButton = memo(function StarButton({
  profileId,
  profileUserId,
  initialCount,
  accentColor,
  isLightSidebar,
}: StarButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginLoading, setLoginLoading] = useState<"google" | "github" | null>(null);
  const pendingStarHandled = useRef(false);

  const isOwnProfile = userId === profileUserId;

  // Toggle star via RPC
  const doToggleStar = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("toggle_star", {
        p_profile_id: profileId,
      });
      if (error) {
        console.error("Star toggle failed:", error.message, error);
        return;
      }
      if (data?.error) {
        console.warn("Star rejected:", data.error);
        return;
      }
      if (data) {
        setStarred(data.starred);
        setCount(data.star_count);
      }
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Check auth state + existing star + pending intent
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      const isOwn = user.id === profileUserId;

      // Check if already starred
      supabase
        .from("stars")
        .select("id")
        .eq("profile_id", profileId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: star, error }) => {
          if (error) console.warn("Star check failed:", error.message);
          const alreadyStarred = !!star;
          setStarred(alreadyStarred);

          // Auto-star if there's a pending intent from before OAuth
          if (
            !pendingStarHandled.current &&
            !isOwn &&
            !alreadyStarred
          ) {
            const pending = localStorage.getItem(PENDING_STAR_KEY);
            if (pending === profileId) {
              pendingStarHandled.current = true;
              localStorage.removeItem(PENDING_STAR_KEY);
              // Small delay so the user sees the page first
              setTimeout(() => doToggleStar(), 400);
            }
          }
        });
    });
  }, [profileId, profileUserId, doToggleStar]);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    // Not logged in → save intent + show login dialog
    if (!userId) {
      localStorage.setItem(PENDING_STAR_KEY, profileId);
      setShowLogin(true);
      return;
    }

    // Own profile → do nothing
    if (isOwnProfile) return;

    await doToggleStar();
  }, [userId, isOwnProfile, loading, profileId, doToggleStar]);

  const handleOAuth = useCallback(
    async (provider: "google" | "github") => {
      setLoginLoading(provider);
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        },
      });
    },
    []
  );

  // Filled star if starred, outline if not
  const starFill = starred ? "fill-current" : "";

  // Own profile → static badge, not interactive
  if (isOwnProfile) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
        style={{
          backgroundColor: isLightSidebar ? `${accentColor}12` : "rgba(255,255,255,0.15)",
          color: isLightSidebar ? "#374151" : "rgba(255,255,255,0.95)",
        }}
      >
        <Star className="h-4 w-4" />
        <span>{count}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="group inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 cursor-pointer"
        style={{
          backgroundColor: isLightSidebar ? `${accentColor}12` : "rgba(255,255,255,0.15)",
          color: isLightSidebar ? "#374151" : "rgba(255,255,255,0.95)",
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star
            className={`h-4 w-4 transition-transform group-hover:scale-110 ${starFill}`}
            style={starred ? { color: "#eab308" } : undefined}
          />
        )}
        <span>{count}</span>
      </button>

      {/* Mini login dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Sign in to star</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to show your support for this profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleOAuth("google")}
              disabled={loginLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {loginLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth("github")}
              disabled={loginLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loginLoading === "github" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GitHubIcon className="h-5 w-5" />
              )}
              Continue with GitHub
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
