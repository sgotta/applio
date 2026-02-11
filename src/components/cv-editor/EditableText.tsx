"use client";

import { useCallback, useEffect, useRef, useState, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

type EditableStyle = "heading" | "subheading" | "body" | "small" | "tiny";

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  as?: EditableStyle;
}

const styleMap: Record<EditableStyle, string> = {
  heading:
    "text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100",
  subheading:
    "text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400",
  body: "text-[11px] leading-relaxed text-gray-600 dark:text-gray-300",
  small: "text-[11px] text-gray-600 dark:text-gray-300",
  tiny: "text-[10px] text-gray-400 dark:text-gray-500",
};

export function EditableText({
  value,
  onChange,
  placeholder: placeholderProp,
  multiline = false,
  className = "",
  as = "body",
}: EditableTextProps) {
  const t = useTranslations("editableText");
  const placeholder = placeholderProp ?? t("defaultPlaceholder");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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

  const baseStyle = styleMap[as];
  const displayEmpty = !value && !editing;

  if (editing) {
    const inputClasses = `${baseStyle} ${className} w-full bg-white dark:bg-accent border border-gray-300 dark:border-border rounded-sm px-1.5 py-0.5 outline-none focus:border-gray-400 dark:focus:border-ring focus:ring-1 focus:ring-gray-200 dark:focus:ring-ring/30 transition-all duration-150`;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className={`${inputClasses} resize-y min-h-[3em]`}
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
        placeholder={placeholder}
        className={inputClasses}
      />
    );
  }

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
      className={`${baseStyle} ${className} inline-block cursor-text rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent focus:outline-none ${
        displayEmpty ? "text-gray-300 dark:text-gray-600 italic" : ""
      }`}
    >
      {displayEmpty ? placeholder : value}
    </span>
  );
}
