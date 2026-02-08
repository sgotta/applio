"use client";

import { Separator } from "@/components/ui/separator";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-1">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
        {children}
      </h3>
      <Separator className="mt-1.5" />
    </div>
  );
}
