"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GripVertical, Plus, ChevronUp, ChevronDown, Trash2, Move } from "lucide-react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface EntryGripProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
  sortableAttributes: DraggableAttributes;
  sortableListeners: SyntheticListenerMap | undefined;
  labels: {
    delete: string;
    moveUp: string;
    moveDown: string;
    addBelow: string;
    dragHint: string;
    longPressHint: string;
  };
  /** Use "sidebar" variant for dark-background sidebar context */
  sidebar?: boolean;
}

export function EntryGrip({
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddBelow,
  sortableAttributes,
  sortableListeners,
  labels,
  sidebar,
}: EntryGripProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const gripBtnClass = sidebar
    ? "p-1.5 can-hover:p-1 rounded transition-colors hover:bg-white/10 touch-manipulation cursor-grab active:cursor-grabbing"
    : "p-1.5 can-hover:p-1 rounded transition-colors hover:bg-gray-100 touch-manipulation cursor-grab active:cursor-grabbing";

  const iconColor = sidebar ? "opacity-60" : "text-gray-400";
  const itemClass = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100/70 dark:hover:bg-accent/50";
  const sep = <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />;

  return (
    <div className={`absolute right-full ${sidebar ? 'top-0' : 'top-1'} opacity-60 can-hover:opacity-40 can-hover:group-hover/entry:opacity-100 transition-opacity duration-150`}>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            className={gripBtnClass}
            {...sortableAttributes}
            {...sortableListeners}
          >
            <GripVertical className={`h-4 w-4 ${iconColor}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1.5" align="start" side={sidebar ? "bottom" : "left"}>
          <button
            onClick={() => { onAddBelow(); setMenuOpen(false); }}
            className={itemClass}
          >
            <Plus className="h-4 w-4 text-gray-400" />
            {labels.addBelow}
          </button>

          {(onMoveUp || onMoveDown) && (
            <>
              {sep}
              {onMoveUp && (
                <button
                  onClick={() => { onMoveUp(); setMenuOpen(false); }}
                  className={itemClass}
                >
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                  {labels.moveUp}
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={() => { onMoveDown(); setMenuOpen(false); }}
                  className={itemClass}
                >
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                  {labels.moveDown}
                </button>
              )}
            </>
          )}

          {sep}
          <button
            onClick={() => { onDelete(); setMenuOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            {labels.delete}
          </button>

          {sep}
          <div className="px-3 py-1.5">
            <p className="hidden can-hover:flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <Move className="h-3.5 w-3.5 shrink-0" />
              {labels.dragHint}
            </p>
            <p className="flex can-hover:hidden items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <Move className="h-3.5 w-3.5 shrink-0" />
              {labels.longPressHint}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
