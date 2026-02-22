"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapUnderline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import TiptapColor from "@tiptap/extension-color";
import TiptapHighlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import { renderRichText, renderRichDocument } from "@/lib/render-rich-text";
import { FloatingToolbar } from "./FloatingToolbar";

type EditableStyle = "heading" | "subheading" | "itemTitle" | "body" | "small" | "tiny";

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  as?: EditableStyle;
  /** Inline style applied to display span (and inherited by editor) */
  displayStyle?: React.CSSProperties;
  /** Enable rich text formatting (Bold, Italic, Underline, Strikethrough, Color, Highlight) */
  richText?: boolean;
  /** Enable block-level editing (headings, lists, blockquotes). Implies richText + multiline. */
  blockEditing?: boolean;
  /** Start in edit mode on mount (useful for newly created items) */
  autoEdit?: boolean;
  /** Show dashed outline when editing (default true). Set false for compact badges. */
  editOutline?: boolean;
  /** Require double-click to enter edit mode (useful when drag gestures share the same surface) */
  doubleClickToEdit?: boolean;
  /** Called when the component enters or exits editing mode */
  onEditingChange?: (editing: boolean) => void;
  /** Delete the element when Backspace is pressed on an empty editor (useful for skill badges) */
  deleteOnEmpty?: boolean;
}

/** Tailwind classes WITHOUT font-size (font-size is applied via inline style) */
const styleMap: Record<EditableStyle, string> = {
  heading: "font-semibold tracking-tight text-gray-900",
  subheading: "font-medium uppercase tracking-wide text-gray-500",
  itemTitle: "font-semibold text-gray-900",
  body: "leading-relaxed text-gray-600",
  small: "text-gray-600",
  tiny: "text-gray-400",
};

/** Font sizes in em — scale automatically via container's responsive font-size */
const fontSizeMap: Record<EditableStyle, string> = {
  heading: "2.16em",
  subheading: "1.26em",
  itemTitle: "1.17em",
  body: "1em",
  small: "1em",
  tiny: "0.9em",
};

export function EditableText({
  value,
  onChange,
  placeholder: placeholderProp,
  multiline = false,
  className = "",
  as = "body",
  displayStyle,
  richText = false,
  blockEditing = false,
  autoEdit = false,
  editOutline = true,
  doubleClickToEdit = false,
  onEditingChange,
  deleteOnEmpty = false,
}: EditableTextProps) {
  const t = useTranslations("editableText");
  const placeholder = placeholderProp ?? t("defaultPlaceholder");
  const [isActive, setIsActive] = useState(autoEdit);
  const [activeClickCoords, setActiveClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeClickCount, setActiveClickCount] = useState(0);
  const clickCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const lastClickTimeRef = useRef(0);
  const clickCountRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isActive);
  }, [isActive, onEditingChange]);

  const fontSize = fontSizeMap[as];
  const baseStyle = styleMap[as];
  const displayEmpty = !value;

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Skip if this click follows a long press (long press already activated)
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }

    const now = Date.now();
    if (now - lastClickTimeRef.current < 400) {
      clickCountRef.current = Math.min(clickCountRef.current + 1, 3);
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    // Double-click mode: ignore single clicks (let drag system handle them)
    if (doubleClickToEdit && clickCountRef.current < 2) return;

    clickCoordsRef.current = { x: e.clientX, y: e.clientY };
    setActiveClickCoords(clickCoordsRef.current);
    setActiveClickCount(clickCountRef.current);
    setIsActive(true);
  }, [doubleClickToEdit]);

  // Long press on mobile: select word at touch position
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressFiredRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      clickCoordsRef.current = touchStartRef.current;
      clickCountRef.current = 2; // select word
      setActiveClickCoords(clickCoordsRef.current);
      setActiveClickCount(clickCountRef.current);
      setIsActive(true);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!longPressTimerRef.current || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    // Cancel if finger moved more than 10px (scrolling)
    if (dx * dx + dy * dy > 100) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleSave = useCallback(
    (newValue: string) => {
      setIsActive(false);
      const trimmed = newValue.trim();
      if (trimmed !== value) onChange(trimmed);
    },
    [value, onChange]
  );

  const handleCancel = useCallback(() => {
    setIsActive(false);
  }, []);

  if (isActive) {
    return (
      <TiptapEditor
        value={value}
        onSave={handleSave}
        onCancel={handleCancel}
        clickCoords={activeClickCoords}
        clickCount={activeClickCount}
        richText={richText || blockEditing}
        blockEditing={blockEditing}
        multiline={multiline || blockEditing}
        placeholder={placeholder}
        className={className}
        baseStyle={baseStyle}
        fontSize={fontSize}
        displayStyle={displayStyle}
        editOutline={editOutline}
        deleteOnEmpty={deleteOnEmpty}
      />
    );
  }

  // --- Display mode ---

  const onSidebar = !!displayStyle;
  const isDarkSidebar =
    onSidebar &&
    (displayStyle as Record<string, string>).color === "#ffffff";

  const spanStyle: React.CSSProperties = {
    fontSize,
    // Match ProseMirror's exact text rendering CSS (prosemirror.css)
    // so text wraps at the same pixel in both display and edit modes
    wordWrap: "break-word",
    whiteSpace: "break-spaces",            // ProseMirror uses break-spaces, NOT pre-wrap
    fontVariantLigatures: "none",
    WebkitFontVariantLigatures: "none",
    fontFeatureSettings: '"liga" 0',        // ProseMirror disables ligatures via this too
    ...(displayEmpty ? undefined : displayStyle),
  };

  return (
    <div
      role="textbox"
      tabIndex={0}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        if (longPressFiredRef.current) e.preventDefault();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`${baseStyle} ${className} ${multiline ? "block" : "inline-block"} ${doubleClickToEdit ? "" : "cursor-text"} rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors duration-150 focus:outline-none ${
        doubleClickToEdit
          ? ""
          : isDarkSidebar
            ? "hover:bg-white/15 focus:bg-white/15"
            : onSidebar
              ? "hover:bg-black/[0.07] focus:bg-black/[0.07]"
              : "hover:bg-gray-100 focus:bg-gray-100"
      } ${displayEmpty ? "text-gray-300 italic" : ""}`}
      style={spanStyle}
    >
      {displayEmpty
        ? placeholder
        : blockEditing
          ? renderRichDocument(value)
          : richText
            ? renderRichText(value)
            : value}
    </div>
  );
}

// ─── Tiptap Editor (lazy-mounted on click) ──────────────────

/** Strip outer <p></p> from single-paragraph HTML */
function unwrapSingleParagraph(html: string): string {
  if (html === "<p></p>") return "";
  const match = html.match(/^<p>([\s\S]*)<\/p>$/);
  if (match && !match[1].includes("</p>")) {
    return match[1];
  }
  return html;
}

/** Ensure content has <p> wrapper for Tiptap */
function wrapContent(value: string): string {
  if (!value) return "<p></p>";
  if (value.startsWith("<p>")) return value;
  return `<p>${value}</p>`;
}

/** Select the word at a given ProseMirror position */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectWordAtPos(editor: any, pos: number) {
  try {
    const $pos = editor.state.doc.resolve(pos);
    const text = $pos.parent.textContent;
    const offset = $pos.parentOffset;

    // Unicode-aware: letters, numbers, combining marks
    const isWordChar = (ch: string) => /[\p{L}\p{N}\p{M}]/u.test(ch);

    let start = offset;
    let end = offset;
    while (start > 0 && isWordChar(text[start - 1])) start--;
    while (end < text.length && isWordChar(text[end])) end++;

    if (start !== end) {
      const nodeStart = pos - offset;
      editor.commands.setTextSelection({ from: nodeStart + start, to: nodeStart + end });
    } else {
      editor.commands.setTextSelection(pos);
    }
  } catch {
    editor.commands.setTextSelection(pos);
  }
}

/**
 * Clean pasted plain text — remove PDF line-break artifacts.
 * Single \n → space (PDF line wraps), double \n\n → paragraph break (real paragraphs).
 */
function cleanPastedText(text: string, multiline: boolean): string {
  if (!multiline) return text.replace(/\n/g, " ").replace(/ {2,}/g, " ").trim();
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\n+/g, "\x00")   // preserve real paragraph breaks
    .replace(/\n/g, " ")          // single \n → space (PDF artifact)
    .replace(/\x00/g, "\n\n")     // restore paragraph breaks
    .replace(/ {2,}/g, " ");      // collapse multiple spaces
}

/** Sanitize pasted HTML — only keep our supported tags + clean PDF artifacts */
function sanitizePastedHTML(html: string, allowBlocks = false): string {
  // Strip unsupported tags — allow block tags when blockEditing is enabled
  const inlineTags = "strong|b|em|i|u|s|code|span|mark|p|br";
  const blockTags = "ul|ol|li|h2|h3|h4|blockquote";
  const allowed = allowBlocks ? `${inlineTags}|${blockTags}` : inlineTags;
  const tagRegex = new RegExp(`<(?!\\/?(?:${allowed})\\b)[^>]*>`, "gi");
  let clean = html.replace(tagRegex, "");
  // Clean text between tags: single \n → space (PDF line wraps)
  clean = clean
    .replace(/\r\n/g, "\n")
    .replace(/([^>])\n(?!\n)([^<])/g, "$1 $2");
  return clean;
}

function TiptapEditor({
  value,
  onSave,
  onCancel,
  clickCoords,
  clickCount,
  richText,
  blockEditing,
  multiline,
  placeholder,
  className,
  baseStyle,
  fontSize,
  displayStyle,
  editOutline,
  deleteOnEmpty,
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  clickCoords: { x: number; y: number } | null;
  clickCount: number;
  richText: boolean;
  blockEditing: boolean;
  multiline: boolean;
  placeholder: string;
  className: string;
  baseStyle: string;
  fontSize: string;
  displayStyle?: React.CSSProperties;
  editOutline: boolean;
  deleteOnEmpty: boolean;
}) {
  const t = useTranslations("editableText");
  const cancelledRef = useRef(false);
  const savedRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);
  const clickCoordsRef = useRef(clickCoords);
  const clickCountRef = useRef(clickCount);

  useEffect(() => {
    onSaveRef.current = onSave;
    onCancelRef.current = onCancel;
  });
  const pasteToastMsgRef = useRef(t("pasteLineBreaksCleaned"));

  const extensions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exts: any[] = [
      StarterKit.configure({
        heading: blockEditing ? { levels: [2, 3, 4] } : false,
        bulletList: blockEditing ? {} : false,
        orderedList: blockEditing ? {} : false,
        blockquote: blockEditing ? {} : false,
        codeBlock: false,
        horizontalRule: false,
        ...(richText ? {} : { bold: false, italic: false, strike: false, code: false }),
      }),
      Placeholder.configure({ placeholder }),
    ];
    if (richText) {
      exts.push(
        TiptapUnderline,
        TextStyle,
        TiptapColor,
        TiptapHighlight.configure({ multicolor: true })
      );
    }
    return exts;
  }, [richText, blockEditing, placeholder]);

  const editor = useEditor({
    extensions,
    content: blockEditing ? (value || "<p></p>") : richText ? wrapContent(value) : value || undefined,
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: `${baseStyle} outline-none cursor-text`,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape") {
          cancelledRef.current = true;
          onCancelRef.current();
          return true;
        }
        if (event.key === "Enter" && !multiline) {
          event.preventDefault();
          _view.dom.blur();
          return true;
        }
        // Backspace on empty editor → delete the element (e.g. skill badge)
        if (deleteOnEmpty && event.key === "Backspace" && _view.state.doc.textContent === "") {
          event.preventDefault();
          savedRef.current = true;
          onSaveRef.current("");
          return true;
        }
        return false;
      },
      transformPastedText: (text: string) => {
        const cleaned = cleanPastedText(text, multiline);
        if (cleaned !== text) {
          setTimeout(() => toast.info(pasteToastMsgRef.current), 0);
        }
        return cleaned;
      },
      ...(richText
        ? { transformPastedHTML: (html: string) => sanitizePastedHTML(html, blockEditing) }
        : {}),
    },
    onBlur: ({ editor: ed }) => {
      if (cancelledRef.current || savedRef.current) return;
      savedRef.current = true;
      const content = blockEditing
        ? ed.getHTML().replace(/(<p><\/p>)+$/, "")
        : richText
          ? unwrapSingleParagraph(ed.getHTML())
          : ed.getText().trim();
      onSaveRef.current(content);
    },
    onCreate: ({ editor: ed }) => {
      // Small delay to let the DOM settle, then focus and place cursor.
      // Wrapped in try-catch: on mobile, the editor state can change between
      // creation and this frame due to touch/focus timing, causing a
      // "mismatched transaction" RangeError that is safe to ignore.
      requestAnimationFrame(() => {
        if (ed.isDestroyed) return;
        try {
          const coords = clickCoordsRef.current;
          const clicks = clickCountRef.current;

          // Save scroll position before focus. On mobile, focus("end")
          // makes the browser scroll to show the cursor at the END of
          // the text, pushing the beginning out of view. We prevent that
          // by restoring scroll right after focus, then placing the
          // cursor at the actual click/tap coordinates.
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;

          ed.commands.focus("end", { scrollIntoView: false });

          // Restore scroll — browser may have auto-scrolled on native focus()
          window.scrollTo(scrollX, scrollY);

          if (coords) {
            const pos = ed.view.posAtCoords({
              left: coords.x,
              top: coords.y,
            });
            if (pos) {
              if (clicks >= 3) {
                ed.commands.selectAll();
              } else if (clicks >= 2) {
                selectWordAtPos(ed, pos.pos);
              } else {
                ed.commands.setTextSelection(pos.pos);
              }
            }
          }
        } catch {
          // State mismatch or coords outside bounds — editor still works
        }
      });
    },
  });

  // Cleanup: destroy editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  const onSidebar = !!displayStyle;
  const isDarkSidebar =
    onSidebar &&
    (displayStyle as Record<string, string>).color === "#ffffff";

  // Wrapper div inherits font styles so the editor text matches display
  const wrapperStyle: React.CSSProperties = {
    fontSize,
    ...(displayStyle || {}),
    ...(multiline ? { whiteSpace: "pre-wrap" as const } : undefined),
  };

  const ringClass = editOutline
    ? `ring-2 ${isDarkSidebar ? "ring-white bg-white/20 [&_.tiptap]:text-inherit" : "ring-blue-300 dark:ring-blue-500/40 bg-blue-50 dark:bg-blue-500/10"}`
    : "";

  return (
    <div
      style={wrapperStyle}
      className={`${className} ${multiline ? "block" : "inline-block"} rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 ${ringClass}`}
    >
      <EditorContent editor={editor} />
      {richText && (
        <FloatingToolbar
          editor={editor}
          blockEditing={blockEditing}
        />
      )}
    </div>
  );
}
