import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

// Page « introuvable » de tout le site (voir `globalNotFound` dans
// next.config.ts). Elle ne connaît pas la langue de l'adresse demandée :
// elle est donc bilingue. Next.js y ajoute automatiquement `noindex` et
// renvoie un vrai statut 404.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Page introuvable — monemploiGo",
  description: "Cette page n'existe pas ou n'est plus disponible. This page does not exist or is no longer available.",
};

const LINK = "rounded-full px-5 py-2.5 text-sm font-semibold";

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#fbfaf8] px-6 py-16 text-center text-[#171512]">
        <Link href="/fr" className="text-2xl font-bold">
          monemploi<span className="text-[#eb5757]">Go</span>
        </Link>
        <p className="bg-gradient-to-r from-[#f2994a] to-[#eb5757] bg-clip-text text-6xl font-bold text-transparent">404</p>
        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="text-sm text-black/60">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
        <p className="text-sm text-black/60" lang="en">
          Page not found — this page does not exist or is no longer available.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/fr"className={`${LINK} bg-gradient-to-r from-[#f2994a] to-[#eb5757] text-white`}>
            Accueil
          </Link>
          <Link href="/fr/cv" className={`${LINK} border border-black/15 text-black/80`}>
            Modèles de CV
          </Link>
          <Link href="/en" lang="en" className={`${LINK} border border-black/15 text-black/80`}>
            English
          </Link>
        </div>
      </body>
    </html>
  );
}
