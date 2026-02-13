"use client";

import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";


export function SectionTitle({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const fontScale = 1.08;

  const headingColor = sidebar
    ? colorScheme.sidebarText
    : colorScheme.heading;
  const separatorColor = sidebar
    ? colorScheme.sidebarSeparator
    : colorScheme.separator;

  return (
    <div className="mb-3 mt-1">
      <h3
        className="font-semibold uppercase tracking-[0.15em]"
        style={{ color: headingColor, fontSize: Math.round(10 * fontScale) }}
      >
        {children}
      </h3>
      <Separator className="mt-1.5" style={{ backgroundColor: separatorColor }} />
    </div>
  );
}
