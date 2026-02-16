"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useIsViewMode } from "@/hooks/useIsViewMode";


type EditableStyle = "heading" | "subheading" | "itemTitle" | "body" | "small" | "tiny";

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  as?: EditableStyle;
  /** Inline style applied to display span only (not the editing input) */
  displayStyle?: React.CSSProperties;
  /** Start in edit mode on mount (useful for newly created items) */
  autoEdit?: boolean;
  /** Custom renderer for display mode (e.g. bold markdown). Edit mode shows raw text. */
  formatDisplay?: (text: string) => React.ReactNode;
}

/** Tailwind classes WITHOUT font-size (font-size is applied via inline style) */
const styleMap: Record<EditableStyle, string> = {
  heading:
    "font-semibold tracking-tight text-gray-900 dark:text-gray-100",
  subheading:
    "font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
  itemTitle:
    "font-semibold text-gray-900 dark:text-gray-100",
  body: "leading-relaxed text-gray-600 dark:text-gray-300",
  small: "text-gray-600 dark:text-gray-300",
  tiny: "text-gray-400 dark:text-gray-500",
};

/** Base pixel sizes for each style (before scaling) */
const baseSizeMap: Record<EditableStyle, number> = {
  heading: 24,
  subheading: 14,
  itemTitle: 13,
  body: 11,
  small: 11,
  tiny: 10,
};

export function EditableText({
  value,
  onChange,
  placeholder: placeholderProp,
  multiline = false,
  className = "",
  as = "body",
  displayStyle,
  autoEdit = false,
  formatDisplay,
}: EditableTextProps) {
  const t = useTranslations("editableText");
  const viewMode = useIsViewMode();
  const fontScale = 1.08;
  const placeholder = placeholderProp ?? t("defaultPlaceholder");
  const [editing, setEditing] = useState(autoEdit && !viewMode);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scaledFontSize = Math.round(baseSizeMap[as] * fontScale);

  // Cancel editing when switching to view mode
  useEffect(() => {
    if (viewMode && editing) {
      setEditing(false);
      const trimmed = draft.trim();
      if (trimmed !== value) onChange(trimmed);
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Auto-resize textarea to match content height (avoids size jump)
  useLayoutEffect(() => {
    if (editing && multiline && inputRef.current) {
      const el = inputRef.current as HTMLTextAreaElement;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editing, multiline, draft]);

  const save = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    }
  }, [draft, value, onChange]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      } else if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        save();
      }
    },
    [cancel, save, multiline]
  );

  /** Strip hard line-breaks from pasted text (e.g. copied from PDFs).
   *  Single \n → space, double \n\n (paragraph break) is preserved. */
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const raw = e.clipboardData.getData("text/plain");
    if (!raw.includes("\n")) return;           // nothing to clean
    e.preventDefault();
    const cleaned = raw
      .replace(/\r\n/g, "\n")                  // normalise Windows CRLF
      .replace(/\n\n+/g, "\x00")               // protect paragraph breaks
      .replace(/\n/g, " ")                      // single newlines → space
      .replace(/\x00/g, "\n\n")                 // restore paragraph breaks
      .replace(/ {2,}/g, " ");                  // collapse multiple spaces
    const el = inputRef.current!;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const next = draft.slice(0, start) + cleaned + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      const pos = start + cleaned.length;
      el.setSelectionRange(pos, pos);
    });
  }, [draft]);

  const baseStyle = styleMap[as];
  const displayEmpty = !value && !editing;

  // View mode: render as static non-interactive text
  if (viewMode) {
    const spanStyle: React.CSSProperties = {
      fontSize: scaledFontSize,
      ...(displayEmpty ? undefined : displayStyle),
      ...(multiline ? { whiteSpace: "pre-wrap" as const } : undefined),
    };

    return (
      <span
        className={`${baseStyle} ${className} inline-block rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 ${
          displayEmpty ? "text-gray-300 dark:text-gray-600 italic" : ""
        }`}
        style={spanStyle}
      >
        {displayEmpty ? placeholder : formatDisplay ? formatDisplay(value) : value}
      </span>
    );
  }

  if (editing) {
    const onSidebar = !!displayStyle;
    const isDarkSidebar =
      onSidebar &&
      (displayStyle as Record<string, string>).color === "#ffffff";

    const inputClasses = isDarkSidebar
      ? `${baseStyle} ${className} w-full bg-white/15 border border-white/20 rounded-sm px-1.5 py-0.5 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all duration-150 placeholder:text-white/40`
      : onSidebar
        ? `${baseStyle} ${className} w-full bg-black/[0.08] border border-black/10 rounded-sm px-1.5 py-0.5 outline-none focus:border-black/15 focus:ring-1 focus:ring-black/[0.05] transition-all duration-150 placeholder:opacity-40`
        : `${baseStyle} ${className} w-full bg-white dark:bg-accent border border-gray-300 dark:border-border rounded-sm px-1.5 py-0.5 outline-none focus:border-gray-400 dark:focus:border-ring focus:ring-1 focus:ring-gray-200 dark:focus:ring-ring/30 transition-all duration-150`;

    const inputStyle: React.CSSProperties = {
      fontSize: scaledFontSize,
      ...(onSidebar ? displayStyle : undefined),
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={1}
          className={`${inputClasses} resize-none overflow-hidden`}
          style={inputStyle}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={inputClasses}
        style={inputStyle}
      />
    );
  }

  const spanStyle: React.CSSProperties = {
    fontSize: scaledFontSize,
    ...(displayEmpty ? undefined : displayStyle),
    ...(multiline ? { whiteSpace: "pre-wrap" as const } : undefined),
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={`${baseStyle} ${className} inline-block cursor-text rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors duration-150 focus:outline-none ${
        displayStyle
          ? (displayStyle as Record<string, string>).color === "#ffffff"
            ? "hover:bg-white/15 focus:bg-white/15"
            : "hover:bg-black/[0.07] focus:bg-black/[0.07]"
          : "hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent"
      } ${displayEmpty ? "text-gray-300 dark:text-gray-600 italic" : ""}`}
      style={spanStyle}
    >
      {displayEmpty ? placeholder : formatDisplay ? formatDisplay(value) : value}
    </span>
  );
}
