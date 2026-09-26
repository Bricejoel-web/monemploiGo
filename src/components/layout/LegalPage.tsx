import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-14">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-black/70 dark:text-white/70">{children}</div>
    </div>
  );
}
