"use client";

import { CVPreview } from "./CVPreview";

export function CVEditor() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex justify-center">
        <div className="origin-top scale-110 mb-16">
          <CVPreview />
        </div>
      </div>
    </main>
  );
}
