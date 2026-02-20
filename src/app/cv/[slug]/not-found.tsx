import { AlertCircle, FileText } from "lucide-react";

export default function SharedCVNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-700 mb-2">
          CV not found
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          This CV doesn&apos;t exist or is no longer published.
        </p>
        <a
          href="/editor"
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <FileText className="h-4 w-4" />
          Create your CV
        </a>
      </div>
    </div>
  );
}
