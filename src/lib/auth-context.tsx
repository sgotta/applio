"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  SessionProvider,
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";

interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user: AppUser | null = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id!,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
  }, [session]);

  const signInWithGoogle = useCallback(async () => {
    await signIn("google", { callbackUrl: window.location.pathname });
  }, []);

  const signInWithGithub = useCallback(async () => {
    await signIn("github", { callbackUrl: window.location.pathname });
  }, []);

  const handleSignOut = useCallback(async () => {
    await nextAuthSignOut({ callbackUrl: "/editor" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: status === "loading",
      signInWithGoogle,
      signInWithGithub,
      signOut: handleSignOut,
    }),
    [user, status, signInWithGoogle, signInWithGithub, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
