"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ThemeProvider } from "@/lib/theme-context";
import { LocaleProvider } from "@/lib/locale-context";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  MousePointerClick,
  Type,
  GripVertical,
  Palette,
  Smartphone,
  FileDown,
  Globe2,
  Moon,
  Zap,
  ArrowRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── Scroll-triggered reveal ───────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Hero CV mockup (browser-framed) ───────────────────────── */
function HeroCVMockup() {
  const t = useTranslations("landing");
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-gray-300/50 dark:shadow-black/40 transition-transform duration-500 group-hover:-translate-y-1">
      {/* Browser chrome */}
      <div className="h-9 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center px-3.5 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 flex justify-center">
          <div className="bg-white dark:bg-white/10 rounded-md px-4 py-1 text-[10px] text-gray-400 border border-gray-200 dark:border-white/10">
            applio.dev
          </div>
        </div>
      </div>

      {/* App content — stone bg like the real app, clipped by the "browser" */}
      <div className="bg-stone-100 text-gray-900 p-4 md:p-6 relative max-h-[360px] overflow-hidden">
        {/* Fade-out at the bottom — tall enough to clearly suggest more content */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-stone-100 to-transparent z-10 pointer-events-none" />

        {/* Mini toolbar hint */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-bold tracking-tight text-gray-400 font-display">Applio</span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1.5">
            <div className="w-5 h-5 rounded bg-gray-200/80" />
            <div className="w-5 h-5 rounded bg-gray-200/80" />
            <div className="w-5 h-5 rounded bg-gray-200/80" />
          </div>
        </div>

        {/* CV sheet — full height, the browser clips it */}
        <div className="bg-white rounded-md shadow-lg mx-auto max-w-[80%]">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-[30%] bg-[#dfe4ec] p-4 md:p-6 space-y-5 text-[10px] leading-snug rounded-l-md">
              <div className="w-16 h-16 rounded-full bg-[#94a3b8]/20 mx-auto grid place-items-center">
                <span className="text-lg font-medium text-[#94a3b8]">JD</span>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#1e293b] mb-2">
                  {t("mockup.contact")}
                </div>
                <div className="h-px bg-[#c4cad5] mb-3" />
                <div className="space-y-2.5 text-[#1e293b]">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-2.5 h-2.5 shrink-0" /> john.doe@email.com
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-2.5 h-2.5 shrink-0" /> +1 (555) 123-4567
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-2.5 h-2.5 shrink-0" /> New York, NY
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#1e293b] mb-2">
                  {t("mockup.skills")}
                </div>
                <div className="h-px bg-[#c4cad5] mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Next.js", "Node.js", "Python"].map((s) => (
                    <span
                      key={s}
                      className="bg-[#384152] text-white text-[9px] rounded px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 md:p-7 space-y-5 text-[10px] leading-snug">
              <div>
                <div className="text-[18px] md:text-[20px] font-semibold text-gray-900 leading-tight">
                  John Doe
                </div>
                <div className="w-8 h-0.5 bg-[#94a3b8] rounded-full mt-1.5" />
                <div className="text-[10px] md:text-[11px] font-medium uppercase tracking-wide text-gray-500 mt-1">
                  Sr. Software Engineer
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#1e293b] mb-2">
                  {t("mockup.experience")}
                </div>
                <div className="h-px bg-[#cbd5e1] mb-3" />
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Acme Corp
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        Mar 2021 — {t("mockup.present")}
                      </span>
                    </div>
                    <div className="font-medium uppercase tracking-wide text-gray-500 text-[10px] mt-0.5">
                      Senior Software Engineer
                    </div>
                    <ul className="mt-1.5 space-y-1 pl-3.5 list-disc marker:text-[#334155]">
                      <li>Led digital onboarding system development</li>
                      <li>Migrated monolith to microservices</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">
                        Tech Solutions Inc.
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        Sep 2019 — Feb 2021
                      </span>
                    </div>
                    <div className="font-medium uppercase tracking-wide text-gray-500 text-[10px] mt-0.5">
                      Frontend Developer
                    </div>
                    <ul className="mt-1.5 space-y-1 pl-3.5 list-disc marker:text-[#334155]">
                      <li>Built enterprise UIs with React & TypeScript</li>
                      <li>Implemented shared design system</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Education — partially visible, cut by fade to suggest more content */}
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#1e293b] mb-2">
                  {t("mockup.education")}
                </div>
                <div className="h-px bg-[#cbd5e1] mb-3" />
                <div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      UC Berkeley
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      2015 — 2019
                    </span>
                  </div>
                  <div className="font-medium uppercase tracking-wide text-gray-500 text-[10px] mt-0.5">
                    B.S. Computer Science
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Interactive rich text demo ─────────────────────────────── */
function InteractiveRichTextMockup() {
  const t = useTranslations("landing");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [listType, setListType] = useState<"bullet" | "numbered">("bullet");
  const [interacted, setInteracted] = useState(false);

  const act = (fn: () => void) => {
    fn();
    setInteracted(true);
  };

  const ListTag = listType === "bullet" ? "ul" : "ol";
  const listClass =
    listType === "bullet"
      ? "list-disc marker:text-gray-300 dark:marker:text-gray-600"
      : "list-decimal marker:text-gray-400 dark:marker:text-gray-500";

  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Interactive toolbar */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0.5 bg-gray-900 rounded-lg px-2 py-1.5 shadow-xl">
          {(
            [
              { icon: Bold, active: bold, onClick: () => act(() => setBold((b) => !b)) },
              { icon: Italic, active: italic, onClick: () => act(() => setItalic((b) => !b)) },
            ] as const
          ).map(({ icon: Icon, active, onClick }, i) => (
            <button
              key={i}
              onClick={onClick}
              className={`w-7 h-7 rounded-md grid place-items-center transition-colors cursor-pointer ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-white/20 mx-1" />
          {(
            [
              { icon: List, type: "bullet" as const },
              { icon: ListOrdered, type: "numbered" as const },
            ] as const
          ).map(({ icon: Icon, type }) => (
            <button
              key={type}
              onClick={() => act(() => setListType(type))}
              className={`w-7 h-7 rounded-md grid place-items-center transition-colors cursor-pointer ${
                listType === type
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Formatted text */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm text-sm leading-relaxed select-none">
        <ListTag className={`space-y-1.5 pl-4 ${listClass} transition-all`}>
          <li className="text-gray-700 dark:text-gray-300">
            {t("demo.richTextBullet1")}{" "}
            <strong className="text-gray-900 dark:text-white">
              {t("demo.richTextBullet1Bold")}
            </strong>
          </li>
          <li className="text-gray-700 dark:text-gray-300">
            <span
              className={`bg-blue-100 dark:bg-blue-500/20 rounded px-0.5 transition-all duration-200 ${
                bold ? "font-bold" : ""
              } ${italic ? "italic" : ""}`}
            >
              {t("demo.richTextBullet2")}
            </span>
          </li>
          <li className="text-gray-700 dark:text-gray-300">
            {t("demo.richTextBullet3")}
          </li>
        </ListTag>
      </div>

      {/* Hint */}
      <div
        className={`px-3 py-2 rounded-lg text-xs text-center transition-all duration-500 ${
          interacted
            ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400"
            : "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
        }`}
      >
        {interacted
          ? t("demo.richTextHintAfter")
          : t("demo.richTextHintBefore")}
      </div>
    </div>
  );
}

/* ── Sortable drag item ─────────────────────────────────────── */
function SortableDragItem({
  id,
  title,
  subtitle,
  isDraggingAny,
}: {
  id: string;
  title: string;
  subtitle: string;
  isDraggingAny: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-white/5 p-4 transition-shadow duration-200 ${
        isDragging
          ? "border-gray-300 dark:border-white/20 shadow-lg"
          : "border-gray-200 dark:border-white/10 shadow-sm"
      }`}
    >
      <button
        className={`cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors ${
          isDraggingAny ? "" : "hover:scale-110"
        }`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div>
        <div className="font-medium text-gray-900 dark:text-white text-sm">
          {title}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-xs">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* ── Interactive drag & drop demo ──────────────────────────── */
function InteractiveDragMockup() {
  const t = useTranslations("landing");
  const [items, setItems] = useState([
    { id: "a", title: "Acme Corp", subtitle: "Senior Software Engineer" },
    { id: "b", title: "Tech Solutions Inc.", subtitle: "Frontend Developer" },
    { id: "c", title: "Digital Agency", subtitle: "Junior Developer" },
  ]);
  const [moveCount, setMoveCount] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setMoveCount((c) => c + 1);
    }
  }, []);

  return (
    <div className="w-full max-w-sm space-y-2 select-none">
      <DndContext
        id="landing-drag-demo"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setDraggingId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableDragItem
              key={item.id}
              isDraggingAny={draggingId !== null}
              {...item}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div
        className={`px-3 py-2 rounded-lg text-xs text-center transition-all duration-500 ${
          moveCount > 0
            ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400"
            : "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
        }`}
      >
        {moveCount > 0
          ? t("demo.dragHintAfter")
          : t("demo.dragHintBefore")}
      </div>
    </div>
  );
}

/* ── Inline editable field (real interactive demo) ─────────── */
function InlineField({
  value,
  onChange,
  className = "",
  showCursor = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  showCursor?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim()) onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft.trim()) onChange(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`${className} outline-none bg-blue-50 dark:bg-blue-500/10 rounded px-1.5 py-0.5 -mx-1.5 ring-2 ring-blue-300 dark:ring-blue-500/40 w-full`}
      />
    );
  }

  return (
    <div
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`${className} cursor-text rounded px-1.5 py-0.5 -mx-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors`}
    >
      {value}
      {showCursor && <span className="landing-cursor ml-0.5" />}
    </div>
  );
}

/* ── Interactive edit demo ─────────────────────────────────── */
function InteractiveEditMockup() {
  const t = useTranslations("landing");
  const [fields, setFields] = useState({
    title: "Senior Software Engineer",
    company: "Acme Corp",
    dates: "Mar 2021 — Present",
  });
  const [editCount, setEditCount] = useState(0);

  const updateField = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setEditCount((c) => c + 1);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm space-y-3">
        <InlineField
          value={fields.title}
          onChange={(v) => updateField("title", v)}
          className="text-xl font-semibold text-gray-900 dark:text-white"
          showCursor={editCount === 0}
        />
        <div className="h-px bg-gray-100 dark:bg-white/10" />
        <div className="space-y-1.5">
          <InlineField
            value={fields.company}
            onChange={(v) => updateField("company", v)}
            className="text-sm text-gray-500 dark:text-gray-400"
          />
          <InlineField
            value={fields.dates}
            onChange={(v) => updateField("dates", v)}
            className="text-xs text-gray-400 dark:text-gray-500"
          />
        </div>
        <div
          className={`mt-3 px-3 py-2 rounded-lg text-xs transition-all duration-500 ${
            editCount > 0
              ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400"
              : "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
          }`}
        >
          {editCount > 0
            ? t("demo.editHintAfter")
            : t("demo.editHintBefore")}
        </div>
      </div>
    </div>
  );
}

/* ── Interactive color scheme demo ──────────────────────────── */
const COLOR_DEMO = [
  { swatch: "#64748b", sidebar: "#dfe4ec", text: "#1e293b", badge: "#384152", accent: "#94a3b8", separator: "#c4cad5" },
  { swatch: "#1e90ff", sidebar: "#1a7ed6", text: "#ffffff", badge: "#ffffff33", accent: "#1e90ff", separator: "#ffffff33" },
  { swatch: "#2ecc71", sidebar: "#27ae60", text: "#ffffff", badge: "#ffffff33", accent: "#2ecc71", separator: "#ffffff33" },
  { swatch: "#e67e22", sidebar: "#d35400", text: "#ffffff", badge: "#ffffff33", accent: "#e67e22", separator: "#ffffff33" },
  { swatch: "#34495e", sidebar: "#2c3e50", text: "#ffffff", badge: "#ffffff33", accent: "#34495e", separator: "#ffffff33" },
];

function InteractiveColorMockup() {
  const [active, setActive] = useState(0);
  const c = COLOR_DEMO[active];

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm select-none">
        {/* Mini CV */}
        <div className="flex h-50">
          <div
            className="w-[38%] p-4 transition-colors duration-500"
            style={{ backgroundColor: c.sidebar }}
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `${c.text}20` }} />
              <div className="h-1.5 w-16 rounded" style={{ backgroundColor: `${c.text}30` }} />
              <div className="h-px" style={{ backgroundColor: c.separator }} />
              <div className="h-1 w-12 rounded" style={{ backgroundColor: `${c.text}25` }} />
              <div className="h-1 w-14 rounded" style={{ backgroundColor: `${c.text}25` }} />
              <div className="mt-3 space-y-1">
                <div className="h-1.5 w-10 rounded" style={{ backgroundColor: `${c.text}30` }} />
                <div className="flex flex-wrap gap-1 mt-1">
                  <div className="h-3.5 w-9 rounded" style={{ backgroundColor: c.badge }} />
                  <div className="h-3.5 w-11 rounded" style={{ backgroundColor: c.badge }} />
                  <div className="h-3.5 w-8 rounded" style={{ backgroundColor: c.badge }} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 bg-white">
            <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
            <div className="h-1 w-8 rounded mb-3 transition-colors duration-500" style={{ backgroundColor: c.accent }} />
            <div className="h-1.5 w-14 rounded mb-2 transition-colors duration-500" style={{ backgroundColor: `${c.accent}40` }} />
            <div className="h-px bg-gray-100 mb-2" />
            <div className="space-y-2.5">
              <div>
                <div className="h-1.5 w-20 bg-gray-200 rounded" />
                <div className="h-1 w-16 bg-gray-100 rounded mt-1" />
              </div>
              <div>
                <div className="h-1.5 w-18 bg-gray-200 rounded" />
                <div className="h-1 w-14 bg-gray-100 rounded mt-1" />
              </div>
            </div>
          </div>
        </div>
        {/* Interactive swatches */}
        <div className="flex justify-center gap-2.5 p-3 border-t border-gray-100 dark:border-white/10">
          {COLOR_DEMO.map((scheme, i) => (
            <button
              key={scheme.swatch}
              onClick={() => setActive(i)}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                i === active
                  ? "border-gray-900 dark:border-white scale-110 shadow-md"
                  : "border-white shadow-sm hover:scale-105"
              }`}
              style={{ backgroundColor: scheme.swatch }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Feature step (alternating layout) ─────────────────────── */
function FeatureStep({
  number,
  icon: Icon,
  title,
  description,
  children,
  reverse = false,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children?: ReactNode;
  reverse?: boolean;
}) {
  return (
    <Reveal>
      <div
        className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 items-center`}
      >
        <div className="flex-1 max-w-lg">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold grid place-items-center">
              {number}
            </span>
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-display text-3xl md:text-[2.5rem] font-bold leading-tight tracking-tight text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            {description}
          </p>
        </div>
        {children && (
          <div className="flex-1 flex justify-center">{children}</div>
        )}
      </div>
    </Reveal>
  );
}

/* ── Phone mockup — pixel-accurate to real Applio mobile ───── */
function PhoneMockup() {
  const t = useTranslations("landing");
  /* Base font = 15px on mobile in real app; we scale to ~11px for mockup */
  return (
    <div className="relative">
      <div className="relative w-[310px] h-[620px] rounded-[3rem] border-[8px] border-gray-900 dark:border-gray-700 bg-white overflow-hidden shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-gray-900 dark:bg-gray-700 rounded-full z-10" />

        {/* Screen — fixed height, content clips naturally like a real phone */}
        <div className="pt-12 pb-8 text-[11px] leading-[1.45] font-sans h-full overflow-hidden text-gray-900">

          {/* ── Mobile header: photo + name centered ── */}
          <div className="flex flex-col items-center px-8 pt-2 pb-1">
            <div className="w-[100px] h-[100px] rounded-full grid place-items-center mb-4" style={{ backgroundColor: "#94a3b818" }}>
              <span className="text-[28px] font-medium tracking-wide" style={{ color: "#94a3b890" }}>JD</span>
            </div>
            <div className="text-[26px] font-semibold tracking-tight text-gray-900 leading-tight">
              John Doe
            </div>
            <div className="w-14 h-0.5 bg-[#94a3b8] rounded-full mt-2" />
            <div className="text-[14px] font-medium uppercase tracking-wide text-gray-500 mt-1.5">
              Sr. Software Engineer
            </div>
          </div>

          {/* ── Sidebar block — full-width ── */}
          <div className="mt-5" style={{ backgroundColor: "#dfe4ec", padding: "28px 32px" }}>
            <div className="space-y-6">
              {/* Contact */}
              <div>
                <div className="mb-2">
                  <div className="font-semibold uppercase tracking-[0.15em] text-[#1e293b]" style={{ fontSize: "0.9em" }}>
                    {t("mockup.contact")}
                  </div>
                  <div className="h-px bg-[#c4cad5] mt-2" />
                </div>
                <div className="space-y-2 text-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span>john.doe@email.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>New York, NY</span>
                  </div>
                </div>
              </div>

              {/* About */}
              <div>
                <div className="mb-2">
                  <div className="font-semibold uppercase tracking-[0.15em] text-[#1e293b]" style={{ fontSize: "0.9em" }}>
                    {t("mockup.aboutMe")}
                  </div>
                  <div className="h-px bg-[#c4cad5] mt-2" />
                </div>
                <p className="text-[#1e293b] leading-relaxed">
                  Software engineer with 5+ years of experience building scalable web applications.
                </p>
              </div>

              {/* Skills */}
              <div>
                <div className="mb-2">
                  <div className="font-semibold uppercase tracking-[0.15em] text-[#1e293b]" style={{ fontSize: "0.9em" }}>
                    {t("mockup.skills")}
                  </div>
                  <div className="h-px bg-[#c4cad5] mt-2" />
                </div>
                <div className="font-semibold uppercase tracking-wide text-[#1e293b] mb-1.5" style={{ fontSize: "0.9em" }}>
                  Frontend
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Next.js"].map((s) => (
                    <span key={s} className="bg-[#384152] text-white rounded px-2.5 py-0.5" style={{ fontSize: "0.9em" }}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="font-semibold uppercase tracking-wide text-[#1e293b] mt-3 mb-1.5" style={{ fontSize: "0.9em" }}>
                  Backend
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Node.js", "Python", "PostgreSQL"].map((s) => (
                    <span key={s} className="bg-[#384152] text-white rounded px-2.5 py-0.5" style={{ fontSize: "0.9em" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Main content — experience ── */}
          <div style={{ padding: "24px 32px 0" }}>
            <div className="mb-2">
              <div className="font-semibold uppercase tracking-[0.15em] text-[#1e293b]" style={{ fontSize: "0.9em" }}>
                {t("mockup.experience")}
              </div>
              <div className="h-px bg-[#cbd5e1] mt-2" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900" style={{ fontSize: "1.17em" }}>Acme Corp</span>
                  <span className="text-gray-400 shrink-0 ml-2" style={{ fontSize: "0.9em" }}>2021 — {t("mockup.present")}</span>
                </div>
                <div className="font-medium uppercase tracking-wide text-gray-500" style={{ fontSize: "0.9em" }}>
                  Senior Software Engineer
                </div>
                <ul className="mt-1.5 space-y-1 pl-3.5 list-disc marker:text-[#334155]">
                  <li>Led digital onboarding system</li>
                  <li>Migrated to microservices</li>
                </ul>
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900" style={{ fontSize: "1.17em" }}>Tech Solutions</span>
                  <span className="text-gray-400 shrink-0 ml-2" style={{ fontSize: "0.9em" }}>2019 — 2021</span>
                </div>
                <div className="font-medium uppercase tracking-wide text-gray-500" style={{ fontSize: "0.9em" }}>
                  Frontend Developer
                </div>
                <ul className="mt-1.5 space-y-1 pl-3.5 list-disc marker:text-[#334155]">
                  <li>Built enterprise UIs</li>
                  <li>Implemented design system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Fade-out — content continues below */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-gray-900 rounded-full z-10" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main landing page
   ═══════════════════════════════════════════════════════════════ */
function LandingPageContent() {
  const t = useTranslations("landing");

  return (
    <div className="bg-white dark:bg-background text-gray-900 dark:text-white font-sans overflow-x-hidden">
      {/* Keyframe animations */}
      <style>{`
        @keyframes landing-blink {
          0%, 50% { opacity: 1 }
          51%, 100% { opacity: 0 }
        }
        .landing-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #3b82f6;
          animation: landing-blink 1s step-end infinite;
          vertical-align: text-bottom;
        }
      `}</style>

      {/* ── Navigation ─────────────────────────────────────── */}
      <LandingNav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 sm:pt-28 md:pt-32 pb-16">
        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Soft glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-100/25 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <Reveal>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center leading-[1.08] tracking-tight font-bold">
              {t("hero.titleLine1")}
              <br />
              <span className="text-gray-400 dark:text-gray-500">
                {t("hero.titleLine2")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 text-center max-w-2xl mt-6 leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </Reveal>

          <Reveal delay={0.24} className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-full px-8 py-3.5 text-base hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg transition-all"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-full px-8 py-3.5 text-base hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
            >
              {t("hero.ctaSecondary")}
            </a>
          </Reveal>

          <Reveal delay={0.4} className="mt-12 md:mt-16 w-full max-w-[850px]">
            <Link href="/" className="block group">
              {/* Desktop: browser mockup */}
              <div className="hidden md:block">
                <HeroCVMockup />
              </div>
              {/* Mobile: phone mockup, scaled down */}
              <div className="md:hidden flex justify-center">
                <div
                  className="origin-top scale-[0.8] sm:scale-[0.9]"
                  style={{ marginBottom: -93 }}
                >
                  <PhoneMockup />
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 mt-4 group-hover:text-gray-500 transition-colors">
                {t("hero.mockupHint")}
              </p>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Feature tour ───────────────────────────────────── */}
      <section
        id="features"
        className="py-24 md:py-32 px-6 bg-gray-50/60 dark:bg-white/[0.02]"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {t("features.sectionTitle")}
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                {t("features.sectionSubtitle")}
              </p>
            </div>
          </Reveal>

          <div className="space-y-24 md:space-y-32">
            {/* 1 · Click to edit — INTERACTIVE DEMO */}
            <FeatureStep
              number="1"
              icon={MousePointerClick}
              title={t("features.step1Title")}
              description={t("features.step1Desc")}
            >
              <InteractiveEditMockup />
            </FeatureStep>

            {/* 2 · Rich text */}
            <FeatureStep
              number="2"
              icon={Type}
              title={t("features.step2Title")}
              description={t("features.step2Desc")}
              reverse
            >
              <InteractiveRichTextMockup />
            </FeatureStep>

            {/* 3 · Drag & drop */}
            <FeatureStep
              number="3"
              icon={GripVertical}
              title={t("features.step3Title")}
              description={t("features.step3Desc")}
            >
              <InteractiveDragMockup />
            </FeatureStep>

            {/* 4 · Color schemes */}
            <FeatureStep
              number="4"
              icon={Palette}
              title={t("features.step4Title")}
              description={t("features.step4Desc")}
              reverse
            >
              <InteractiveColorMockup />
            </FeatureStep>
          </div>
        </div>
      </section>

      {/* ── Mobile showcase ────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <Reveal className="flex-1">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 mb-5">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    {t("mobile.badge")}
                  </span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  {t("mobile.title")}
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                  {t("mobile.desc1")}
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t("mobile.desc2")}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15} className="shrink-0 hidden lg:block">
              <PhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Quick features grid ────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-gray-50/60 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-center mb-16">
              {t("grid.title")}
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(
              [
                { icon: FileDown, titleKey: "grid.pdfTitle" as const, descKey: "grid.pdfDesc" as const },
                { icon: Globe2, titleKey: "grid.langTitle" as const, descKey: "grid.langDesc" as const },
                { icon: Moon, titleKey: "grid.darkTitle" as const, descKey: "grid.darkDesc" as const },
                { icon: Zap, titleKey: "grid.saveTitle" as const, descKey: "grid.saveDesc" as const },
              ]
            ).map(({ icon: Icon, titleKey, descKey }) => (
              <Reveal key={titleKey}>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 hover:shadow-md dark:hover:shadow-white/[0.02] transition-shadow h-full">
                  <Icon className="w-6 h-6 text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-gray-900 dark:bg-white/[0.04] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("cta.titleLine1")}
              <br />
              {t("cta.titleLine2")}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium rounded-full px-10 py-4 text-lg hover:bg-gray-100 transition-colors"
            >
              {t("cta.button")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <span className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Applio
            </span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Applio.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Provider wrapper (export default) ─────────────────────── */
export default function LandingPage() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <LandingPageContent />
      </LocaleProvider>
    </ThemeProvider>
  );
}
