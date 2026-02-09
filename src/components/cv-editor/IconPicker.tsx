"use client";

import { memo, useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Link,
  Calendar,
  Briefcase,
  FileText,
  MessageSquare,
  LucideIcon,
} from "lucide-react";

// @ts-ignore - Iconos deprecados pero funcionales para redes sociales
import {
  LinkedinIcon,
  GithubIcon,
  TwitterIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "lucide-react";

// Catálogo de iconos organizados por categoría
const iconCategories = {
  "Redes Sociales": {
    Linkedin: LinkedinIcon,
    Github: GithubIcon,
    Twitter: TwitterIcon,
    Facebook: FacebookIcon,
    Instagram: InstagramIcon,
    Youtube: YoutubeIcon,
  },
  Contacto: {
    Mail: Mail,
    Phone: Phone,
    MapPin: MapPin,
    Globe: Globe,
    Calendar: Calendar,
    MessageSquare: MessageSquare,
  },
  Otros: {
    Link: Link,
    Briefcase: Briefcase,
    FileText: FileText,
  },
};

// Mapa completo de iconos para uso externo
export const iconMap: Record<string, LucideIcon> = Object.values(
  iconCategories
).reduce((acc, category) => ({ ...acc, ...category }), {});

interface IconPickerProps {
  currentIcon?: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement;
}

export const IconPicker = memo(function IconPicker({
  currentIcon,
  onSelect,
  onClose,
  anchorEl,
}: IconPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorEl, onClose]);

  // Posicionar el popover
  useEffect(() => {
    if (!popoverRef.current) return;

    const rect = anchorEl.getBoundingClientRect();
    const popover = popoverRef.current;

    // Posición por defecto: debajo y alineado a la izquierda
    let top = rect.bottom + 4;
    let left = rect.left;

    // Si no hay espacio abajo, mostrar arriba
    if (top + popover.offsetHeight > window.innerHeight) {
      top = rect.top - popover.offsetHeight - 4;
    }

    // Si no hay espacio a la derecha, alinear a la derecha
    if (left + popover.offsetWidth > window.innerWidth) {
      left = rect.right - popover.offsetWidth;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, [anchorEl]);

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-55 max-h-100 overflow-y-auto"
    >
      <div className="p-2 space-y-2">
        {Object.entries(iconCategories).map(([category, icons]) => (
          <div key={category}>
            <h4 className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
              {category}
            </h4>
            <div className="grid grid-cols-5 gap-1">
              {Object.entries(icons).map(([name, Icon]) => {
                const isSelected = currentIcon === name;

                return (
                  <button
                    key={name}
                    onClick={() => {
                      onSelect(name);
                      onClose();
                    }}
                    className={`
                      p-2 rounded transition-all duration-150
                      ${
                        isSelected
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }
                    `}
                    aria-label={name}
                    title={name}
                  >
                    <Icon className="h-4 w-4 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
