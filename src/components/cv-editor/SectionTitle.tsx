"use client";

import { Separator } from "@/components/ui/separator";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useCV } from "@/lib/cv-context";


export function SectionTitle({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const { data: { templateId } } = useCV();

  // NoPhoto template: left accent bar style (matches the local sectionTitle helper)
  if (templateId === "noPhoto" && !sidebar) {
    return (
      <div className="flex items-center gap-2 mb-3 mt-1">
        <div className="w-0.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colorScheme.heading }} />
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
          {children}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: `${colorScheme.heading}18` }} />
      </div>
    );
  }

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
        style={{ color: headingColor, fontSize: "0.9em" }}
      >
        {children}
      </h3>
      <Separator className="mt-1.5" style={{ backgroundColor: separatorColor }} />
    </div>
  );
}
