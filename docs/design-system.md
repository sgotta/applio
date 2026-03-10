# Applio Design System

Convenciones visuales del proyecto. Consultá este archivo antes de implementar cualquier UI nueva.

---

## 1. Premium Indicators

Hay **dos patrones** según el contexto. No mezclar.

### Badge PRO (para items de lista/texto)

Usar el componente `<PremiumBadge />` de `src/components/premium/PremiumBadge.tsx`.

- Visual: pill amber con Lock + "PRO"
- Light: `bg-amber-100 text-amber-700`
- Dark: `bg-amber-900/50 text-amber-400`
- Hover: `bg-amber-200` / `dark:bg-amber-800/50`
- Tipografía: `text-badge font-semibold`
- Icon: `Lock h-2.5 w-2.5`
- Padding: `px-1.5 py-0.5`, gap: `gap-0.5`
- Forma: `rounded-full`
- Al clickear abre `UpgradeDialog`

**Usar en:** listas de fuentes, toggles de secciones, cualquier item textual bloqueado.

```tsx
import { PremiumBadge } from "@/components/premium/PremiumBadge";

// Dentro de un item de lista
<span className="flex items-center gap-2">
  {label}
  {isLocked && <PremiumBadge />}
</span>
```

### Lock overlay (para swatches visuales)

Para elementos donde un badge textual no cabe (círculos de color, cuadrados de pattern).

- Icon: `Lock h-3 w-3` centrado con `absolute inset-0 m-auto`
- Color adaptativo al fondo:
  - Fondo claro: `text-gray-800/60`
  - Fondo oscuro: `text-white/70`
- Efecto: `drop-shadow-sm`

**Usar en:** color swatches, pattern previews, cualquier miniatura visual bloqueada.

### Status indicators (cuenta/sync)

- Premium activo: `bg-emerald-500` (dot), `text-emerald-500` (icon)
- Free/sin login: `bg-amber-500` (dot), `text-amber-500` (icon)
- Tamaño dot: `h-1.5 w-1.5 rounded-full` (inline) o `h-3 w-3` (badge en avatar)

---

## 2. Color Palette

### Semántica de colores

| Rol | Light | Dark |
|---|---|---|
| **Premium/PRO badge** | `amber-100` bg, `amber-700` text | `amber-900/50` bg, `amber-400` text |
| **Active/Premium status** | `emerald-500` | `emerald-500` |
| **Free/inactive status** | `amber-500` | `amber-500` |
| **Destructive** | `red-600` | `red-500` |
| **Backgrounds** | `white` / `gray-50` | `gray-950` / `gray-800` |
| **Borders** | `gray-200` | `gray-700` / `gray-800` |
| **Hover bg** | `gray-100` | `accent` |

### Regla general

- **Amber** = premium/monetización
- **Emerald** = activo/conectado/premium activo
- **Gray** = neutral/UI base
- **Red** = destructivo (eliminar, errores)

### Semantic text colors (design tokens)

Usá **siempre** tokens semánticos en vez de colores gray hardcodeados. Los tokens manejan dark mode automáticamente — una sola clase en vez de dos.

| Token | Tailwind class | Light | Dark | Uso |
|---|---|---|---|---|
| `--foreground` | `text-foreground` | `#111827` (gray-900) | `#f5f5f5` | Texto primario: headings, nombres, contenido principal |
| `--on-subtle` | `text-on-subtle` | `#374151` (gray-700) | `#e5e7eb` (gray-200) | Texto secundario: menu items, descripciones, body en popovers |
| `--muted-foreground` | `text-muted-foreground` | `#6b7280` (gray-500) | `#b5b5b5` | Texto muted: info secundaria, placeholders |
| `--subtle` | `text-subtle` | `#9ca3af` (gray-400) | `#6b7280` (gray-500) | Texto deemphasized: labels uppercase, hints, timestamps |

> **Regla:** Usá `text-foreground`, `text-on-subtle`, `text-muted-foreground`, o `text-subtle` según la jerarquía. Evitá `text-gray-400 dark:text-gray-500` y combinaciones similares — los tokens ya resuelven ambos modos.

---

## 3. Typography

### Tamaños UI — Design Tokens

Usá **siempre** los tokens definidos en `globals.css` (`@theme inline`). Nunca uses valores crudos como `text-[13px]`.

| Token | Tailwind class | Valor | Uso |
|---|---|---|---|
| `--font-size-micro` | `text-micro` | 9px | Badge accents ("POPULAR", "PRO" tags), micro indicators |
| `--font-size-badge` | `text-badge` | 10px | PRO badge text, section group labels (uppercase) |
| `--font-size-label` | `text-label` | 11px | Form labels, hint text, section headers mobile |
| `--font-size-menu` | `text-menu` | 13px | Desktop menu items, popover body text, inputs |
| `--font-size-mobile-menu` | `text-mobile-menu` | 15px | Mobile menu items, sheet buttons, toast text |
| `--font-size-mobile-title` | `text-mobile-title` | 17px | Mobile nav headers, brand name |

> **Nota:** Para texto estándar de UI que coincida con Tailwind built-in (`text-xs` = 12px, `text-sm` = 14px, `text-base` = 16px), seguí usando las clases de Tailwind. Los tokens cubren los tamaños intermedios que no existen en la escala default.

### Pesos

- `font-medium` — labels, botones
- `font-semibold` — badges PRO, emphasis
- `font-bold` — nunca en UI (solo CV content)

---

## 4. Icons

- **Librería**: `lucide-react` (única)
- **Tamaños estándar**:
  - `h-3 w-3` — iconos dentro de swatches, inline small
  - `h-3.5 w-3.5` — iconos en botones de toolbar, menú
  - `h-4 w-4` — iconos principales (Check, chevrons)
  - `h-5 w-5` — iconos grandes (en diálogos, heroes)
- **Iconos PRO**: siempre `Lock` de lucide-react

---

## 5. Interactive Patterns

### Hover states

- Botones de menú: `hover:bg-gray-100 dark:hover:bg-accent`
- Color swatches: `hover:scale-110`
- Delete/move buttons: `opacity-0 → opacity-100` on parent hover
- Transitions: siempre `transition-colors` o `transition-all`

### Focus visible

- Ring pattern: `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400`

### Toggle buttons (S/M/L, scope selector)

- Active: `bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`
- Inactive: `bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-accent dark:text-gray-300`
- Size: `h-7 w-7 rounded-md` (desktop), `h-8 w-8` (mobile)

---

## 6. Layout

### Spacing decisions

| Contexto | Padding | Gap entre secciones |
|---|---|---|
| Desktop popover (con contenido) | `p-4` | `space-y-4` |
| Desktop popover (compact, ej. file menu) | `p-3` | `space-y-2` |
| Desktop popover (custom layout, ej. account) | `p-0` | — |
| Mobile sheet | `p-0` (padding individual por fila) | — |
| Mobile action row | `px-5 h-14` | — |
| Dialog content | shadcn default (`p-6`) | — |
| Section label → content | — | `mb-3` |
| Between list items | — | `space-y-0.5` |

### Component height decisions

| Contexto | Altura | Notas |
|---|---|---|
| Desktop toolbar icon button | `h-7 w-7` / `h-8 w-8` | Usar `<Button size="icon-sm">` |
| Desktop menu item row | `h-10` | Usar `<Button size="lg">` o `min-h-[36px]` |
| Mobile toolbar icon button | `h-9 w-9` | Usar `<Button size="icon">` |
| Mobile toggle button | `h-11 w-11` | Touch-friendly |
| Mobile CTA button | `h-12` | Prominent actions |
| Mobile sheet action row | `h-14` | Full-width action rows |
| Touch target mínimo | `min-h-[44px]` | WCAG 2.5.8, solo mobile |

### Border radius

- Badges/pills: `rounded-full`
- Botones de acción: `rounded-md`
- Cards: `rounded-lg`
- Color swatches: `rounded-full` (h-7 w-7)
- Pattern swatches: `rounded-md` (h-9 w-9)

---

## 7. Component Checklist

Al crear un nuevo elemento de UI, verificá:

- [ ] Dark mode: usa tokens semánticos (`text-foreground`, `text-on-subtle`, etc.) en vez de pares `dark:`
- [ ] Premium gate: si es PRO, usa `PremiumBadge` (texto) o Lock overlay (swatch)
- [ ] Hover: tiene `transition-colors` y estado hover
- [ ] Focus: tiene `focus-visible:ring-*` si es interactivo
- [ ] Icons: tamaño correcto según contexto (ver sección 4)
- [ ] Typography: usa tokens (`text-menu`, `text-badge`, etc.), no valores crudos
- [ ] Spacing: consistente con tabla de spacing decisions (sección 6)
- [ ] Mobile: tiene variante mobile o responsive
- [ ] Botones: usa `<Button>` de shadcn con variant y size apropiados, no `<button>` raw

---

## 8. Migration Guide

Al migrar componentes existentes a design tokens:

### Typography

| Antes | Después |
|---|---|
| `text-[9px]` | `text-micro` |
| `text-[10px]` | `text-badge` |
| `text-[11px]` | `text-label` |
| `text-[13px]` | `text-menu` |
| `text-[15px]` | `text-mobile-menu` |
| `text-[17px]` | `text-mobile-title` |

### Text colors

| Antes | Después |
|---|---|
| `text-gray-900 dark:text-gray-100` | `text-foreground` |
| `text-gray-800 dark:text-gray-100` | `text-foreground` |
| `text-gray-700 dark:text-gray-200` | `text-on-subtle` |
| `text-gray-500 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-400 dark:text-gray-500` | `text-subtle` |
| `text-gray-400 dark:text-gray-400` | `text-subtle` |

> **Regla:** Migrá de a un archivo por PR. Verificá dark mode visualmente después de cada migración.
