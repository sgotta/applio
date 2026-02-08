"use client";

import { ContactItem } from "@/lib/types";
import { EditableText } from "./EditableText";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Link,
  X,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Link,
};

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
  const Icon = contact.icon ? iconMap[contact.icon] || Link : Link;

  return (
    <div className="flex items-center gap-2 group hover:bg-gray-50 -mx-1 px-1 py-0.5 rounded transition-colors duration-150">
      {/* Ícono */}
      <Icon className="h-3 w-3 flex-shrink-0 text-gray-400" />

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
  );
}
