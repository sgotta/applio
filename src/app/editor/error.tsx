"use client";

import { AlertCircle, RotateCcw, HardDrive } from "lucide-react";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          The editor encountered an error
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {error.message || "Something went wrong while loading the editor."}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
          <HardDrive className="h-3.5 w-3.5" />
          <span>Your CV is saved locally in your browser.</span>
        </div>
        <button
          onClick={() => {
            reset();
            window.location.reload();
          }}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reload editor
        </button>
      </div>
    </div>
  );
}
