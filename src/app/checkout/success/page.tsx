"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to editor after a short delay so the user sees the confirmation
    const timer = setTimeout(() => router.replace("/editor"), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-background text-foreground">
      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        ¡Pago confirmado!
      </h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        Tu plan Pro ya está activo. Te estamos redirigiendo al editor...
      </p>
    </div>
  );
}
