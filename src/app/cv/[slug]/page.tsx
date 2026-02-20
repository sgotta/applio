import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublishedCVServer } from "@/lib/supabase/db-server";
import { SharedCVContent } from "./shared-cv-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchPublishedCVServer(slug);
  if (!row) return { title: "CV not found" };

  const name = row.cv_data.personalInfo.fullName || "CV";
  const title = row.cv_data.personalInfo.title || "";
  const description = title ? `${name} — ${title}` : name;

  return {
    title: `${name} | Applio`,
    description,
    openGraph: {
      title: `${name} | Applio`,
      description,
      type: "profile",
    },
  };
}

export default async function SharedCVPage({ params }: Props) {
  const { slug } = await params;
  const row = await fetchPublishedCVServer(slug);
  if (!row) notFound();

  return (
    <SharedCVContent
      cvData={row.cv_data}
      settings={row.settings}
    />
  );
}
