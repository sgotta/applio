import { Loader2 } from "lucide-react";

export default function SharedCVLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <p className="text-sm text-gray-400">Loading CV...</p>
      </div>
    </div>
  );
}
