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

  // NoPhoto / Modern template: left accent bar style (matches the local sectionTitle helper)
  if ((templateId === "noPhoto" || templateId === "modern") && !sidebar) {
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

  // Timeline template: large ring dot + bold text + line (the dot overlaps the timeline border-left)
  if (templateId === "timeline" && !sidebar) {
    return (
      <div className="flex items-center gap-3 mb-3 mt-1 -ml-8">
        <div
          className="w-3.5 h-3.5 rounded-full shrink-0"
          style={{
            backgroundColor: colorScheme.heading,
            border: "2.5px solid white",
            boxShadow: `0 0 0 2px ${colorScheme.heading}`,
          }}
        />
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
          {children}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: `${colorScheme.heading}18` }} />
      </div>
    );
  }

  // Executive template: diamond ornaments flanking centered text with lines
  if (templateId === "executive" && !sidebar) {
    return (
      <div className="flex items-center gap-2.5 mb-4 mt-2">
        <div className="flex-1 h-px" style={{ backgroundColor: colorScheme.separator }} />
        <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colorScheme.heading }} />
        <h3 className="text-[10px] font-bold tracking-[0.22em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
          {children}
        </h3>
        <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colorScheme.heading }} />
        <div className="flex-1 h-px" style={{ backgroundColor: colorScheme.separator }} />
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
