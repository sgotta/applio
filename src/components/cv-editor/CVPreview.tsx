"use client";

import { useCallback } from "react";
import { useCV } from "@/lib/cv-context";
import { useTranslations } from "next-intl";
import { useColorScheme } from "@/lib/color-scheme-context";
import { useFontSettings } from "@/lib/font-context";
import { getFontDefinition, FONT_SIZE_LEVELS } from "@/lib/fonts";
import { useAppLocale } from "@/lib/locale-context";

import { Heart, Mail, Phone, MapPin, Linkedin, Globe, GripVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EditableText } from "./EditableText";
import { PersonalInfo, ContactLine, SortableSkillCategory } from "./PersonalInfo";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Experience } from "./Experience";
import { Education } from "./Education";
import { Courses } from "./Courses";
import { Certifications } from "./Certifications";
import { Awards } from "./Awards";
import { Languages } from "./Languages";
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SidebarSectionId } from "@/lib/types";

function CVHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();

  return (
    <div className="mb-4">
      <EditableText
        value={personalInfo.fullName}
        onChange={(v) => updatePersonalInfo("fullName", v)}
        as="heading"
        placeholder={t("fullNamePlaceholder")}
      />
      {colorScheme.nameAccent !== "transparent" && (
        <div
          className="mt-1 h-0.5 w-12 rounded-full"
          style={{ backgroundColor: colorScheme.nameAccent }}
        />
      )}
      <div className="mt-0.5">
        <EditableText
          value={personalInfo.jobTitle}
          onChange={(v) => updatePersonalInfo("jobTitle", v)}
          as="subheading"
          placeholder={t("titlePlaceholder")}
        />
      </div>
    </div>
  );
}

function MobileHeader() {
  const {
    data: { personalInfo },
    updatePersonalInfo,
  } = useCV();
  const { colorScheme } = useColorScheme();

  return (
    <div className="flex flex-col items-center px-6 pt-6">
      <ProfilePhotoUpload
        currentPhoto={personalInfo.photoUrl}
        fullName={personalInfo.fullName}
        onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
        placeholderBg={`${colorScheme.nameAccent}18`}
        placeholderText={`${colorScheme.nameAccent}90`}
      />
      <CVHeader />
    </div>
  );
}

function ClassicTemplate() {
  const { data: { visibility, personalInfo } } = useCV();
  const t = useTranslations("cvPreview");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  return (
    <>
      {/* CV Content — two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] md:flex-1">
        {/* ===== MOBILE HEADER: photo + name centered (mobile only) ===== */}
        <div className="order-1 md:hidden">
          <MobileHeader />
        </div>

        {/* ===== LEFT COLUMN — sidebar ===== */}
        <div
          data-testid="cv-sidebar"
          className={`order-2 md:order-0 md:col-start-1 md:row-start-1 relative${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: mg(24) }}
        >
          <div className="relative space-y-5">
            <PersonalInfo />
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="order-3 md:order-0 md:col-start-2 md:row-start-1 relative">
          <div className="relative">
            {/* Desktop header */}
            <div data-testid="desktop-header" className="hidden md:block" style={{ padding: `${mg(24)}px ${mg(24)}px 0` }}>
              <CVHeader />
            </div>
            {/* Content */}
            <div style={{ padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px` }}>
              <div className="space-y-5">
                <Experience />
                <Education />
                {visibility.courses && <Courses />}
                {visibility.certifications && <Certifications />}
                {visibility.awards && <Awards />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER — single row spanning both columns ===== */}
      <div className="hidden md:grid grid-cols-[250px_1fr] mt-auto">
        {/* Left: Applio branding on sidebar */}
        <div
          className={`flex items-center justify-center${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{ backgroundColor: colorScheme.sidebarBg, padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          <a
            href="https://www.applio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: colorScheme.sidebarMuted }}
          >
            Applio
            <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
          </a>
        </div>
        {/* Right: Name · Date · Page */}
        <div
          className="flex items-center justify-end text-xs text-[#aaaaaa]"
          style={{ padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

// Thin category-level DnD wrapper for skills in NoPhoto template.
// Uses the shared SortableSkillCategory component with noPhoto variant.
function NoPhotoSkillsWrapper() {
  const { data: { skillCategories }, reorderSkillCategory, addSkillCategory } = useCV();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = skillCategories.findIndex((s) => s.id === active.id);
      const newIndex = skillCategories.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) reorderSkillCategory(oldIndex, newIndex);
    }
  }, [skillCategories, reorderSkillCategory]);

  return (
    <DndContext
      id="nophoto-skills-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={skillCategories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {skillCategories.map((cat, i) => (
            <SortableSkillCategory
              key={cat.id}
              skillGroup={cat}
              index={i}
              total={skillCategories.length}
              noPhoto
              onAddBelow={() => addSkillCategory(i)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Thin DnD section wrapper for NoPhoto — enables drag-to-reorder of Languages/Skills blocks
function SortableNoPhotoSection({ id, children }: { id: "skills" | "languages"; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : undefined, zIndex: isDragging ? 10 : undefined }}
      className="group/np-section relative"
    >
      {/* Grab handle — appears in the left padding, vertically centered with the section title text */}
      <div className="absolute right-full -top-1.5 can-hover:-top-1 pr-1 opacity-40 can-hover:opacity-0 can-hover:group-hover/np-section:opacity-60 transition-opacity duration-150">
        <button
          className="p-1.5 can-hover:p-1 rounded transition-colors hover:bg-gray-100 touch-manipulation cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      {children}
    </div>
  );
}

function NoPhotoTemplate() {
  const { data: { visibility, personalInfo, skillCategories, languages, summary, sidebarSections }, updatePersonalInfo, updateSummary, reorderSidebarSection } = useCV();
  const t = useTranslations("cvPreview");
  const tpi = useTranslations("personalInfo");
  const tLang = useTranslations("cvLanguages");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  const hasContact = personalInfo.email || personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  // Flex sections: Languages + Skills ordered by sidebarSections (same source of truth as Classic sidebar)
  const flexSectionOrder = sidebarSections.filter(
    (s): s is "skills" | "languages" => s === "skills" || s === "languages"
  );
  const visibleFlexSections = flexSectionOrder.filter(s =>
    (s === "languages" && visibility.languages && languages.length > 0) ||
    (s === "skills" && skillCategories.length > 0)
  );

  const sectionSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromGlobal = sidebarSections.indexOf(active.id as SidebarSectionId);
      const toGlobal = sidebarSections.indexOf(over.id as SidebarSectionId);
      if (fromGlobal !== -1 && toGlobal !== -1) reorderSidebarSection(fromGlobal, toGlobal);
    }
  }, [sidebarSections, reorderSidebarSection]);

  // Section title helper: left accent bar + label + optional separator line
  const sectionTitle = (label: string, showLine = true) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colorScheme.heading }} />
      <h3 className="text-xs sm:text-[10px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
        {label}
      </h3>
      {showLine && <div className="flex-1 h-px" style={{ backgroundColor: `${colorScheme.heading}18` }} />}
    </div>
  );

  return (
    <>
      {/* ===== TOP ACCENT BAR — premium signature ===== */}
      <div style={{ height: 3, backgroundColor: colorScheme.heading }} />

      {/* ===== HEADER ===== */}
      <div className="px-9.5 sm:px-12.75" style={{ paddingTop: `${mg(28)}px`, paddingBottom: `${mg(5)}px` }}>
        {/* Name */}
        <EditableText
          value={personalInfo.fullName}
          onChange={(v) => updatePersonalInfo("fullName", v)}
          as="heading"
          placeholder={t("fullNamePlaceholder")}
        />
        {/* Accent underline — wider for more presence */}
        {colorScheme.nameAccent !== "transparent" && (
          <div className="mt-1.5 h-0.5 w-14 rounded-full" style={{ backgroundColor: colorScheme.nameAccent }} />
        )}
        {/* Role — uses heading color at 75% so name→role→icons form one accent family */}
        <div className="mt-2.5">
          <EditableText
            value={personalInfo.jobTitle}
            onChange={(v) => updatePersonalInfo("jobTitle", v)}
            as="subheading"
            placeholder={t("titlePlaceholder")}
            displayStyle={{ color: `${colorScheme.heading}BF` }}
          />
        </div>

        {/* Contact row — icon-anchored items, no separators, proper breathing room */}
        {hasContact && (
          <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1.5">
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <Mail className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.email} onChange={(v) => updatePersonalInfo("email", v)} as="small" placeholder="email" />
              </span>
            )}
            {personalInfo.phone && (
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <Phone className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.phone} onChange={(v) => updatePersonalInfo("phone", v)} as="small" placeholder="phone" />
              </span>
            )}
            {(visibility.location && personalInfo.location) && (
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.location} onChange={(v) => updatePersonalInfo("location", v)} as="small" placeholder="location" />
              </span>
            )}
            {(visibility.linkedin && personalInfo.linkedin) && (
              <ContactLine
                variant="noPhoto"
                icon={Linkedin}
                value={personalInfo.linkedin}
                field="linkedin"
                placeholder={tpi("linkedinPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.heading}
                urlField="linkedinUrl"
                urlValue={personalInfo.linkedinUrl}
                urlPlaceholder={tpi("urlPlaceholder")}
              />
            )}
            {(visibility.website && personalInfo.website) && (
              <ContactLine
                variant="noPhoto"
                icon={Globe}
                value={personalInfo.website}
                field="website"
                placeholder={tpi("websitePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.heading}
                urlField="websiteUrl"
                urlValue={personalInfo.websiteUrl}
                urlPlaceholder={tpi("urlPlaceholder")}
              />
            )}
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 px-9.5 sm:px-12.75" style={{ paddingTop: `${mg(10)}px`, paddingBottom: `${mg(28)}px` }}>
        <div className="space-y-6">

          {/* Summary */}
          {visibility.summary && summary && (
            <section
              className="rounded-xl px-4 py-3.5"
              style={{
                backgroundColor: `${colorScheme.heading}0F`,
                border: `1px solid ${colorScheme.heading}1A`,
              }}
            >
              {sectionTitle(tpi("aboutMe"), false)}
              <EditableText
                value={summary}
                onChange={updateSummary}
                as="body"
                multiline
                richText
                placeholder={tpi("summaryPlaceholder")}
              />
            </section>
          )}

          <Experience />
          <Education />
          {visibility.courses && <Courses />}
          {visibility.certifications && <Certifications />}
          {visibility.awards && <Awards />}
          {/* Languages + Skills — ordered by sidebarSections, drag-to-reorder */}
          {visibleFlexSections.length > 0 && (
            <DndContext
              id="nophoto-section-order-dnd"
              sensors={sectionSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext items={visibleFlexSections} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {visibleFlexSections.map(sectionId => {
                    if (sectionId === "languages") {
                      return (
                        <SortableNoPhotoSection key="languages" id="languages">
                          <section>
                            {sectionTitle(tLang("title"))}
                            <Languages noPhoto />
                          </section>
                        </SortableNoPhotoSection>
                      );
                    }
                    return (
                      <SortableNoPhotoSection key="skills" id="skills">
                        <section>
                          {sectionTitle(tpi("skills"))}
                          <NoPhotoSkillsWrapper />
                        </section>
                      </SortableNoPhotoSection>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        className="hidden md:flex items-center justify-between text-xs text-[#aaaaaa] mt-auto"
        style={{ padding: `${mg(8)}px ${mg(32)}px ${mg(12)}px` }}
      >
        <a
          href="https://www.applio.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "#bbbbbb" }}
        >
          Applio
          <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
        </a>
        <span>
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>
    </>
  );
}

function ExecutiveTemplate() {
  const { data: { visibility, personalInfo, skillCategories, languages, summary, sidebarSections }, updatePersonalInfo, updateSummary, reorderSidebarSection } = useCV();
  const t = useTranslations("cvPreview");
  const tpi = useTranslations("personalInfo");
  const tLang = useTranslations("cvLanguages");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  const hasContact = personalInfo.email || personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  const flexSectionOrder = sidebarSections.filter(
    (s): s is "skills" | "languages" => s === "skills" || s === "languages"
  );
  const visibleFlexSections = flexSectionOrder.filter(s =>
    (s === "languages" && visibility.languages && languages.length > 0) ||
    (s === "skills" && skillCategories.length > 0)
  );

  const sectionSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromGlobal = sidebarSections.indexOf(active.id as SidebarSectionId);
      const toGlobal = sidebarSections.indexOf(over.id as SidebarSectionId);
      if (fromGlobal !== -1 && toGlobal !== -1) reorderSidebarSection(fromGlobal, toGlobal);
    }
  }, [sidebarSections, reorderSidebarSection]);

  // Section title with diamond ornaments
  const execSectionTitle = (label: string) => (
    <div className="flex items-center gap-2.5 mb-4 mt-2">
      <div className="flex-1 h-px" style={{ backgroundColor: colorScheme.separator }} />
      <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colorScheme.heading }} />
      <h3 className="text-[10px] font-bold tracking-[0.22em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
        {label}
      </h3>
      <div className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: colorScheme.heading }} />
      <div className="flex-1 h-px" style={{ backgroundColor: colorScheme.separator }} />
    </div>
  );

  return (
    <>
      {/* ===== TOP ACCENT BAR (thick, premium) ===== */}
      <div style={{ height: 6, backgroundColor: colorScheme.heading }} />

      {/* ===== HEADER — centered with photo ===== */}
      <div className="px-9.5 sm:px-12.75 text-center" style={{ paddingTop: `${mg(20)}px`, paddingBottom: `${mg(6)}px` }}>

        {/* Photo circle with accent ring */}
        <div className="flex justify-center mb-4">
          <ProfilePhotoUpload
            currentPhoto={personalInfo.photoUrl}
            fullName={personalInfo.fullName}
            onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
            placeholderBg={`${colorScheme.heading}12`}
            placeholderText={colorScheme.heading}
          />
        </div>

        <div className="flex justify-center">
          <EditableText
            value={personalInfo.fullName}
            onChange={(v) => updatePersonalInfo("fullName", v)}
            as="heading"
            placeholder={t("fullNamePlaceholder")}
            displayStyle={{ color: colorScheme.heading, textAlign: "center", letterSpacing: "0.03em" }}
          />
        </div>
        {colorScheme.nameAccent !== "transparent" && (
          <div className="mx-auto mt-2.5" style={{ height: 3, width: 48, borderRadius: 2, backgroundColor: colorScheme.nameAccent }} />
        )}
        <div className="mt-2 flex justify-center">
          <EditableText
            value={personalInfo.jobTitle}
            onChange={(v) => updatePersonalInfo("jobTitle", v)}
            as="subheading"
            placeholder={t("titlePlaceholder")}
            displayStyle={{ color: `${colorScheme.heading}BF`, textAlign: "center" }}
          />
        </div>

        {/* Contact bar — full width tinted band */}
        {hasContact && (
          <div
            className="mt-5 -mx-9.5 sm:-mx-12.75 py-2.5 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-x-5 gap-y-1.5"
            style={{ backgroundColor: `${colorScheme.heading}0A` }}
          >
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                <Mail className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.email} onChange={(v) => updatePersonalInfo("email", v)} as="small" placeholder="email" />
              </span>
            )}
            {personalInfo.phone && (
              <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                <Phone className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.phone} onChange={(v) => updatePersonalInfo("phone", v)} as="small" placeholder="phone" />
              </span>
            )}
            {(visibility.location && personalInfo.location) && (
              <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                <MapPin className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                <EditableText value={personalInfo.location} onChange={(v) => updatePersonalInfo("location", v)} as="small" placeholder="location" />
              </span>
            )}
            {(visibility.linkedin && personalInfo.linkedin) && (
              <ContactLine
                variant="noPhoto"
                icon={Linkedin}
                value={personalInfo.linkedin}
                field="linkedin"
                placeholder={tpi("linkedinPlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.heading}
                urlField="linkedinUrl"
                urlValue={personalInfo.linkedinUrl}
                urlPlaceholder={tpi("urlPlaceholder")}
              />
            )}
            {(visibility.website && personalInfo.website) && (
              <ContactLine
                variant="noPhoto"
                icon={Globe}
                value={personalInfo.website}
                field="website"
                placeholder={tpi("websitePlaceholder")}
                onChange={(f, v) => updatePersonalInfo(f, v)}
                iconColor={colorScheme.heading}
                urlField="websiteUrl"
                urlValue={personalInfo.websiteUrl}
                urlPlaceholder={tpi("urlPlaceholder")}
              />
            )}
          </div>
        )}
      </div>

      {/* Double rule separator */}
      <div className="mx-9.5 sm:mx-12.75 flex flex-col gap-0.75">
        <div className="h-px" style={{ backgroundColor: colorScheme.separator }} />
        <div className="h-px" style={{ backgroundColor: colorScheme.separator }} />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 px-9.5 sm:px-12.75" style={{ paddingTop: `${mg(12)}px`, paddingBottom: `${mg(28)}px` }}>
        <div className="space-y-6">
          {/* Summary — plain paragraph, no card */}
          {visibility.summary && summary && (
            <section>
              {execSectionTitle(tpi("aboutMe"))}
              <EditableText
                value={summary}
                onChange={updateSummary}
                as="body"
                multiline
                richText
                placeholder={tpi("summaryPlaceholder")}
              />
            </section>
          )}

          <Experience />
          <Education />
          {visibility.courses && <Courses />}
          {visibility.certifications && <Certifications />}
          {visibility.awards && <Awards />}

          {/* Languages + Skills — same reorderable pattern */}
          {visibleFlexSections.length > 0 && (
            <DndContext
              id="executive-section-order-dnd"
              sensors={sectionSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext items={visibleFlexSections} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {visibleFlexSections.map(sectionId => {
                    if (sectionId === "languages") {
                      return (
                        <SortableNoPhotoSection key="languages" id="languages">
                          <section>
                            {execSectionTitle(tLang("title"))}
                            <Languages noPhoto />
                          </section>
                        </SortableNoPhotoSection>
                      );
                    }
                    return (
                      <SortableNoPhotoSection key="skills" id="skills">
                        <section>
                          {execSectionTitle(tpi("skills"))}
                          <NoPhotoSkillsWrapper />
                        </section>
                      </SortableNoPhotoSection>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        className="hidden md:flex items-center justify-between text-xs text-[#aaaaaa] mt-auto"
        style={{ padding: `${mg(8)}px ${mg(32)}px ${mg(12)}px` }}
      >
        <a
          href="https://www.applio.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "#bbbbbb" }}
        >
          Applio
          <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
        </a>
        <span>
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>
    </>
  );
}

function ModernTemplate() {
  const { data: { visibility, personalInfo, skillCategories, languages, summary }, updatePersonalInfo, updateSummary, addSkillCategory, reorderSkillCategory } = useCV();
  const t = useTranslations("cvPreview");
  const tpi = useTranslations("personalInfo");
  const tLang = useTranslations("cvLanguages");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  const hasContact = personalInfo.email || personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  // DnD for skill categories
  const skillSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleSkillDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = skillCategories.findIndex((s) => s.id === active.id);
      const newIndex = skillCategories.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) reorderSkillCategory(oldIndex, newIndex);
    }
  }, [skillCategories, reorderSkillCategory]);

  // Sidebar section title: white accent bar on dark bg
  const sidebarSectionTitle = (label: string) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-3 shrink-0" style={{ height: 2, backgroundColor: colorScheme.nameAccent }} />
      <h3 className="text-xs sm:text-[10px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: "#ffffff" }}>
        {label}
      </h3>
    </div>
  );

  return (
    <>
      {/* ===== TOP ACCENT STRIP — nameAccent ===== */}
      <div style={{ height: 4, backgroundColor: colorScheme.nameAccent }} />

      {/* ===== HEADER — full-width, left-aligned ===== */}
      <div style={{ padding: `${mg(24)}px ${mg(24)}px ${mg(8)}px` }}>
        <EditableText
          value={personalInfo.fullName}
          onChange={(v) => updatePersonalInfo("fullName", v)}
          as="heading"
          placeholder={t("fullNamePlaceholder")}
          displayStyle={{ color: colorScheme.heading }}
        />
        {colorScheme.nameAccent !== "transparent" && (
          <div className="mt-1.5 h-0.5 w-14 rounded-full" style={{ backgroundColor: colorScheme.nameAccent }} />
        )}
        <div className="mt-2">
          <EditableText
            value={personalInfo.jobTitle}
            onChange={(v) => updatePersonalInfo("jobTitle", v)}
            as="subheading"
            placeholder={t("titlePlaceholder")}
            displayStyle={{ color: `${colorScheme.heading}BF` }}
          />
        </div>
      </div>

      {/* ===== TWO COLUMNS — main left + sidebar right (SOLID heading color) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] md:flex-1">

        {/* ===== MAIN CONTENT (left) ===== */}
        <div className="order-2 md:order-0" style={{ padding: `${mg(10)}px ${mg(24)}px ${mg(24)}px` }}>
          <div className="space-y-5">
            <Experience />
            <Education />
            {visibility.courses && <Courses />}
            {visibility.certifications && <Certifications />}
            {visibility.awards && <Awards />}
          </div>
        </div>

        {/* ===== SIDEBAR (right) — SOLID heading color bg, white text ===== */}
        <div
          className={`order-1 md:order-0${colorScheme.sidebarText === "#ffffff" ? " cv-sidebar-dark" : ""}`}
          style={{
            backgroundColor: colorScheme.heading,
            padding: `${mg(16)}px ${mg(24)}px ${mg(24)}px`,
            color: "#ffffff",
          }}
        >
          <div className="space-y-5">
            {/* Photo — circular with white ring */}
            <div className="flex justify-center">
              <ProfilePhotoUpload
                currentPhoto={personalInfo.photoUrl}
                fullName={personalInfo.fullName}
                onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
                placeholderBg={`${colorScheme.nameAccent}30`}
                placeholderText="rgba(255,255,255,0.85)"
              />
            </div>

            {/* Contact */}
            {hasContact && (
              <div>
                {sidebarSectionTitle(tpi("contact"))}
                <div className="space-y-1.5">
                  {personalInfo.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <EditableText value={personalInfo.email} onChange={(v) => updatePersonalInfo("email", v)} as="small" placeholder="email" displayStyle={{ color: "rgba(255,255,255,0.85)" }} />
                    </span>
                  )}
                  {personalInfo.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <EditableText value={personalInfo.phone} onChange={(v) => updatePersonalInfo("phone", v)} as="small" placeholder="phone" displayStyle={{ color: "rgba(255,255,255,0.85)" }} />
                    </span>
                  )}
                  {(visibility.location && personalInfo.location) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: "#ffffff" }} />
                      <EditableText value={personalInfo.location} onChange={(v) => updatePersonalInfo("location", v)} as="small" placeholder="location" displayStyle={{ color: "rgba(255,255,255,0.85)" }} />
                    </span>
                  )}
                  {(visibility.linkedin && personalInfo.linkedin) && (
                    <ContactLine
                      icon={Linkedin}
                      value={personalInfo.linkedin}
                      field="linkedin"
                      placeholder={tpi("linkedinPlaceholder")}
                      onChange={(f, v) => updatePersonalInfo(f, v)}
                      iconColor="#ffffff"
                      urlField="linkedinUrl"
                      urlValue={personalInfo.linkedinUrl}
                      urlPlaceholder={tpi("urlPlaceholder")}
                    />
                  )}
                  {(visibility.website && personalInfo.website) && (
                    <ContactLine
                      icon={Globe}
                      value={personalInfo.website}
                      field="website"
                      placeholder={tpi("websitePlaceholder")}
                      onChange={(f, v) => updatePersonalInfo(f, v)}
                      iconColor="#ffffff"
                      urlField="websiteUrl"
                      urlValue={personalInfo.websiteUrl}
                      urlPlaceholder={tpi("urlPlaceholder")}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {visibility.summary && summary && (
              <div>
                {sidebarSectionTitle(tpi("aboutMe"))}
                <EditableText
                  value={summary}
                  onChange={updateSummary}
                  as="body"
                  multiline
                  richText
                  placeholder={tpi("summaryPlaceholder")}
                  displayStyle={{ color: "rgba(255,255,255,0.85)" }}
                />
              </div>
            )}

            {/* Skills */}
            {skillCategories.length > 0 && (
              <div>
                {sidebarSectionTitle(tpi("skills"))}
                <DndContext
                  id="modern-skills-dnd"
                  sensors={skillSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSkillDragEnd}
                >
                  <SortableContext items={skillCategories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {skillCategories.map((cat, i) => (
                        <SortableSkillCategory
                          key={cat.id}
                          skillGroup={cat}
                          index={i}
                          total={skillCategories.length}
                          onAddBelow={() => addSkillCategory(i)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Languages */}
            {visibility.languages && languages.length > 0 && (
              <div>
                {sidebarSectionTitle(tLang("title"))}
                <Languages sidebar />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="hidden md:grid grid-cols-[1fr_250px] mt-auto">
        {/* Left: Name · Date · Page */}
        <div
          className="flex items-center justify-end text-xs text-[#aaaaaa]"
          style={{ padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Right: Applio branding on sidebar */}
        <div
          className="flex items-center justify-center"
          style={{ backgroundColor: colorScheme.heading, padding: `${mg(8)}px ${mg(24)}px ${mg(12)}px` }}
        >
          <a
            href="https://www.applio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Applio
            <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
          </a>
        </div>
      </div>
    </>
  );
}

function TimelineTemplate() {
  const { data: { visibility, personalInfo, skillCategories, languages, summary, sidebarSections }, updatePersonalInfo, updateSummary, reorderSidebarSection } = useCV();
  const t = useTranslations("cvPreview");
  const tpi = useTranslations("personalInfo");
  const tLang = useTranslations("cvLanguages");
  const { colorScheme } = useColorScheme();
  const { locale } = useAppLocale();
  const mg = (px: number) => Math.round(px * 1.6);

  const hasContact = personalInfo.email || personalInfo.phone ||
    (visibility.location && personalInfo.location) ||
    (visibility.linkedin && personalInfo.linkedin) ||
    (visibility.website && personalInfo.website);

  const flexSectionOrder = sidebarSections.filter(
    (s): s is "skills" | "languages" => s === "skills" || s === "languages"
  );
  const visibleFlexSections = flexSectionOrder.filter(s =>
    (s === "languages" && visibility.languages && languages.length > 0) ||
    (s === "skills" && skillCategories.length > 0)
  );

  const sectionSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromGlobal = sidebarSections.indexOf(active.id as SidebarSectionId);
      const toGlobal = sidebarSections.indexOf(over.id as SidebarSectionId);
      if (fromGlobal !== -1 && toGlobal !== -1) reorderSidebarSection(fromGlobal, toGlobal);
    }
  }, [sidebarSections, reorderSidebarSection]);

  // Timeline line color (25% of heading — bold enough to be visible)
  const lineColor = `${colorScheme.heading}40`;

  // Section title for non-timeline bottom sections (skills, languages) — same as noPhoto
  const bottomSectionTitle = (label: string) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colorScheme.heading }} />
      <h3 className="text-xs sm:text-[10px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: colorScheme.heading }}>
        {label}
      </h3>
      <div className="flex-1 h-px" style={{ backgroundColor: `${colorScheme.heading}18` }} />
    </div>
  );

  return (
    <>
      {/* ===== HEADER with photo ===== */}
      <div className="px-9.5 sm:px-12.75 flex gap-5 items-start" style={{ paddingTop: `${mg(24)}px`, paddingBottom: `${mg(5)}px` }}>
        {/* Photo — circular with accent ring */}
        <div className="shrink-0 hidden sm:block">
          <ProfilePhotoUpload
            currentPhoto={personalInfo.photoUrl}
            fullName={personalInfo.fullName}
            onPhotoChange={(photoUrl) => updatePersonalInfo("photoUrl", photoUrl)}
            placeholderBg={`${colorScheme.heading}12`}
            placeholderText={colorScheme.heading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <EditableText
            value={personalInfo.fullName}
            onChange={(v) => updatePersonalInfo("fullName", v)}
            as="heading"
            placeholder={t("fullNamePlaceholder")}
            displayStyle={{ color: colorScheme.heading }}
          />
          {colorScheme.nameAccent !== "transparent" && (
            <div className="mt-1.5 h-0.5 w-14 rounded-full" style={{ backgroundColor: colorScheme.nameAccent }} />
          )}
          <div className="mt-2">
            <EditableText
              value={personalInfo.jobTitle}
              onChange={(v) => updatePersonalInfo("jobTitle", v)}
              as="subheading"
              placeholder={t("titlePlaceholder")}
              displayStyle={{ color: `${colorScheme.heading}BF` }}
            />
          </div>

          {/* Contact row */}
          {hasContact && (
            <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1.5">
              {personalInfo.email && (
                <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                  <Mail className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                  <EditableText value={personalInfo.email} onChange={(v) => updatePersonalInfo("email", v)} as="small" placeholder="email" />
                </span>
              )}
              {personalInfo.phone && (
                <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                  <Phone className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                  <EditableText value={personalInfo.phone} onChange={(v) => updatePersonalInfo("phone", v)} as="small" placeholder="phone" />
                </span>
              )}
              {(visibility.location && personalInfo.location) && (
                <span className="inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                  <MapPin className="h-3 w-3 shrink-0" style={{ color: colorScheme.heading }} />
                  <EditableText value={personalInfo.location} onChange={(v) => updatePersonalInfo("location", v)} as="small" placeholder="location" />
                </span>
              )}
              {(visibility.linkedin && personalInfo.linkedin) && (
                <ContactLine
                  variant="noPhoto"
                  icon={Linkedin}
                  value={personalInfo.linkedin}
                  field="linkedin"
                  placeholder={tpi("linkedinPlaceholder")}
                  onChange={(f, v) => updatePersonalInfo(f, v)}
                  iconColor={colorScheme.heading}
                  urlField="linkedinUrl"
                  urlValue={personalInfo.linkedinUrl}
                  urlPlaceholder={tpi("urlPlaceholder")}
                />
              )}
              {(visibility.website && personalInfo.website) && (
                <ContactLine
                  variant="noPhoto"
                  icon={Globe}
                  value={personalInfo.website}
                  field="website"
                  placeholder={tpi("websitePlaceholder")}
                  onChange={(f, v) => updatePersonalInfo(f, v)}
                  iconColor={colorScheme.heading}
                  urlField="websiteUrl"
                  urlValue={personalInfo.websiteUrl}
                  urlPlaceholder={tpi("urlPlaceholder")}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN CONTENT WITH TIMELINE ===== */}
      <div className="flex-1 px-9.5 sm:px-12.75" style={{ paddingTop: `${mg(10)}px`, paddingBottom: `${mg(28)}px` }}>
        {/* Summary — card with accent left border (outside timeline) */}
        {visibility.summary && summary && (
          <section className="mb-6">
            {bottomSectionTitle(tpi("aboutMe"))}
            <div
              className="rounded-lg"
              style={{
                backgroundColor: `${colorScheme.heading}08`,
                borderLeft: `3px solid ${colorScheme.heading}`,
                padding: "12px 16px",
              }}
            >
              <EditableText
                value={summary}
                onChange={updateSummary}
                as="body"
                multiline
                richText
                placeholder={tpi("summaryPlaceholder")}
              />
            </div>
          </section>
        )}

        {/* Timeline sections — 3px bold vertical line */}
        <div className="ml-6 sm:ml-6 pl-6 sm:pl-6" style={{ borderLeft: `3px solid ${lineColor}` }}>
          <div className="space-y-6">
            <Experience />
            <Education />
            {visibility.courses && <Courses />}
            {visibility.certifications && <Certifications />}
            {visibility.awards && <Awards />}
          </div>
        </div>

        {/* Languages + Skills — no timeline, at the bottom */}
        {visibleFlexSections.length > 0 && (
          <div className="mt-6">
            <DndContext
              id="timeline-section-order-dnd"
              sensors={sectionSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext items={visibleFlexSections} strategy={verticalListSortingStrategy}>
                <div className="space-y-6">
                  {visibleFlexSections.map(sectionId => {
                    if (sectionId === "languages") {
                      return (
                        <SortableNoPhotoSection key="languages" id="languages">
                          <section>
                            {bottomSectionTitle(tLang("title"))}
                            <Languages noPhoto />
                          </section>
                        </SortableNoPhotoSection>
                      );
                    }
                    return (
                      <SortableNoPhotoSection key="skills" id="skills">
                        <section>
                          {bottomSectionTitle(tpi("skills"))}
                          <NoPhotoSkillsWrapper />
                        </section>
                      </SortableNoPhotoSection>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div
        className="hidden md:flex items-center justify-between text-xs text-[#aaaaaa] mt-auto"
        style={{ padding: `${mg(8)}px ${mg(32)}px ${mg(12)}px` }}
      >
        <a
          href="https://www.applio.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "#bbbbbb" }}
        >
          Applio
          <Heart className="h-3 w-3 fill-current" strokeWidth={0} />
        </a>
        <span>
          {personalInfo.fullName}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dashed border-[#cccccc]">1 / 1</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-center">
              {t("paginationHint")}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>
    </>
  );
}

function renderTemplate(templateId: string | undefined) {
  switch (templateId) {
    case "executive": return <ExecutiveTemplate />;
    case "modern": return <ModernTemplate />;
    case "timeline": return <TimelineTemplate />;
    case "noPhoto": return <NoPhotoTemplate />;
    default: return <ClassicTemplate />;
  }
}

export function CVPreview() {
  const { data: { templateId } } = useCV();
  const { fontFamilyId, fontSizeLevel } = useFontSettings();
  const fontDef = getFontDefinition(fontFamilyId);

  return (
    <div
      className="cv-preview-content mx-auto w-full lg:w-[210mm] max-w-[210mm] bg-white md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.12)] dark:md:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.45)] print:shadow-none"
      style={{ fontFamily: fontDef.cssStack }}
    >
      <div
        className="md:flex md:flex-col md:min-h-[297mm]"
        style={fontSizeLevel !== 2 ? { fontSize: `${FONT_SIZE_LEVELS[fontSizeLevel]}em` } : undefined}
      >
        {renderTemplate(templateId)}
      </div>
    </div>
  );
}
