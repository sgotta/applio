# Applio

A CV builder with Notion-style inline editing. Click any text to edit it, drag to reorder sections, and download a polished PDF — all from the browser.

## Features

### Editor
- **Inline editing** — Click any field to edit. Rich text support (bold, italic, lists) powered by Tiptap
- **Drag & drop** — Reorder experience, education, skills, and sidebar sections with @dnd-kit
- **Photo upload** — Profile photo with built-in crop and zoom (react-easy-crop)
- **Overflow detection** — Visual warning when content exceeds one A4 page

### CV Sections
- Personal info (name, title, email, phone, location, LinkedIn, website)
- Professional summary
- Skills (grouped by category)
- Work experience (with rich text descriptions)
- Education
- Courses & workshops *(premium)*
- Certifications *(premium)*
- Awards & honors *(premium)*

### Customization
- **5 color schemes** — Default, Clear Child, Emerald, Carrot, Wet Asphalt
- **4 fonts** — Inter, Lato, Source Sans 3, Merriweather
- **3 font sizes** — Small, Medium, Large
- **Sidebar patterns** — Dot pattern with intensity and scope controls *(premium)*
- **Dark mode** — Light or dark theme
- **Section visibility** — Toggle contact fields and optional sections on/off

### Output
- **PDF export** — Client-side generation via @react-pdf/renderer with embedded fonts
- **JSON import/export** — Save and restore CV data + settings
- **Shareable link** — Publish your CV at `applio.dev/cv/{slug}` with public PDF download *(requires login)*

### Accounts & Sync
- **OAuth login** — Google and GitHub via Auth.js v5 (optional — the editor works without login)
- **Cloud sync** — Auto-sync CV data and settings across sessions when logged in (MongoDB). Conflict resolution dialog when local and cloud data differ.
- **Premium plan** — One-time payment via Stripe unlocks additional color schemes, fonts, sections, patterns, and removes PDF branding
- **Error handling** — Toast notifications for sync errors, visual sync indicator in toolbar (4 states), global error boundaries

### i18n
6 languages: English, Español, Français, Deutsch, Italiano, Português. Auto-detected from browser on first visit.

### Mobile
Responsive layout with a single-column view, hamburger menu, scroll-aware toolbar, and long-press drag.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/) + [shadcn/ui](https://ui.shadcn.com/) (New York) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Rich text | [Tiptap](https://tiptap.dev/) |
| Drag & drop | [@dnd-kit](https://dndkit.com/) |
| PDF | [@react-pdf/renderer](https://react-pdf.org/) |
| i18n | [next-intl](https://next-intl.dev/) |
| Auth | [Auth.js v5](https://authjs.dev/) (NextAuth) |
| Database | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) |
| Payments | [Stripe](https://stripe.com/) |
| Storage | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (photos) |
| Animations | [Motion](https://motion.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Deploy | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone <repo-url>
cd applio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page hot-reloads as you edit.

### Other Commands

```bash
npm run build              # Production build (includes type-check)
npm run lint               # ESLint
npm run test:unit          # Vitest unit tests (114 tests, ~2s)
npm run test:e2e           # Playwright E2E tests (headless, 54 tests)
npm run test:e2e:headed    # Playwright with visible browser
```

### Environment Variables

For full functionality (auth, sync, sharing, payments), you need:

- `MONGODB_URI` — MongoDB connection string
- `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — Auth.js v5
- `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` — Stripe
- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` / `CLOUDFLARE_R2_BUCKET_NAME` / `CLOUDFLARE_R2_PUBLIC_URL` — Cloudflare R2

The editor works fully offline (localStorage only) without any of these.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── editor/page.tsx          # CV editor
│   ├── cv/[slug]/page.tsx       # Public shared CV view
│   ├── checkout/success/        # Post-payment redirect
│   └── api/
│       ├── auth/[...nextauth]/  # Auth.js route handlers
│       ├── cv/                  # CV CRUD, publish, plan
│       ├── upload-photo/        # Photo upload to R2
│       └── stripe/              # Checkout + webhook
├── lib/
│   ├── types.ts                 # Data model (CVData, etc.)
│   ├── cv-context.tsx           # Central state (React Context + useCV hook)
│   ├── cv-sync.ts               # MongoDB↔CVData mapping, fingerprinting
│   ├── auth.ts                  # Auth.js v5 config (NextAuth)
│   ├── mongodb.ts               # MongoClient for Auth.js adapter
│   ├── mongoose.ts              # Mongoose connection for API routes
│   ├── models/cv.ts             # Mongoose CV model (normalized schema)
│   ├── models/user.ts           # Mongoose User model (with subscription)
│   ├── default-data.ts          # Sample CV data
│   ├── color-schemes.ts         # Color scheme definitions
│   └── ...                      # Storage, utils, context providers
├── messages/                    # i18n translations (en, es, fr, de, it, pt)
└── components/
    ├── ui/                      # shadcn/ui primitives
    ├── toolbar/                 # Toolbar (desktop header + mobile menu)
    └── cv-editor/               # Editor components
        ├── CVPreview.tsx        # Interactive two-column editor
        ├── EditableText.tsx     # Inline edit primitive (Tiptap-based)
        ├── FloatingToolbar.tsx  # Rich text formatting bar
        ├── Experience.tsx       # Work history section
        ├── Education.tsx        # Education section
        ├── PersonalInfo.tsx     # Sidebar (photo, contact, summary, skills)
        ├── Courses.tsx          # Optional: courses
        ├── Certifications.tsx   # Optional: certifications
        ├── Awards.tsx           # Optional: awards
        └── ...                  # Photo crop, section titles, etc.
e2e/                             # 54 Playwright E2E tests (27 @smoke + 27 @regression)
vitest.config.ts                 # Vitest configuration
```

## Testing

### Unit Tests (Vitest)

114 tests covering data migrations, rich text rendering, MongoDB↔CVData mapping, fingerprinting, font/color scheme lookups, default data, utilities, and localStorage operations.

```bash
npm run test:unit          # Run once
npm run test:unit:watch    # Watch mode
```

### E2E Tests (Playwright)

54 tests across 14 files, tagged as `@smoke` (critical) or `@regression` (nice-to-have):

```bash
npm run test:e2e                                                          # All tests
npx playwright test --config e2e/playwright.config.ts --grep @smoke       # Smoke only
npx playwright test --config e2e/playwright.config.ts --grep @regression  # Regression only
```

### CI

- **PRs to staging** run unit tests + smoke E2E (3 shards)
- **Nightly** (3:00 AM Argentina) runs unit tests + all E2E (3 shards)

## Deployment

Configured for Vercel:

```bash
vercel
```

Or connect a GitHub repo for automatic deploys on push.

## License

Private project.
