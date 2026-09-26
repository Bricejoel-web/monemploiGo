"use client";

import { useAdaptiveFill } from "@/lib/cv/useAdaptiveFill";

/** Zone dont le contenu est agrandi (zoom) s'il est plus court que `targetHeight`,
 * pour occuper toute la page A4 au lieu de laisser un vide en bas. */
export function AdaptiveZone({
  targetHeight,
  children,
  style,
  deps = [],
  maxScale = 1.4,
}: {
  targetHeight: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  deps?: unknown[];
  maxScale?: number;
}) {
  const ref = useAdaptiveFill<HTMLDivElement>(targetHeight, deps, maxScale);
  return (
    <div ref={ref} style={{ transformOrigin: "top left", ...style }}>
      {children}
    </div>
  );
}
