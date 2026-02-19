"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { type Editor, posToDOMRect } from "@tiptap/react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
} from "lucide-react";
import { useVirtualKeyboard } from "@/lib/use-virtual-keyboard";

// ─── Main component ─────────────────────────────────────────

export function FloatingToolbar({
  editor,
  blockEditing = false,
}: {
  editor: Editor;
  blockEditing?: boolean;
}) {
  const t = useTranslations("floatingToolbar");
  const keyboard = useVirtualKeyboard();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { from, to, empty } = editor.state.selection;

    if (empty || !editor.isFocused) {
      setVisible(false);
      return;
    }

    const rect = posToDOMRect(editor.view, from, to);
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 220;
    const margin = 8;

    let left = rect.left + rect.width / 2;
    left = Math.max(
      toolbarWidth / 2 + margin,
      Math.min(window.innerWidth - toolbarWidth / 2 - margin, left)
    );

    setCoords({
      top: rect.top + window.scrollY - 8,
      left: left + window.scrollX,
    });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);
    const onBlur = () => {
      setTimeout(() => {
        if (!editor.isFocused) setVisible(false);
      }, 200);
    };
    editor.on("blur", onBlur);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", onBlur);
    };
  }, [editor, updatePosition]);

  // Re-clamp position when toolbar mounts/resizes
  useEffect(() => {
    if (visible && toolbarRef.current) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  // Once the keyboard opens we enter "sticky dock" mode: the toolbar stays
  // docked at the bottom even after the keyboard is dismissed, as long as
  // the editor stays focused.
  const [stayDocked, setStayDocked] = useState(false);

  useEffect(() => {
    if (keyboard.isOpen) setStayDocked(true);
  }, [keyboard.isOpen]);

  // Clear stayDocked only after the editor has been unfocused for a sustained
  // period.  Keyboard dismiss on Android can cause transient blur/re-focus
  // cycles — a 600ms window lets those settle without clearing the dock.
  useEffect(() => {
    if (!stayDocked) return;
    let timer: ReturnType<typeof setTimeout>;

    const onBlur = () => {
      timer = setTimeout(() => {
        if (!editor.isFocused) setStayDocked(false);
      }, 600);
    };
    const onFocus = () => clearTimeout(timer);

    editor.on("blur", onBlur);
    editor.on("focus", onFocus);
    return () => {
      clearTimeout(timer);
      editor.off("blur", onBlur);
      editor.off("focus", onFocus);
    };
  }, [stayDocked, editor]);

  const docked = keyboard.isOpen || stayDocked;

  // On touch devices (phones/tablets), only show the toolbar when docked.
  // The floating toolbar would overlap with the OS native selection menu.
  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // When docked, always render regardless of `visible` — the `visible` state
  // is unreliable during keyboard transitions (transient blur/re-focus).
  if (!docked && (!visible || isCoarsePointer)) return null;

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isBulletList = editor.isActive("bulletList");
  const isOrderedList = editor.isActive("orderedList");

  return createPortal(
    <div
      ref={toolbarRef}
      style={
        docked
          ? {
              position: "fixed",
              bottom: keyboard.height,
              left: 0,
              right: 0,
              zIndex: 9999,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }
          : {
              position: "absolute",
              top: coords.top,
              left: coords.left,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
            }
      }
      onMouseDown={(e) => e.preventDefault()}
      data-testid="floating-toolbar"
      className={
        docked
          ? "flex items-center justify-center gap-1 rounded-t-2xl bg-gray-900 px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.3)] border-t border-white/10 [&_button]:h-9 [&_button]:min-w-9"
          : "inline-flex items-center gap-0.5 bg-gray-900 rounded-lg px-2 py-1.5 shadow-xl"
      }
    >
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        title={t("bold")}
        className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${
          isBold
            ? "bg-white/20 text-white"
            : "text-white/60 hover:text-white hover:bg-white/10"
        }`}
      >
        <Bold className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        title={t("italic")}
        className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${
          isItalic
            ? "bg-white/20 text-white"
            : "text-white/60 hover:text-white hover:bg-white/10"
        }`}
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Separator */}
      {blockEditing && (
        <>
          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Bullet list */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }}
            title={t("typeBulletList")}
            className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${
              isBulletList
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Ordered list */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }}
            title={t("typeOrderedList")}
            className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${
              isOrderedList
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
