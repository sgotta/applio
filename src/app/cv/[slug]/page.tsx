import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublishedCVBySlug } from "@/lib/actions/public";
import { SharedCVContent } from "./shared-cv-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchPublishedCVBySlug(slug);

  if (!result) {
    return { title: "CV not found" };
  }

  const name = result.cvData.personalInfo.fullName;
  const title = result.cvData.personalInfo.jobTitle;
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
  const result = await fetchPublishedCVBySlug(slug);

  if (!result) {
    notFound();
  }

  return <SharedCVContent cvData={result.cvData} settings={result.settings} />;
}
