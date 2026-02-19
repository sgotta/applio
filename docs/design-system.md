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
- Tipografía: `text-[10px] font-semibold`
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
| **Primary text** | `gray-900` (`#111827`) | `gray-100` |
| **Secondary text** | `gray-700` | `gray-200` |
| **Muted text** | `gray-500` | `gray-400` |
| **Subtle/label text** | `gray-400` | `gray-400` |
| **Backgrounds** | `white` / `gray-50` | `gray-950` / `gray-800` |
| **Borders** | `gray-200` | `gray-700` / `gray-800` |
| **Hover bg** | `gray-100` | `accent` |

### Regla general

- **Amber** = premium/monetización
- **Emerald** = activo/conectado/premium activo
- **Gray** = neutral/UI base
- **Red** = destructivo (eliminar, errores)

---

## 3. Typography

### Tamaños UI (no CV content)

| Uso | Clase |
|---|---|
| Section labels (uppercase) | `text-xs font-medium uppercase tracking-wide text-gray-400` |
| Menu items | `text-sm text-gray-700 dark:text-gray-200` |
| Mobile menu items | `text-[15px]` |
| Micro labels | `text-[10px]` |
| Badge text | `text-[10px] font-semibold` |
| Tooltip content | Default shadcn |

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

### Spacing

- Toolbar popovers: `p-3.5` padding, `space-y-4` entre secciones
- Mobile sheets: `px-3.5 pt-2.5 pb-1.5`
- Between label and content: `mb-2`
- Between list items: `space-y-0.5`

### Border radius

- Badges/pills: `rounded-full`
- Botones de acción: `rounded-md`
- Cards: `rounded-lg`
- Color swatches: `rounded-full` (h-7 w-7)
- Pattern swatches: `rounded-md` (h-9 w-9)

---

## 7. Component Checklist

Al crear un nuevo elemento de UI, verificá:

- [ ] Dark mode: tiene variantes `dark:` para backgrounds, text y borders
- [ ] Premium gate: si es PRO, usa `PremiumBadge` (texto) o Lock overlay (swatch)
- [ ] Hover: tiene `transition-colors` y estado hover
- [ ] Focus: tiene `focus-visible:ring-*` si es interactivo
- [ ] Icons: tamaño correcto según contexto (ver sección 4)
- [ ] Spacing: consistente con secciones vecinas
- [ ] Mobile: tiene variante mobile o responsive
