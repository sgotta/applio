"use client";

import { useState } from "react";
import { ContactItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import { IconPicker, iconMap } from "./IconPicker";
import { Link, X } from "lucide-react";

interface EditableContactProps {
  contact: ContactItem;
  onChange: (contact: ContactItem) => void;
  onRemove: () => void;
}

export function EditableContact({
  contact,
  onChange,
  onRemove,
}: EditableContactProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const Icon = contact.icon ? iconMap[contact.icon] || Link : Link;

  return (
    <>
      <div className="flex items-center gap-2 group hover:bg-gray-50 -mx-1 px-1 py-0.5 rounded transition-colors duration-150">
        {/* Ícono clickeable */}
        <button
          onClick={(e) => setAnchorEl(e.currentTarget)}
          className="p-0.5 rounded hover:bg-gray-200 transition-colors duration-150"
          aria-label="Cambiar ícono"
          title="Cambiar ícono"
        >
          <Icon className="h-3 w-3 shrink-0 text-gray-400 hover:text-gray-600" />
        </button>

        {/* Valor editable */}
        <EditableText
          value={contact.value}
          onChange={(value) => onChange({ ...contact, value })}
          placeholder={contact.label}
          as="small"
          className="flex-1 min-w-0"
        />

        {/* Botón eliminar (solo al hover) */}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all duration-150"
          aria-label={`Eliminar ${contact.label}`}
        >
          <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      {/* Popover selector de iconos */}
      {anchorEl && (
        <IconPicker
          currentIcon={contact.icon}
          onSelect={(iconName) =>
            onChange({ ...contact, icon: iconName })
          }
          onClose={() => setAnchorEl(null)}
          anchorEl={anchorEl}
        />
      )}
    </>
  );
}
