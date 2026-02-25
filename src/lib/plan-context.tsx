"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";

type PlanType = "free" | "premium";

interface PlanContextValue {
  plan: PlanType;
  isPremium: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Dev-only: override the plan for testing */
  devOverride: PlanType | null;
  setDevOverride: (override: PlanType | null) => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [planLoading, setPlanLoading] = useState(false);
  const [devOverride, setDevOverride] = useState<PlanType | null>(null);
  const fetchedForUser = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      return;
    }
    setPlanLoading(true);
    try {
      const res = await fetch("/api/cv/plan");
      if (!res.ok) throw new Error(`fetchPlan failed: ${res.status}`);
      const result = await res.json();
      setPlan(result.isActive ? "premium" : "free");
    } catch {
      setPlan("free");
    } finally {
      setPlanLoading(false);
    }
  }, [user]);

  // Fetch plan when user changes
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPlan("free");
      fetchedForUser.current = null;
      return;
    }
    // Only fetch once per user
    if (fetchedForUser.current === user.id) return;
    fetchedForUser.current = user.id;
    refresh();
  }, [user, authLoading, refresh]);

  const effectivePlan = devOverride ?? plan;

  return (
    <PlanContext.Provider
      value={{
        plan: effectivePlan,
        isPremium: effectivePlan === "premium",
        loading: authLoading || planLoading,
        refresh,
        devOverride,
        setDevOverride,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
