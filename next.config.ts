import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' n'est nécessaire qu'en développement (React DevTools / Fast Refresh) ;
      // absent en production, où React n'utilise jamais eval().
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com",
      `connect-src 'self'${isDev ? " ws:" : ""}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Ne pas annoncer la technologie du site (en-tête X-Powered-By).
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname),
  },
  // Filet de sécurité pour la sauvegarde d'un CV avec photo : la photo est
  // compressée côté client (voir CvEditor.tsx, handlePhotoChange) mais on
  // relève quand même la limite par défaut (1 Mo) des Server Actions, pour
  // qu'un cas limite n'échoue plus jamais silencieusement.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Page 404 unique pour tout le site (src/app/global-not-found.tsx) : la
    // mise en page racine étant sous un segment de langue ([locale]), un
    // `not-found` classique n'est jamais utilisé — la page anglaise par
    // défaut de Next.js s'affichait. Solution prévue par Next.js pour ce cas.
    globalNotFound: true,
  },
  // PDF des documents (src/app/api/documents/[id]/pdf) : le binaire Chromium
  // compressé est lu à l'exécution, le traçage automatique ne le voit pas.
  outputFileTracingIncludes: {
    "/api/documents/*/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
