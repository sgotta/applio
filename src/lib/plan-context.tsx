"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [loading, setLoading] = useState(true);
  const [devOverride, setDevOverride] = useState<PlanType | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setPlan("free");
      } else {
        setPlan(data.plan as PlanType);
      }
    } catch {
      setPlan("free");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchPlan();
    }
  }, [authLoading, fetchPlan]);

  const effectivePlan = devOverride ?? plan;

  return (
    <PlanContext.Provider
      value={{
        plan: effectivePlan,
        isPremium: effectivePlan === "premium",
        loading: authLoading || loading,
        refresh: fetchPlan,
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
