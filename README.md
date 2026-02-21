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
- **OAuth login** — Google and GitHub via Supabase Auth (optional — the editor works without login)
- **Cloud sync** — Auto-sync CV data across sessions when logged in (Supabase)
- **Premium plan** — One-time payment via Stripe unlocks additional color schemes, fonts, sections, patterns, and removes PDF branding

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
| Auth & DB | [Supabase](https://supabase.com/) |
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
npm run test:e2e           # Playwright E2E tests (headless)
npm run test:e2e:headed    # Playwright with visible browser
```

### Environment Variables

For full functionality (auth, sync, sharing, payments), you need:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` — Stripe
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_ENDPOINT` / `R2_PUBLIC_URL` — Cloudflare R2

The editor works fully offline (localStorage only) without any of these.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── editor/page.tsx          # CV editor
│   ├── cv/[slug]/page.tsx       # Public shared CV view
│   ├── checkout/success/        # Post-payment redirect
│   ├── auth/callback/           # OAuth callback
│   └── api/                     # Stripe webhooks, photo upload
├── lib/
│   ├── types.ts                 # Data model (CVData, etc.)
│   ├── cv-context.tsx           # Central state (React Context + useCV hook)
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
e2e/                             # 54 Playwright tests across 14 files
```

## Deployment

Configured for Vercel:

```bash
vercel
```

Or connect a GitHub repo for automatic deploys on push.

## License

Private project.
