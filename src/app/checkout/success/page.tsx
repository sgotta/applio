"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/editor");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Premium activated!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            All premium features are now unlocked. Enjoy!
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Redirecting in {countdown}s...</span>
        </div>
      </div>
    </div>
  );
}
