"use client";

import { CVPreview } from "./CVPreview";

export function CVEditor() {
  return (
    <main className="mx-auto max-w-7xl px-0 pt-0 pb-0 md:px-6 md:pt-4 md:pb-8 overflow-x-auto">
      <div className="flex justify-center">
        <div className="w-full md:w-auto cv-zoom">
          <CVPreview />
        </div>
      </div>
    </main>
  );
}
