"use client";

import { useEffect } from "react";

export function PrintButton({ label }: { label: string }) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hide fixed right-6 top-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg"
    >
      {label}
    </button>
  );
}
