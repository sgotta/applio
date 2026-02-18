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
    ? "p-0.5 rounded transition-colors hover:bg-white/10 touch-manipulation cursor-grab active:cursor-grabbing"
    : "p-0.5 rounded transition-colors hover:bg-gray-100 touch-manipulation cursor-grab active:cursor-grabbing";

  const iconColor = sidebar ? "opacity-50" : "text-gray-300";
  const itemClass = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-accent/50";
  const separator = "mt-1 border-t border-gray-100 dark:border-gray-700 pt-1";

  return (
    <div className={`absolute right-full ${sidebar ? 'top-0' : 'top-1'} can-hover:opacity-0 can-hover:group-hover/entry:opacity-100 transition-opacity duration-150`}>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            className={gripBtnClass}
            {...sortableAttributes}
            {...sortableListeners}
          >
            <GripVertical className={`h-3.5 w-3.5 ${iconColor}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start" side={sidebar ? "bottom" : "left"}>
          <button
            onClick={() => { onAddBelow(); setMenuOpen(false); }}
            className={itemClass}
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.addBelow}
          </button>
          {(onMoveUp || onMoveDown) && (
            <div className={separator}>
              {onMoveUp && (
                <button
                  onClick={() => { onMoveUp(); setMenuOpen(false); }}
                  className={itemClass}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  {labels.moveUp}
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={() => { onMoveDown(); setMenuOpen(false); }}
                  className={itemClass}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {labels.moveDown}
                </button>
              )}
            </div>
          )}
          <div className={separator}>
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {labels.delete}
            </button>
          </div>
          <div className={`${separator.replace('pt-1', 'pt-1.5')} px-2 pb-1`}>
            <p className="hidden can-hover:flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <Move className="h-3 w-3 shrink-0" />
              {labels.dragHint}
            </p>
            <p className="flex can-hover:hidden items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <Move className="h-3 w-3 shrink-0" />
              {labels.longPressHint}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
