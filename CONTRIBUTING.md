# Contributing to Applio

## Quick Setup

```bash
git clone <repo-url>
cd applio
npm install
npm run dev        # http://localhost:3000
```

## How the Codebase Works

### The 5 Files You Need to Know

| File | Role |
|---|---|
| `src/lib/types.ts` | All TypeScript interfaces — the data model |
| `src/lib/cv-context.tsx` | Central state management (add, update, remove, move operations) |
| `src/lib/default-data.ts` | Sample data shown to new users |
| `src/components/cv-editor/CVPreview.tsx` | The interactive editor (what the user sees) |
| `src/components/cv-editor/PrintableCV.tsx` | The PDF render tree (what gets exported) |

### Data Flow

```
User clicks "edit" on a field
  → EditableText component captures the change
    → Calls a method from CVContext (e.g., updateExperience)
      → CVContext updates state via setState
        → Auto-save to localStorage (500ms debounce)
        → Both CVPreview and PrintableCV re-render with new data
```

### Inline Editing

Everything editable uses the `EditableText` component (`src/components/cv-editor/EditableText.tsx`):

```tsx
<EditableText
  value={item.company}
  onChange={(newValue) => updateExperience(item.id, { company: newValue })}
  placeholder="Company name"
  as="subheading"
/>
```

Click to edit, Enter or blur to save, Escape to cancel.

## Common Tasks

### Adding a New CV Section

This is the most common type of change. Follow these steps in order:

**1. Define the type** (`src/lib/types.ts`)
```ts
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
}
```

Add it to `CVData`:
```ts
export interface CVData {
  // ...existing fields
  projects: ProjectItem[];
}
```

If the section is toggleable, add it to `SectionVisibility` too.

**2. Add default data** (`src/lib/default-data.ts`)
```ts
// Add to both enData and esData objects:
projects: [],
```

And to `defaultVisibility` if toggleable:
```ts
export const defaultVisibility: SectionVisibility = {
  // ...existing
  projects: false,
};
```

**3. Add CRUD methods** (`src/lib/cv-context.tsx`)

Add to the `CVContextValue` interface:
```ts
addProject: () => void;
updateProject: (id: string, updates: Partial<ProjectItem>) => void;
removeProject: (id: string) => void;
```

Implement with `useCallback`:
```ts
const addProject = useCallback(() => {
  setData(prev => ({
    ...prev,
    projects: [...prev.projects, { id: generateId(), name: "", description: "", url: "" }],
  }));
}, []);
```

Follow the same pattern as `addExperience`, `updateExperience`, `removeExperience`.

**4. Create the component** (`src/components/cv-editor/Projects.tsx`)

Follow the pattern from `Experience.tsx` or `Courses.tsx`:
- Use `memo()` wrapper
- Use `"use client"` directive
- Use `EditableText` for all editable fields
- Add hover-reveal delete buttons
- Use `useTranslations` for UI text

**5. Add to CVPreview** (`src/components/cv-editor/CVPreview.tsx`)

Import and render your component in the appropriate column.

**6. Add to PrintableCV** (`src/components/cv-editor/PrintableCV.tsx`)

Add a static (non-interactive) version. No buttons, no hover states — just text.

**7. Add translations** (`src/messages/*.json`)

Add labels for your section in all 9 language files.

### Adding a New Color Scheme

Edit `src/lib/color-schemes.ts`:

1. Add the name to the `ColorSchemeName` type
2. Add the scheme object to `COLOR_SCHEMES` (follow existing pattern)
3. Add the name to `COLOR_SCHEME_NAMES` array
4. Add translation keys for the scheme name in all `src/messages/*.json` files

### Adding a New Language

1. Create `src/messages/{code}.json` copying the structure from `en.json`
2. Import it in `src/lib/locale-context.tsx`
3. Add the locale code to the `Locale` type, `LOCALES` array, and `LOCALE_NAMES` record
4. Add it to the `messages` record
5. Optionally add default CV sample data in `src/lib/default-data.ts`

## Code Conventions

### Component Structure

```tsx
"use client";

import { memo } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";

interface MyComponentProps {
  someField: string;
}

export const MyComponent = memo(function MyComponent({ someField }: MyComponentProps) {
  const { data, updateSomething } = useCV();
  const t = useTranslations("mySection");

  return (
    // JSX with Tailwind classes
  );
});
```

### Rules

- **Tailwind only** — No CSS modules, no styled-components, no inline `style` objects (except for dynamic color scheme values)
- **lucide-react only** — Don't add other icon libraries
- **`memo()` everything** — All components should be wrapped in `memo()` to prevent unnecessary re-renders
- **`useCallback` for context methods** — All functions exposed by context providers use `useCallback` with empty deps (safe because they use functional setState)
- **No prop drilling** — Use `useCV()` hook to access state. Don't pass data through 3+ levels of props

### Dual Render Tree Rule

**Any visual change to the editor must also be applied to PrintableCV.** These two components render the same data but independently:

- `CVPreview` — Interactive (buttons, hover effects, EditableText)
- `PrintableCV` — Static (plain text, optimized spacing, no interactivity)

If you add a section to the editor and forget PrintableCV, it won't appear in the PDF.

## Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (includes TypeScript type-check)
npm run lint         # Run ESLint
npx shadcn@latest add [name]  # Add a new shadcn/ui component
```

## Adding shadcn/ui Components

Need a new UI primitive (dialog, tabs, accordion, etc.)?

```bash
npx shadcn@latest add dialog
```

Components are installed to `src/components/ui/`. Don't modify these files unless necessary — they're managed by shadcn.
