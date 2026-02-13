# Applio

A free, no-login CV builder with a clean Notion-style design. Build your resume directly in the browser — no accounts, no servers, your data stays on your device.

## Features

- **Inline editing** — Click any text to edit it, just like Notion
- **PDF export** — One-click download as a properly formatted A4 PDF
- **7 color schemes** — From minimal ivory to bold blue, green, red, and more
- **9 languages** — English, Spanish, French, Portuguese, German, Italian, Chinese, Japanese, Korean
- **Dark mode** — Light, dark, or system-detected theme
- **Photo upload** — Add a profile photo with built-in cropping
- **Import/Export JSON** — Save your CV data and restore it anytime
- **Font size & margin control** — Fine-tune the PDF density
- **Section toggles** — Show/hide contact fields and optional sections (courses, certifications, awards)
- **Mobile friendly** — Responsive toolbar with hamburger menu on small screens
- **Overflow detection** — Warns you if your content exceeds one A4 page

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (New York style) |
| Icons | [Lucide React](https://lucide.dev/) |
| i18n | [next-intl](https://next-intl.dev/) |
| PDF | [react-to-print](https://github.com/MatthewHerb662/react-to-print) |
| Photo crop | [react-easy-crop](https://github.com/ValentinH/react-easy-crop) |
| Deploy | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)

### Installation

```bash
git clone <repo-url>
cd applio
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page hot-reloads as you edit.

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── globals.css            # Tailwind config & CSS variables
│   ├── layout.tsx             # Root layout with fonts
│   └── page.tsx               # Entry point (provider nesting)
├── lib/
│   ├── types.ts               # TypeScript interfaces (CVData, etc.)
│   ├── cv-context.tsx         # Central state management (React Context)
│   ├── default-data.ts        # Initial sample CV data (EN & ES)
│   ├── storage.ts             # localStorage read/write
│   ├── locale-context.tsx     # Language detection & switching
│   ├── theme-context.tsx      # Light/dark/system theme
│   ├── color-scheme-context.tsx  # CV color palette
│   ├── font-size-context.tsx  # PDF font size levels
│   ├── margin-context.tsx     # PDF margin levels
│   ├── color-schemes.ts       # 7 color scheme definitions
│   └── utils.ts               # shadcn cn() utility
├── messages/
│   ├── en.json                # English translations
│   ├── es.json                # Spanish translations
│   └── ...                    # 7 more languages
├── hooks/
│   └── useOverflowDetection.ts  # Detects when CV exceeds A4
└── components/
    ├── ui/                    # shadcn/ui primitives (button, popover, etc.)
    ├── toolbar/
    │   └── Toolbar.tsx        # Top bar: language, theme, import/export, PDF
    └── cv-editor/
        ├── CVEditor.tsx       # Editor wrapper
        ├── CVPreview.tsx      # Main interactive editor (two-column layout)
        ├── PrintableCV.tsx    # Static PDF render tree
        ├── EditableText.tsx   # Click-to-edit text component
        ├── PersonalInfo.tsx   # Left column: photo, contact, summary, skills
        ├── Experience.tsx     # Work history section
        ├── Education.tsx      # Education section
        ├── Courses.tsx        # Optional courses section
        ├── Certifications.tsx # Optional certifications section
        ├── Awards.tsx         # Optional awards section
        ├── SectionTitle.tsx   # Reusable section heading
        ├── ProfilePhotoUpload.tsx  # Photo upload button
        └── PhotoCropDialog.tsx     # Photo crop modal
```

## Architecture Overview

```
page.tsx
└── ThemeProvider
    └── ColorSchemeProvider
        └── FontSizeProvider
            └── MarginProvider
                └── LocaleProvider (next-intl)
                    └── CVProvider (central state)
                        └── AppContent
                            ├── Toolbar
                            ├── CVEditor → CVPreview (interactive)
                            └── PrintableCV (hidden, for PDF)
```

**Key concepts:**

- **All state lives in CVContext** — Components read/write via `useCV()` hook. No prop drilling.
- **Dual render trees** — `CVPreview` is the interactive editor (with buttons, hover states). `PrintableCV` is a static clone optimized for PDF. Both must render the same data.
- **100% client-side** — No API calls. Data persists in `localStorage` with auto-save (500ms debounce).
- **Inline editing** — The `EditableText` component handles click-to-edit everywhere: names, dates, descriptions, skills.

## Deployment

The project is configured for Vercel:

```bash
vercel
```

Or push to a GitHub repo connected to Vercel for automatic deploys.

## License

Private project.
