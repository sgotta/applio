import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared CV — Applio",
  description:
    "View a shared CV created with Applio, the free CV builder.",
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
