# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Applio** is a CV builder with a minimalist Notion-style inline editing experience. Built with Next.js 16 App Router, React 19, and Tailwind CSS v4. Features a marketing landing page at `/`, an interactive editor at `/editor`, OAuth authentication (Google/GitHub) via Auth.js v5, cloud sync (MongoDB), shareable CV links, and a Stripe-based premium plan.

## Version Bumping

When creating a commit, **always** bump the `version` field in `package.json` before committing:
- **patch** (1.28.0 → 1.28.1): bug fixes, small tweaks, copy changes
- **minor** (1.28.0 → 1.29.0): new features, new sections, significant UI changes
- **major** (1.28.0 → 2.0.0): breaking changes, major rewrites (rare — only when explicitly requested)

Ask the user to confirm the version bump level before applying it. A GitHub Action automatically creates a release when the version changes on `main`.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production (TypeScript type-checks included)
npm run lint         # Run ESLint

# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Unit Testing (Vitest)
npm run test:unit         # Run all unit tests (114 tests, ~2s)
npm run test:unit:watch   # Run in watch mode

# E2E Testing (Playwright)
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:headed   # Run with visible browser
npx playwright test --config e2e/playwright.config.ts --grep @smoke       # Smoke only (27 tests)
npx playwright test --config e2e/playwright.config.ts --grep @regression  # Regression only (27 tests)

# Deploy
vercel               # Deploy to production (requires Vercel CLI)
```

## Architecture

### Routing

| Route | Page | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing landing page (hero, feature demos, CTA to `/editor`) |
| `/editor` | `src/app/editor/page.tsx` | CV editor — full provider stack, main app |
| `/cv/[slug]` | `src/app/cv/[slug]/page.tsx` | Shared CV public view (SSR, read-only) |
| `/api/auth/*` | `src/app/api/auth/[...nextauth]/route.ts` | Auth.js v5 route handlers (OAuth callbacks, session) |
| `/checkout/success` | `src/app/checkout/success/page.tsx` | Post-payment confirmation, redirects to editor |
| `/api/upload-photo` | API route | Uploads profile photo to Cloudflare R2 (sharp resize + WebP) |
| `/api/stripe/checkout` | API route | Creates Stripe Checkout Session |
| `/api/stripe/webhook` | API route | Handles Stripe webhook (payment → premium upgrade) |

### Provider Nesting (Editor: `/editor`)

```
ThemeProvider
  ColorSchemeProvider
    SidebarPatternProvider
      FontSettingsProvider
        LocaleProvider
          AuthProvider              ← Auth.js v5 session (next-auth)
            PlanProvider            ← free/premium plan from MongoDB users.subscription
              SyncStatusProvider    ← sync state indicator (idle/syncing/synced/error)
                CVProvider          ← CV data (single source of truth)
                  TooltipProvider
                    <CloudSync />   ← Invisible component, handles bi-directional sync
                    <AppContent />  ← Toolbar + CVEditor
```

The landing page (`/`) only uses `ThemeProvider > LocaleProvider`.

### State Management: CVContext Pattern

All CV data lives in `src/lib/cv-context.tsx` using React Context API. This is the **single source of truth**.

**Key characteristics:**
- ~32 CRUD methods (add, update, remove, move, reorder operations for every section)
- All methods use `useCallback` for memoization
- Immutable updates with spread operator and functional setState
- Auto-save to localStorage with 500ms debounce
- Migration functions in `src/lib/cv-migrations.ts` (`migrateCVData`, `migrateMarkdownBold`, `migrateBulletsToHtml`, `migrateSidebarOrder`, `moveItem`) for backward compatibility with old localStorage formats
- Exposes `loading`, `hadSavedData` flags

**Data flow:**
```
CVProvider (context)
  → useCV() hook
    → Components consume/update via context methods
      → Auto-save to localStorage (500ms debounce)
      → CloudSync auto-saves to MongoDB (3s debounce, when logged in)
```

### Data Model: src/lib/types.ts

Central data structure: `CVData` interface containing:
- `personalInfo` — Name, title, photo (base64 or R2 URL), email, phone, location, linkedin, website, linkedinUrl, websiteUrl
- `summary` — About me text
- `experience[]` — Work history with bullet points
- `education[]` — Academic background
- `skills[]` — Categorized skills
- `courses[]` — Courses & workshops (optional, visibility toggle)
- `certifications[]` — Certifications (optional, visibility toggle)
- `awards[]` — Awards & honors (optional, visibility toggle)
- `visibility` — Toggle visibility for contact fields and optional sections
- `sidebarOrder` — Order of sidebar sections (`SidebarSectionId[]`)

**All items use string `id` generated by `generateId()` (random base36)**

### Component Architecture

```
src/app/editor/page.tsx
├── Provider stack (9 providers)
├── CloudSync (invisible, sync logic)
└── AppContent
    ├── Toolbar (file menu, color scheme, font, sections, theme, language, account)
    ├── CVEditor
    │   └── CVPreview (main editor with two-column layout)
    │       ├── LEFT COLUMN (PersonalInfo)
    │       │   └── Photo, contact fields, summary, skills (drag-and-drop)
    │       └── RIGHT COLUMN
    │           ├── CVHeader (name & title, editable)
    │           ├── Experience (drag-and-drop entries)
    │           ├── Education (drag-and-drop entries)
    │           ├── Courses (optional, drag-and-drop)
    │           ├── Certifications (optional, drag-and-drop)
    │           └── Awards (optional, drag-and-drop)
    └── PrintableCV (hidden, triggers PDF generation)
```

### Inline Editing: Tiptap-powered EditableText

**EditableText** (`src/components/cv-editor/EditableText.tsx`) is the universal inline editing primitive. Internally it mounts a **Tiptap** editor on click/focus.

**Tiptap extensions active:**
- `StarterKit` (headings h2-h4, bullet/ordered lists, blockquote — only in `blockEditing` mode)
- `@tiptap/extension-underline`
- `@tiptap/extension-text-style` + `@tiptap/extension-color` (inline text colors)
- `@tiptap/extension-highlight` (multicolor highlighting)
- `@tiptap/extension-placeholder`

**Key props:**
| Prop | Description |
|---|---|
| `richText` | Enables bold/italic/underline/color/highlight |
| `blockEditing` | Adds headings, lists, blockquote. Implies richText + multiline |
| `autoEdit` | Start in editing mode on mount |
| `editOutline` | Show blue ring when editing (default true) |
| `doubleClickToEdit` | Require double-click to enter edit mode (used with drag) |
| `onEditingChange` | Callback when editing state changes |
| `deleteOnEmpty` | Backspace on empty editor deletes the element (e.g., skill badges) |

**Smart paste:** Cleans PDF line breaks (single `\n` → space, `\n\n` → paragraph) and sanitizes pasted HTML.

**Usage pattern:**
```typescript
<EditableText
  value={item.field}
  onChange={(newValue) => updateItem(item.id, { field: newValue })}
  placeholder="Click para editar..."
  multiline={false}
  richText
  as="body" // or "heading", "subheading", "small"
/>
```

### Drag & Drop: @dnd-kit

All list sections use `@dnd-kit/core` + `@dnd-kit/sortable` for reordering:
- Experience, Education, Courses, Certifications, Awards entries
- Skill groups in the sidebar

Each draggable item has an **EntryGrip** component (dot-grip handle on the left). On mobile (coarse pointer), the grip requires long-press to start dragging, and a brief tap opens a popover with actions (Move Up, Move Down, Add Below, Delete).

The CVContext exposes `reorder*` methods (using `arrayMove`) in addition to the older `move*` (up/down) methods.

### PDF Generation: @react-pdf/renderer

**Two separate render trees that must stay in sync:**
1. **CVPreview** — Interactive editor (HTML/CSS, Tiptap, drag-and-drop)
2. **pdf-document.tsx** (`CVPDFDocument`) — PDF output using `@react-pdf/renderer`

`generate-pdf.ts` → `downloadPDF()` creates a blob via `pdf(<CVPDFDocument />).toBlob()` and triggers a browser download. The PDF button is inside the file menu (`btn-file-menu`).

**Critical:** `src/lib/pdf-document.tsx` must stay in sync with CVPreview structure. When adding sections to editor, add to both.

**Rich text rendering:**
- `src/lib/render-rich-text.tsx` — Renders rich text markup as React elements (web editor)
- `src/lib/render-rich-text-pdf.tsx` — Renders rich text markup as `@react-pdf/renderer` elements (PDF)

### Authentication: Auth.js v5 (NextAuth)

**Files:** `src/lib/auth.ts`, `src/lib/auth-context.tsx`, `src/lib/mongodb.ts`

- Providers: **Google** and **GitHub** via Auth.js v5 (`next-auth`)
- `src/lib/auth.ts` configures NextAuth with `MongoDBAdapter(clientPromise)`, database session strategy, `allowDangerousEmailAccountLinking`
- Route handler: `src/app/api/auth/[...nextauth]/route.ts` — exports `handlers` from auth config
- `src/lib/mongodb.ts` — native `MongoClient` for the Auth.js adapter (separate from Mongoose)
- `src/middleware.ts` is minimal (no auth checks) — Auth.js handles cookies via its own route handlers
- `useAuth()` wraps `next-auth/react` `SessionProvider` — exposes: `user`, `loading`, `signInWithGoogle`, `signInWithGithub`, `signOut`
- `LoginDialog` (`src/components/auth/LoginDialog.tsx`) shows Google/GitHub buttons

### Cloud Sync

**File:** `src/components/cloud-sync/CloudSync.tsx` — render-null component with 3 effects:

1. **On login:** Fetches cloud CV via `GET /api/cv` → if differs from local (fingerprint comparison), shows conflict resolution dialog (keep local vs. use cloud). Discarded version backed up to `localStorage["cv-builder-backup"]`. Sets `initialSyncComplete` when done.
2. **Logout reset:** Clears sync state refs when user logs out.
3. **Unified auto-save:** 3s debounce after any `data` or settings change → `POST /api/cv` to MongoDB. Strips base64 photos (only R2 URLs persisted to cloud). Uploads base64 photos to R2 before saving. Only runs after initial sync completes.

**API routes:** `src/app/api/cv/route.ts` (GET/POST). Uses `cv-sync.ts` pure functions (`docToCVData`, `cvDataToDoc`) for MongoDB↔CVData mapping.
**Error handling:** Uses `sonner` toasts + `useSyncStatus()` for visual feedback (4 states: idle/syncing/synced/error).

### Premium Plan: Stripe

**Files:** `src/lib/plan-context.tsx`, `src/components/premium/UpgradeDialog.tsx`, `src/components/premium/PremiumBadge.tsx`

- `PlanProvider` fetches plan via `GET /api/cv/plan` which reads `users.subscription` from MongoDB
- `usePlan()` exposes `plan`, `isPremium`, `devOverride`/`setDevOverride` (for testing)
- Stripe checkout: `POST /api/stripe/checkout` → creates session → redirect to Stripe → webhook updates user subscription in MongoDB
- **Currently gated features:** extra color schemes, extra fonts (SourceSans3, Merriweather), sidebar patterns, optional sections (courses, certifications, awards)

**MongoDB `users` collection (subscription subdocument):**
- Fields: `plan` ("free" | "pro"), `billingInterval`, `provider` (stripe/mercadopago/paypal), `customerId`, `subscriptionId`, `currentPeriodEnd`
- Defined in `src/lib/models/user.ts`

### Photo Upload: Cloudflare R2

**Files:** `src/lib/r2.ts`, `src/app/api/upload-photo/route.ts`, `src/components/cv-editor/ProfilePhotoUpload.tsx`, `src/components/cv-editor/PhotoCropDialog.tsx`

- Client: `PhotoCropDialog` uses `react-easy-crop` for circular crop → generates JPEG base64
- If logged in: uploads to `/api/upload-photo` → `sharp` resizes to 300×300 WebP → stores in R2 → returns URL
- If not logged in: stores base64 in localStorage
- Rate limit: 10 uploads/hour per IP (in-memory)

### Shareable CV Links

**Route:** `/cv/[slug]`

- `POST /api/cv/publish` generates an 8-char slug and sets `isPublished = true` in MongoDB
- `src/app/cv/[slug]/page.tsx` uses `fetchPublishedCVServer()` (SSR) to render a read-only public view
- `shared-cv-content.tsx` is the client component for the shared CV display

### Persistence: localStorage

**Key:** `"cv-builder-data"`
**Format:** JSON serialized CVData
**Save trigger:** Any change to `data` state in CVContext
**Timing:** 500ms debounce

Other localStorage keys:
- `"applio-font-family"` / `"applio-font-size"` — Font settings
- `"applio-theme"` — Dark/light mode
- `"applio-pattern"` — Sidebar pattern (legacy: `"applio-sidebar-pattern"`)
- `"quickcv-locale"` — Locale (legacy name)
- `"cv-builder-backup"` — Backup of discarded version during sync conflict

**Migration strategy:**
- `migrateCVData()` runs on load to handle old localStorage formats
- Allows smooth updates without breaking existing users' data

### Styling: Tailwind CSS v4 + shadcn/ui

**Tailwind v4 specifics:**
- Uses `@theme inline` syntax (not `theme()` function)
- CSS variables defined in `src/app/globals.css`
- PostCSS with `@tailwindcss/postcss`

**shadcn/ui components:**
- Located in `src/components/ui/`
- New York style, neutral base color
- Add new components: `npx shadcn@latest add [name]`
- Icons: lucide-react only

**Color schemes:** 5 schemes defined in `src/lib/color-schemes.ts` (ivory default). Premium schemes gated behind plan.

**Sidebar patterns:** Decorative patterns for the sidebar, defined in `src/lib/sidebar-patterns.ts`. Settings managed by `SidebarPatternProvider`. All patterns except `"none"` are premium.

**Design System:** Before implementing any new UI, consult [`docs/design-system.md`](docs/design-system.md) for visual conventions (premium indicators, colors, spacing, icons, interactive patterns). Use `<PremiumBadge />` for text-based PRO indicators and Lock overlay for visual swatches.

### Fonts

- **4 selectable families:** Inter (default), Lato, Source Sans 3, Merriweather — all Latin-script Google Fonts TTF
- Font definitions in `src/lib/fonts.ts` (`FONT_SIZE_LEVELS`, `PDF_BASE_FONT_SCALE`, `getFontDefinition()`)
- `FontSettingsProvider` (`src/lib/font-context.tsx`) manages `fontFamilyId` and `fontSizeLevel`
- PDF fonts registered in `pdf-document.tsx`
- SourceSans3 and Merriweather are premium-only

### i18n

- 6 languages: en, es, fr, pt, de, it via `next-intl`
- Messages in `src/messages/*.json`
- All Latin-script, no CJK/special fonts needed
- Browser language auto-detection on first visit

### ID Generation and Array Operations

**IDs:** All items use `id: string` generated by:
```typescript
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
```

**Reorder operations (drag-and-drop):** `reorder*` methods use `arrayMove` from `@dnd-kit/sortable`

**Move operations (legacy arrows):** `moveItem<T>()` helper swaps adjacent items by index

**Remove operations:** All use `.filter(item => item.id !== id)` pattern

**Update operations:** All use `.map(item => item.id === id ? {...item, ...updates} : item)` pattern

## Key Patterns to Follow

### When Adding New Sections

1. **Define types** in `src/lib/types.ts`
2. **Add to CVData** interface
3. **Add default data** in `src/lib/default-data.ts`
4. **Add CRUD methods** to cv-context.tsx (add, update, remove, move, reorder + interface methods)
5. **Create component** in `src/components/cv-editor/`
   - Use EditableText for all editable fields
   - Use `@dnd-kit/sortable` for drag-and-drop reordering
   - Use EntryGrip as drag handle
   - Follow hover-reveal pattern for action buttons
   - Use memo() for performance
6. **Add to CVPreview** (editor view)
7. **Add to pdf-document.tsx** (PDF view) — update both `render-rich-text.tsx` and `render-rich-text-pdf.tsx` if using rich text

### Spanish Language (Argentine)

All UI text uses Argentine Spanish with **voseo**:
- "Agregá" not "Agrega"
- "Mostrá" not "Muestre"
- "Hacé" not "Haz"
- Informal "vos" conjugation throughout

### Component Conventions

- All client components: `"use client"` directive at top
- Export pattern: `export const ComponentName = memo(function ComponentName(props) { ... })`
- Props: Define TypeScript interface above component
- Hooks: Extract context methods at component top: `const { data, updateFoo, addFoo } = useCV()`
- Styling: Tailwind classes only, no CSS modules or styled-components

### Performance

- **memo()** all components to prevent unnecessary renders
- **useCallback()** all context methods (empty dependency array safe due to functional setState)
- **Debounced auto-save** already implemented (500ms localStorage, 3s cloud), don't add more debouncing

## File Organization

```
src/
├── app/
│   ├── globals.css                  # Tailwind base, CSS variables
│   ├── layout.tsx                   # Root layout with fonts, viewport meta
│   ├── page.tsx                     # Landing page (marketing)
│   ├── error.tsx                      # Global error boundary
│   ├── editor/
│   │   ├── page.tsx                   # CV editor (full provider stack)
│   │   └── error.tsx                  # Editor-specific error boundary
│   ├── cv/
│   │   └── [slug]/                  # Shared CV public view (SSR)
│   │       ├── page.tsx
│   │       ├── shared-cv-content.tsx
│   │       ├── loading.tsx
│   │       └── not-found.tsx
│   └── api/
│       ├── upload-photo/route.ts    # Photo upload to R2
│       ├── cv/
│       │   ├── route.ts              # CV load/save API
│       │   ├── plan/route.ts         # Plan fetch API
│       │   └── publish/route.ts      # CV publish/unpublish API
│       ├── auth/
│       │   └── [...nextauth]/route.ts # Auth.js route handler
│       └── stripe/
│           ├── checkout/route.ts    # Create Stripe session
│           └── webhook/route.ts     # Handle Stripe events
├── __tests__/                       # Unit tests (Vitest)
│   ├── cv-migrations.test.ts        # Migration functions (28 tests)
│   ├── render-rich-text.test.ts     # Rich text rendering (21 tests)
│   ├── fonts.test.ts                # Font definitions (10 tests)
│   ├── color-schemes.test.ts        # Color schemes (6 tests)
│   ├── default-data.test.ts         # Default data (6 tests)
│   ├── utils.test.ts                # Utility functions (3 tests)
│   ├── storage.test.ts              # localStorage operations (4 tests)
│   └── cv-sync.test.ts               # CV sync functions (36 tests)
├── lib/
│   ├── types.ts                     # All TypeScript interfaces
│   ├── cv-context.tsx               # CV state management (~32 methods)
│   ├── cv-migrations.ts             # Data migration functions (extracted from cv-context)
│   ├── default-data.ts              # Initial CV data
│   ├── storage.ts                   # localStorage load/save
│   ├── utils.ts                     # cn() utility + filenameDateStamp()
│   ├── generate-pdf.ts              # PDF blob generation + download
│   ├── pdf-document.tsx             # PDF render tree (@react-pdf/renderer)
│   ├── render-rich-text.tsx         # Rich text → React elements (web)
│   ├── render-rich-text-pdf.tsx     # Rich text → PDF elements
│   ├── fonts.ts                     # Font definitions and helpers
│   ├── font-context.tsx             # FontSettingsProvider
│   ├── color-schemes.ts             # 5 color scheme definitions
│   ├── color-scheme-context.tsx     # ColorSchemeProvider
│   ├── theme-context.tsx            # ThemeProvider (dark/light)
│   ├── locale-context.tsx           # LocaleProvider (i18n)
│   ├── sidebar-patterns.ts          # Sidebar pattern definitions
│   ├── sidebar-pattern-context.tsx  # SidebarPatternProvider
│   ├── auth-context.tsx             # AuthProvider (Auth.js v5 / next-auth)
│   ├── plan-context.tsx             # PlanProvider (free/premium)
│   ├── sync-status-context.tsx      # SyncStatusProvider
│   ├── cv-sync.ts                     # Shared pure functions (fingerprint, serialize, doc↔CVData)
│   ├── mongodb.ts                     # MongoDB connection helper
│   ├── mongoose.ts                    # Mongoose connection singleton
│   ├── auth.ts                        # Auth.js v5 configuration
│   ├── models/                        # Mongoose models
│   │   ├── cv.ts                      # CV document model
│   │   ├── user.ts                    # User model
│   │   └── index.ts                   # Model exports
│   ├── actions/                       # Server actions
│   │   ├── cv.ts                      # CV CRUD server actions
│   │   └── public.ts                  # Public CV fetch actions
│   ├── r2.ts                        # Cloudflare R2 S3Client
│   └── use-virtual-keyboard.ts      # Mobile virtual keyboard hook
├── middleware.ts                     # Root middleware (minimal, no auth checks)
└── components/
    ├── ui/                          # shadcn/ui components
    ├── toolbar/
    │   └── Toolbar.tsx              # Top toolbar (all controls)
    ├── landing/
    │   └── LandingNav.tsx           # Landing page navbar
    ├── auth/
    │   └── LoginDialog.tsx          # OAuth login dialog (Google/GitHub)
    ├── cloud-sync/
    │   └── CloudSync.tsx            # Invisible sync component
    ├── premium/
    │   ├── PremiumBadge.tsx         # PRO badge indicator
    │   └── UpgradeDialog.tsx        # Upgrade dialog (animated carousel)
    └── cv-editor/
        ├── CVEditor.tsx             # Wrapper
        ├── CVPreview.tsx            # Main editor (two columns)
        ├── EditableText.tsx         # Tiptap-powered inline edit component
        ├── FloatingToolbar.tsx      # Rich text toolbar (bold, italic, lists)
        ├── EntryGrip.tsx            # Drag handle + action popover
        ├── SectionTitle.tsx         # Section heading with separator
        ├── ProfilePhotoUpload.tsx   # Photo avatar with upload
        ├── PhotoCropDialog.tsx      # Image crop dialog (react-easy-crop)
        ├── MobileCVView.tsx         # Mobile-optimized CV view
        ├── Experience.tsx           # Work history section (drag-and-drop)
        ├── Education.tsx            # Education section (drag-and-drop)
        ├── Courses.tsx              # Courses section (optional, drag-and-drop)
        ├── Certifications.tsx       # Certifications section (optional, drag-and-drop)
        ├── Awards.tsx               # Awards section (optional, drag-and-drop)
        ├── PersonalInfo.tsx         # Left column (photo, contact, summary, skills)
        └── PrintableCV.tsx          # PDF generation trigger
e2e/
├── playwright.config.ts             # Playwright configuration
├── helpers/
│   ├── setup.ts                     # Fixtures, locators, interaction helpers
│   └── auth-mock.ts                  # Auth session mocking for E2E tests
└── tests/                           # 65 E2E tests across 17 files (35 @smoke + 30 @regression)
vitest.config.ts                     # Vitest configuration
commitlint.config.mjs                # Commitlint config (conventional commits)
.husky/
├── pre-commit                       # lint-staged (ESLint on staged files)
├── commit-msg                       # commitlint (conventional commits)
└── pre-push                         # Branch naming validation
docs/
└── design-system.md                 # Visual conventions reference
supabase/
└── migrations/                      # Legacy Supabase migration files (historical)
```

## Environment Variables

Required (see `env.local.example`):
```
# MongoDB
MONGODB_URI                          # MongoDB Atlas connection string

# Auth.js v5
AUTH_SECRET                          # Generate with: npx auth secret
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET

# Stripe
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID

# Site
NEXT_PUBLIC_SITE_URL

# Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

## Debugging Tips

**State issues:**
- Check CVContext methods are called (not direct state mutation)
- Verify useCallback dependencies (should be empty `[]`)
- Check localStorage in DevTools → Application → Local Storage

**Styling issues:**
- Verify Tailwind classes are valid for v4 (check docs)
- Check `@theme inline` syntax in globals.css
- Verify lucide-react icon imports

**PDF issues:**
- Check `pdf-document.tsx` matches CVPreview structure
- Verify `generate-pdf.ts` → `downloadPDF()` flow
- Photos must be JPEG/PNG (WebP re-encoded via canvas in `reencodeAsJpeg()`)
- Rich text: check both `render-rich-text.tsx` and `render-rich-text-pdf.tsx`

**Auth issues:**
- Check `src/lib/auth.ts` config (providers, adapter, session strategy)
- Verify `MONGODB_URI`, `AUTH_SECRET`, `AUTH_GOOGLE_*`, `AUTH_GITHUB_*` env vars are set
- Check browser cookies for `next-auth.session-token` (database session)
- Auth.js route handler: `/api/auth/*` — handles all OAuth flows automatically
- `src/middleware.ts` is minimal (no auth checks) — Auth.js manages its own cookies

**Sync issues:**
- CloudSync only runs when user is logged in
- Conflict dialog: check `cvContentFingerprint()` — uses `stableStringify()` to avoid false positives
- Base64 photos are stripped before cloud save (only R2 URLs persisted)
- Backup on conflict: check `localStorage["cv-builder-backup"]`

**Migration issues:**
- Check `migrateCVData()` in `src/lib/cv-migrations.ts`
- Verify backward compatibility when changing types.ts
- Unit tests cover all migration paths — run `npm run test:unit` after changes

## Critical Files for Features

When implementing new features, these files almost always need updates:

1. **src/lib/types.ts** — Add/modify data structures
2. **src/lib/cv-context.tsx** — Add CRUD methods
3. **src/lib/default-data.ts** — Add default values
4. **src/components/cv-editor/CVPreview.tsx** — Add to editor UI
5. **src/lib/pdf-document.tsx** — Add to PDF output
6. **src/lib/render-rich-text.tsx** + **render-rich-text-pdf.tsx** — If section uses rich text

## Key Libraries

| Library | Purpose |
|---|---|
| `@tiptap/react` + extensions | Rich text editing engine inside EditableText |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop reordering for all sections |
| `@react-pdf/renderer` | PDF generation |
| `@aws-sdk/client-s3` | Photo upload to Cloudflare R2 |
| `stripe` | Payment processing (server-side) |
| `sharp` | Image optimization (server-side, resize + WebP) |
| `react-easy-crop` | Circular photo cropping |
| `motion/react` | Animations (UpgradeDialog carousel) |
| `next-intl` | i18n (6 languages) |
| `next-themes` | Dark/light mode |
| `sonner` | Toast notifications |
| `lucide-react` | Icons (only icon library used) |
| `mongoose` | MongoDB ODM for data models |
| `next-auth` | Authentication (Auth.js v5, Google + GitHub OAuth) |
| `vitest` | Unit testing framework (114 tests) |
| `husky` | Git hooks manager (pre-commit, commit-msg, pre-push) |
| `@commitlint/cli` + `config-conventional` | Commit message linting (conventional commits) |
| `lint-staged` | Run ESLint on staged files only (pre-commit) |

## Testing Strategy

### Unit Tests (Vitest)

**114 tests** across 8 files in `src/__tests__/`. Run in ~2s.

| File | Tests | Covers |
|---|---|---|
| `cv-migrations.test.ts` | 28 | `moveItem`, `migrateSidebarOrder`, `migrateMarkdownBold`, `migrateBulletsToHtml`, `migrateCVData` |
| `render-rich-text.test.ts` | 21 | `renderRichText`, `renderRichDocument` (HTML → React nodes) |
| `fonts.test.ts` | 10 | `getFontDefinition`, `FONT_FAMILIES` integrity |
| `color-schemes.test.ts` | 6 | `getColorScheme`, `COLOR_SCHEMES` integrity |
| `default-data.test.ts` | 6 | `getDefaultCVData`, `defaultVisibility`, `DEFAULT_SIDEBAR_ORDER` |
| `utils.test.ts` | 3 | `filenameDateStamp` (with fake timers) |
| `storage.test.ts` | 4 | `saveCVData`/`loadCVData`/`clearCVData` round-trips |
| `cv-sync.test.ts` | 36 | `stableStringify`, `cvContentFingerprint`, `sortBySortOrder`, `docToCVData`, `cvDataToDoc`, `toSettings` |

**Config:** `vitest.config.ts` — jsdom environment, `@vitejs/plugin-react`, `@/` alias.

**Key refactor:** Migration functions were extracted from `cv-context.tsx` into `src/lib/cv-migrations.ts` for testability. `cv-context.tsx` imports them.

### E2E Tests (Playwright)

**65 tests** across 17 files, classified with tags:

**@smoke (35 tests)** — Critical flows. If any fails, the app is unusable:
- `smoke.test.ts` (2) — App loads, toolbar visible
- `inline-editing.test.ts` (4) — Core Tiptap editing
- `experience.test.ts` (4) — Experience CRUD
- `education.test.ts` (3) — Education CRUD
- `skills.test.ts` (5) — Skills CRUD (dblclick, deleteOnEmpty)
- `import-export.test.ts` (4) — JSON/PDF export, import
- `pdf.test.ts` (1) — PDF generation
- `block-editor.test.ts` (4) — Rich text formatting
- `cloud-sync.test.ts` (8) — Cloud sync, conflict dialog, photo upload

**@regression (30 tests)** — Important but non-critical:
- `visibility.test.ts` (4), `color-scheme.test.ts` (3), `font.test.ts` (3), `theme.test.ts` (2), `i18n.test.ts` (3), `optional-sections.test.ts` (12), `photo-sync.test.ts` (3), `import-backward-compat.test.ts` (1 - import from prior format)

### Git Workflow & Conventions

**Branch strategy:**
```
feature/* | fix/* | chore/* | refactor/* | docs/*  →  development  →  staging  →  main
hotfix/*  →  main (emergencies, skips dev/staging)
```

**Conventional commits** are enforced locally (commitlint) and in CI (pr-conventions.yml):
- Format: `<type>(<optional scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Examples: `feat: add dark mode`, `fix(auth): resolve redirect loop`, `ci: add E2E to staging`

**Branch naming** convention enforced by husky pre-push and pr-conventions.yml:
- `feature/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`, `hotfix/*`

**Husky git hooks** (local validation):
| Hook | Tool | What it validates |
|---|---|---|
| `pre-commit` | lint-staged | ESLint on staged `.ts`/`.tsx`/`.js`/`.jsx` files |
| `commit-msg` | commitlint | Conventional commits format |
| `pre-push` | custom script | Branch naming convention |

### CI Workflows

| Workflow | Trigger | What it runs | Concurrency |
|---|---|---|---|
| `quick-checks.yml` | `push` to feature branches | lint + typecheck | No |
| `development.yml` | `pull_request` → development | unit tests + build | Yes |
| `staging.yml` | `pull_request` → staging | validate source (only development) + build + E2E smoke (3 shards) | Yes |
| `hotfix.yml` | `pull_request` → main | gate (only hotfix/*) + lint + typecheck + unit tests + build | Yes |
| `main.yml` | `pull_request` → main | validate source (staging or hotfix/*) | No |
| `pr-conventions.yml` | any `pull_request` | validate branch name (PRs to dev) + PR title (conventional commits) | No |
| `release.yml` | `push` → main (paths: package.json) | validate semver > latest tag + create GitHub Release | No |
| `nightly.yml` | Cron 3:00 AM ARG (UTC-3) + manual | unit tests + full E2E (3 shards) | No |

## Documentation Maintenance

This project has 5 documentation surfaces that must stay in sync. Follow these rules to prevent drift.

### Documentation surfaces

| Surface | Location | What it covers | Updated by |
|---|---|---|---|
| **CLAUDE.md** | `CLAUDE.md` (repo root) | Architecture, patterns, file tree, commands | Claude (with user review) |
| **MEMORY.md** | `~/.claude/projects/.../memory/MEMORY.md` | Quick-reference facts, gotchas, user prefs | Claude (auto) |
| **README.md** | `README.md` (repo root) | Public-facing project description | User or Claude |
| **Notion docs** | Root page `30ae66e2-f906-81c1-9a44-f4f364803bbe` | Detailed onboarding docs (architecture, data model, components, etc.) | User (Claude flags) |
| **Notion backlog** | (user-managed) | Feature requests, bugs, tasks | User (Claude flags) |

### Post-commit checklist (automatic)

After every commit, evaluate which docs were affected. At the end of the commit message or session, output a **"Docs impact"** summary like this:

```
📄 Docs impact:
- CLAUDE.md: ✅ no update needed / ⚠️ needs update (reason)
- MEMORY.md: ✅ no update needed / ⚠️ needs update (reason)
- README.md: ✅ no update needed / ⚠️ needs update (reason)
- Notion docs: ✅ no update needed / ⚠️ needs update (page: Componentes — reason)
- Backlog: ✅ nothing to add / ⚠️ new item suggested (description)
```

**Rules:**
- If CLAUDE.md or MEMORY.md need updates, apply them immediately (don't just flag)
- If README.md needs updates, apply them immediately
- If Notion docs need updates, flag which page and what changed — the user will update manually
- If a backlog item should be created (follow-up task, tech debt found, etc.), suggest it — the user will add manually

### What triggers what

| Change type | CLAUDE.md | MEMORY.md | README.md | Notion | Backlog |
|---|---|---|---|---|---|
| New CV section | ✏️ file tree, data model, component arch | ✏️ data model | — | ⚠️ Modelo de Datos, Componentes | — |
| New/removed library | ✏️ key libraries table | — | — | ⚠️ Librerías | — |
| New context/provider | ✏️ provider nesting, file tree | ✏️ architecture facts | — | ⚠️ Arquitectura, State Management | — |
| New route/page | ✏️ routing table, file tree | — | — | ⚠️ Páginas y Routing | — |
| Auth/sync changes | ✏️ auth/sync sections | ✏️ architecture facts | — | ⚠️ Sharing y R2 | — |
| New env vars | ✏️ env vars section | — | — | — | — |
| i18n changes | ✏️ i18n section | ✏️ if language count changes | — | ⚠️ i18n | — |
| Bug fix / small tweak | — | — | — | — | — |
| UI redesign (no arch change) | — | — | — | — | — |
| Premium gating change | ✏️ premium section | ✏️ premium line | — | — | — |
| New component (no new section) | ✏️ file tree, component arch | — | — | ⚠️ Componentes (if significant) | — |
| Testing changes | ✏️ testing strategy section | ✏️ testing section | ✏️ testing section | ⚠️ Guía de Desarrollo | — |

### Periodic doc sync

When the user asks for a "doc sync" (or equivalent), perform a full audit:

1. **Scan the codebase** — list all files in `src/lib/`, `src/components/`, `src/app/`, compare against CLAUDE.md file tree
2. **Check provider nesting** — read `src/app/editor/page.tsx`, compare against CLAUDE.md
3. **Check data model** — read `src/lib/types.ts`, compare against CLAUDE.md
4. **Check libraries** — read `package.json` dependencies, compare against CLAUDE.md key libraries table
5. **Check routes** — list all files in `src/app/`, compare against CLAUDE.md routing table
6. **Report discrepancies** — list what's outdated and fix CLAUDE.md + MEMORY.md. Flag Notion pages that need manual updates.

### Notion documentation

Onboarding documentation in Notion (root page ID: `30ae66e2-f906-81c1-9a44-f4f364803bbe`).

**Page IDs for quick reference:**
- Overview: `30ae66e2-f906-813e-8f47-e1b754dbd3cc`
- Arquitectura: `30ae66e2-f906-815b-8e6c-e73ea1438d0c`
- Modelo de Datos: `30ae66e2-f906-81f0-989a-eaeb6918cad6`
- State Management: `30ae66e2-f906-81ea-bee9-ce2bd22f4ff9`
- Páginas y Routing: `30ae66e2-f906-81b0-b63e-c2376a9246ac`
- Componentes: `30ae66e2-f906-8120-ae2d-ec413e277c70`
- Estilos: `30ae66e2-f906-81f9-9a81-f02523ff085c`
- Librerías: `30ae66e2-f906-8123-8caa-cae03a063e08`
- i18n: `30ae66e2-f906-817c-9423-fb2fb25607c3`
- PDF: `30ae66e2-f906-8145-90d7-d09da50dd621`
- Sharing y R2: `30ae66e2-f906-8161-850d-ee90643a2e77`
- Guía de Desarrollo: `30ae66e2-f906-81da-80c0-de44f7deb5b1`

Do NOT auto-update Notion on every commit. Only flag it when the change would make the docs inaccurate.
