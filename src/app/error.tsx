"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
          Something went wrong
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
      </div>
    </div>
  );
}
