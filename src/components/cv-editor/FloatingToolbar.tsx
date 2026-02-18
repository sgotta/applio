"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { type Editor, posToDOMRect } from "@tiptap/react";
import { type Transaction, TextSelection } from "@tiptap/pm/state";
import type { ResolvedPos } from "@tiptap/pm/model";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  RemoveFormatting,
  Baseline,
  Highlighter,
  ChevronDown,
  Text,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  TextQuote,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToolbarFeatures } from "@/lib/toolbar-features-context";
import { useVirtualKeyboard } from "@/lib/use-virtual-keyboard";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const mod = isMac ? "⌘" : "Ctrl+";
const shift = isMac ? "⇧" : "Shift+";

const FONT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#6b7280" },
  { name: "Brown", value: "#92400e" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
  { name: "Red", value: "#dc2626" },
] as const;

const HIGHLIGHT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#f3f4f6" },
  { name: "Brown", value: "#fef3c7" },
  { name: "Orange", value: "#ffedd5" },
  { name: "Yellow", value: "#fef9c3" },
  { name: "Green", value: "#dcfce7" },
  { name: "Blue", value: "#dbeafe" },
  { name: "Purple", value: "#f3e8ff" },
  { name: "Pink", value: "#fce7f3" },
  { name: "Red", value: "#fee2e2" },
] as const;

// ─── Block type helpers ─────────────────────────────────────

type BlockType = "paragraph" | "heading2" | "heading3" | "heading4" | "bulletList" | "orderedList" | "blockquote";

interface BlockTypeOption {
  type: BlockType;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { type: "paragraph",   labelKey: "typeText",        icon: Text },
  { type: "heading2",    labelKey: "typeHeading2",     icon: Heading1 },
  { type: "heading3",    labelKey: "typeHeading3",     icon: Heading2 },
  { type: "heading4",    labelKey: "typeHeading4",     icon: Heading3 },
  { type: "bulletList",  labelKey: "typeBulletList",   icon: List },
  { type: "orderedList", labelKey: "typeOrderedList",  icon: ListOrdered },
  { type: "blockquote",  labelKey: "typeBlockquote",   icon: TextQuote },
];

function getCurrentBlockType(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 2 })) return "heading2";
  if (editor.isActive("heading", { level: 3 })) return "heading3";
  if (editor.isActive("heading", { level: 4 })) return "heading4";
  if (editor.isActive("bulletList")) return "bulletList";
  if (editor.isActive("orderedList")) return "orderedList";
  if (editor.isActive("blockquote")) return "blockquote";
  return "paragraph";
}

function applyBlockType(editor: Editor, type: BlockType) {
  const chain = editor.chain().focus();
  switch (type) {
    case "paragraph":   chain.setParagraph().run(); break;
    case "heading2":    chain.toggleHeading({ level: 2 }).run(); break;
    case "heading3":    chain.toggleHeading({ level: 3 }).run(); break;
    case "heading4":    chain.toggleHeading({ level: 4 }).run(); break;
    case "bulletList":  chain.toggleBulletList().run(); break;
    case "orderedList": chain.toggleOrderedList().run(); break;
    case "blockquote":  chain.toggleBlockquote().run(); break;
  }
}

// ─── Move block helpers ─────────────────────────────────────

/** Find the depth of the nearest movable block — the first ancestor whose
 *  parent is a list, blockquote, or the doc. */
function findMoveDepth(editor: Editor): number {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const parentType = $from.node(depth - 1).type.name;
    if (
      parentType === "bulletList" ||
      parentType === "orderedList" ||
      parentType === "blockquote" ||
      parentType === "doc"
    ) {
      return depth;
    }
  }
  return 0;
}

/** Swap two adjacent children (index and index-1) inside a transaction. */
function swapUp(tr: Transaction, $from: ResolvedPos, depth: number) {
  const parent = $from.node(depth - 1);
  const index = $from.index(depth - 1);
  const currentNode = parent.child(index);
  const prevNode = parent.child(index - 1);
  const currentPos = $from.before(depth);
  const prevPos = currentPos - prevNode.nodeSize;
  tr.replaceWith(prevPos, currentPos + currentNode.nodeSize, [
    currentNode.copy(currentNode.content),
    prevNode.copy(prevNode.content),
  ]);
  tr.setSelection(TextSelection.create(tr.doc, prevPos + 1));
}

/** Swap two adjacent children (index and index+1) inside a transaction. */
function swapDown(tr: Transaction, $from: ResolvedPos, depth: number) {
  const parent = $from.node(depth - 1);
  const index = $from.index(depth - 1);
  const currentNode = parent.child(index);
  const nextNode = parent.child(index + 1);
  const currentPos = $from.before(depth);
  tr.replaceWith(currentPos, currentPos + currentNode.nodeSize + nextNode.nodeSize, [
    nextNode.copy(nextNode.content),
    currentNode.copy(currentNode.content),
  ]);
  tr.setSelection(TextSelection.create(tr.doc, currentPos + nextNode.nodeSize + 1));
}

function moveBlockUp(editor: Editor): boolean {
  const depth = findMoveDepth(editor);
  if (depth === 0) return false;

  const { state, view } = editor;
  const { $from } = state.selection;
  const index = $from.index(depth - 1);

  // Normal swap within the container
  if (index > 0) {
    const tr = state.tr;
    swapUp(tr, $from, depth);
    view.dispatch(tr);
    return true;
  }

  // Cross-list: item is first in its list — join with prev sibling list, then swap
  const listType = $from.node(depth - 1).type.name;
  if (listType !== "bulletList" && listType !== "orderedList") return false;
  const listDepth = depth - 1;
  if (listDepth < 1) return false;
  const listIndex = $from.index(listDepth - 1);
  if (listIndex === 0) return false;
  const prevSibling = $from.node(listDepth - 1).child(listIndex - 1);
  if (prevSibling.type.name !== listType) return false;

  const tr = state.tr;
  try { tr.join($from.before(listDepth)); } catch { return false; }

  // Re-resolve in the merged list and swap
  const m = tr.doc.resolve(tr.mapping.map($from.pos));
  let nd = 0;
  for (let d = m.depth; d > 0; d--) {
    const pt = m.node(d - 1).type.name;
    if (pt === "bulletList" || pt === "orderedList" || pt === "blockquote" || pt === "doc") {
      nd = d; break;
    }
  }
  if (nd > 0 && m.index(nd - 1) > 0) {
    swapUp(tr, m, nd);
  }
  view.dispatch(tr);
  return true;
}

function moveBlockDown(editor: Editor): boolean {
  const depth = findMoveDepth(editor);
  if (depth === 0) return false;

  const { state, view } = editor;
  const { $from } = state.selection;
  const parent = $from.node(depth - 1);
  const index = $from.index(depth - 1);

  // Normal swap within the container
  if (index < parent.childCount - 1) {
    const tr = state.tr;
    swapDown(tr, $from, depth);
    view.dispatch(tr);
    return true;
  }

  // Cross-list: item is last in its list — join with next sibling list, then swap
  const listType = $from.node(depth - 1).type.name;
  if (listType !== "bulletList" && listType !== "orderedList") return false;
  const listDepth = depth - 1;
  if (listDepth < 1) return false;
  const listParent = $from.node(listDepth - 1);
  const listIndex = $from.index(listDepth - 1);
  if (listIndex >= listParent.childCount - 1) return false;
  const nextSibling = listParent.child(listIndex + 1);
  if (nextSibling.type.name !== listType) return false;

  const tr = state.tr;
  try { tr.join($from.after(listDepth)); } catch { return false; }

  // Re-resolve in the merged list and swap
  const m = tr.doc.resolve(tr.mapping.map($from.pos));
  let nd = 0;
  for (let d = m.depth; d > 0; d--) {
    const pt = m.node(d - 1).type.name;
    if (pt === "bulletList" || pt === "orderedList" || pt === "blockquote" || pt === "doc") {
      nd = d; break;
    }
  }
  if (nd > 0 && m.index(nd - 1) < m.node(nd - 1).childCount - 1) {
    swapDown(tr, m, nd);
  }
  view.dispatch(tr);
  return true;
}

// ─── Sub-components ─────────────────────────────────────────

function ToolbarButton({
  active,
  onClick,
  tooltip,
  shortcut,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onClick();
          }}
          className={`flex items-center justify-center h-7 w-7 rounded transition-colors ${
            active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="text-center">
        <p className="font-medium text-[11px]">{tooltip}</p>
        {shortcut && (
          <p className="text-[10px] opacity-60">{shortcut}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function ColorSwatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const isEmpty = !color;
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
        active
          ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800"
          : ""
      } ${isEmpty ? "border-gray-300 dark:border-gray-600" : "border-transparent"}`}
      style={isEmpty ? undefined : { backgroundColor: color }}
    >
      {isEmpty && (
        <span className="flex items-center justify-center text-[9px] text-gray-400 leading-none">
          ∅
        </span>
      )}
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────

export function FloatingToolbar({
  editor,
  blockEditing = false,
}: {
  editor: Editor;
  blockEditing?: boolean;
}) {
  const t = useTranslations("floatingToolbar");
  const { features: TOOLBAR_FEATURES } = useToolbarFeatures();
  const keyboard = useVirtualKeyboard();
  const hasColorGroup = TOOLBAR_FEATURES.textColor || TOOLBAR_FEATURES.highlight;
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pinnedUntilRef = useRef(0);
  const colorOpenRef = useRef(false);
  const highlightOpenRef = useRef(false);
  const typeOpenRef = useRef(false);

  colorOpenRef.current = colorOpen;
  highlightOpenRef.current = highlightOpen;
  typeOpenRef.current = typeOpen;

  const BLOCK_TYPE_FEATURE_MAP: Record<string, keyof typeof TOOLBAR_FEATURES> = {
    paragraph: "typeParagraph",
    heading2: "typeHeading2",
    heading3: "typeHeading3",
    heading4: "typeHeading4",
    bulletList: "typeBulletList",
    orderedList: "typeOrderedList",
    blockquote: "typeBlockquote",
  };
  const visibleBlockTypes = BLOCK_TYPE_OPTIONS.filter(
    (opt) => TOOLBAR_FEATURES[BLOCK_TYPE_FEATURE_MAP[opt.type]]
  );

  const currentBlockType = blockEditing ? getCurrentBlockType(editor) : "paragraph";
  const currentTypeOption = blockEditing
    ? visibleBlockTypes.find((o) => o.type === currentBlockType) ?? visibleBlockTypes[0] ?? null
    : null;

  const updatePosition = useCallback(() => {
    const { from, to, empty } = editor.state.selection;

    // After a move action, keep the toolbar pinned in place (even with cursor)
    if (Date.now() < pinnedUntilRef.current) {
      setVisible(true);
      return;
    }

    if (empty || !editor.isFocused) {
      if (
        !colorOpenRef.current &&
        !highlightOpenRef.current &&
        !typeOpenRef.current
      )
        setVisible(false);
      return;
    }

    const rect = posToDOMRect(editor.view, from, to);
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 320;
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
        if (
          !editor.isFocused &&
          !colorOpenRef.current &&
          !highlightOpenRef.current &&
          !typeOpenRef.current
        )
          setVisible(false);
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

  const currentColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";

  const setFontColor = useCallback(
    (color: string) => {
      if (color) {
        editor.chain().focus().setColor(color).run();
      } else {
        editor.chain().focus().unsetColor().run();
      }
    },
    [editor]
  );

  const setHighlightColor = useCallback(
    (color: string) => {
      if (color) {
        editor.chain().focus().setHighlight({ color }).run();
      } else {
        editor.chain().focus().unsetHighlight().run();
      }
    },
    [editor]
  );

  // Once the keyboard opens we enter "sticky dock" mode: the toolbar stays
  // docked at the bottom even after the keyboard is dismissed, as long as
  // the editor stays focused.  This prevents colliding with Android's native
  // copy/paste menu and avoids position flash during keyboard dismiss.
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

  return createPortal(
    <TooltipProvider delayDuration={400}>
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
        className={
          docked
            ? "flex items-center gap-1.5 border-t border-border bg-popover shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-3 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_button]:h-9 [&_button]:min-w-9 [&_button]:text-foreground [&_svg]:h-5 [&_svg]:w-5"
            : "flex items-center gap-0.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md px-1 py-0.5"
        }
      >
        {/* Block type dropdown */}
        {blockEditing && currentTypeOption && visibleBlockTypes.length > 0 && (
          <>
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setTypeOpen((o) => !o)}
                  className="flex items-center gap-1 h-7 rounded px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <currentTypeOption.icon className="h-3.5 w-3.5" />
                  <span className="max-w-20 truncate">{t(currentTypeOption.labelKey)}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-44 p-1"
                align="start"
                side="top"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t("turnInto")}
                </p>
                {visibleBlockTypes.map((opt) => {
                  const isActive = opt.type === currentBlockType;
                  return (
                    <button
                      key={opt.type}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyBlockType(editor, opt.type);
                        setTypeOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors ${
                        isActive
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      {t(opt.labelKey)}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            <div className={`w-px bg-border ${docked ? "h-5 mx-1" : "h-4 mx-0.5"}`} />
          </>
        )}

        {/* Bold */}
        {TOOLBAR_FEATURES.bold && (
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip={t("bold")}
            shortcut={`${mod}B`}
          >
            <Bold className="h-4 w-4" strokeWidth={2.5} />
          </ToolbarButton>
        )}

        {/* Italic */}
        {TOOLBAR_FEATURES.italic && (
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip={t("italic")}
            shortcut={`${mod}I`}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Underline */}
        {TOOLBAR_FEATURES.underline && (
          <ToolbarButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            tooltip={t("underline")}
            shortcut={`${mod}U`}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Strikethrough */}
        {TOOLBAR_FEATURES.strikethrough && (
          <ToolbarButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            tooltip={t("strikethrough")}
            shortcut={`${mod}${shift}S`}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Code */}
        {TOOLBAR_FEATURES.code && (
          <ToolbarButton
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            tooltip={t("code")}
            shortcut={`${mod}E`}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Clear formatting */}
        {TOOLBAR_FEATURES.clearFormatting && (
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            tooltip={t("clearFormatting")}
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Separator — only if color group is visible */}
        {hasColorGroup && <div className={`w-px bg-border ${docked ? "h-5 mx-1" : "h-4 mx-0.5"}`} />}

        {/* Text color */}
        {TOOLBAR_FEATURES.textColor && (
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setColorOpen((o) => !o)}
                    className={`relative flex items-center justify-center h-7 w-7 rounded transition-colors ${
                      currentColor
                        ? "text-foreground"
                        : "text-muted-foreground"
                    } hover:bg-accent hover:text-foreground`}
                  >
                    <Baseline className="h-4 w-4" />
                    <span
                      className="absolute bottom-0.5 left-1.5 right-1.5 h-0.75 rounded-full"
                      style={{
                        backgroundColor: currentColor || "currentColor",
                      }}
                    />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              {!colorOpen && (
                <TooltipContent side="top" sideOffset={8}>
                  <p className="font-medium text-[11px]">{t("textColor")}</p>
                </TooltipContent>
              )}
            </Tooltip>
            <PopoverContent
              className="w-auto p-2"
              align="center"
              side="top"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex gap-1.5 flex-wrap max-w-32.5">
                {FONT_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.name}
                    color={c.value}
                    active={currentColor === c.value}
                    onClick={() => setFontColor(c.value)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Highlight */}
        {TOOLBAR_FEATURES.highlight && (
          <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setHighlightOpen((o) => !o)}
                    className={`relative flex items-center justify-center h-7 w-7 rounded transition-colors ${
                      currentHighlight
                        ? "text-foreground"
                        : "text-muted-foreground"
                    } hover:bg-accent hover:text-foreground`}
                  >
                    <Highlighter className="h-4 w-4" />
                    {currentHighlight && (
                      <span
                        className="absolute bottom-0 left-1 right-1 h-0.75 rounded-full"
                        style={{ backgroundColor: currentHighlight }}
                      />
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              {!highlightOpen && (
                <TooltipContent side="top" sideOffset={8}>
                  <p className="font-medium text-[11px]">{t("highlight")}</p>
                </TooltipContent>
              )}
            </Tooltip>
            <PopoverContent
              className="w-auto p-2"
              align="center"
              side="top"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex gap-1.5 flex-wrap max-w-32.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.name}
                    color={c.value}
                    active={currentHighlight === c.value}
                    onClick={() => setHighlightColor(c.value)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Move block up/down — only in block editing mode */}
        {TOOLBAR_FEATURES.moveBlocks && blockEditing && (
          <>
            <div className={`w-px bg-border ${docked ? "h-5 mx-1" : "h-4 mx-0.5"}`} />
            <ToolbarButton
              active={false}
              onClick={() => { pinnedUntilRef.current = Date.now() + 1000; moveBlockUp(editor); }}
              tooltip={t("moveUp")}
            >
              <MoveUp className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              active={false}
              onClick={() => { pinnedUntilRef.current = Date.now() + 1000; moveBlockDown(editor); }}
              tooltip={t("moveDown")}
            >
              <MoveDown className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}
      </div>
    </TooltipProvider>,
    document.body
  );
}
