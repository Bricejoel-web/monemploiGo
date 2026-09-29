import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

/**
 * Fabrique un vrai fichier PDF à partir d'une page du site, rendue par un
 * Chrome sans écran (même moteur, même mise en page que l'aperçu).
 *
 * Pourquoi : le PDF était obtenu par la fenêtre d'impression du navigateur
 * du client. Dans les navigateurs intégrés (WhatsApp, Facebook, Gmail),
 * `window.print()` ne fait rien ; ailleurs, l'enregistrement pouvait
 * échouer (« Réessayer ») — un client qui venait de payer ne pouvait pas
 * récupérer son document. Ici le fichier est produit côté serveur et
 * simplement téléchargé. Le texte reste du vrai texte (lisible par les
 * logiciels ATS), pas une image.
 */

/** Hauteur d'une page A4 (297 mm) à 96 dpi, en pixels CSS. */
const A4_HEIGHT_PX = (297 / 25.4) * 96;

async function browserOptions(): Promise<{ executablePath: string; args: string[] }> {
  if (process.env.VERCEL) {
    // Chromium compressé prévu pour les fonctions serverless (Linux).
    const chromium = (await import("@sparticuz/chromium")).default;
    chromium.setGraphicsMode = false;
    return { executablePath: await chromium.executablePath(), args: chromium.args };
  }
  // Développement local : Chrome installé sur la machine.
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter((p): p is string => Boolean(p));
  const executablePath = candidates.find((p) => existsSync(p));
  if (!executablePath) throw new Error("Chrome introuvable : définir CHROME_EXECUTABLE_PATH pour le développement local.");
  return { executablePath, args: [] };
}

export async function renderPageToPdf(url: string, cookies: { name: string; value: string }[]): Promise<Uint8Array> {
  const { executablePath, args } = await browserOptions();
  const target = new URL(url);
  const browser = await puppeteer.launch({ executablePath, args, headless: true, defaultViewport: { width: 1000, height: 1400 } });
  try {
    // Cookies limités au site lui-même (session du client, et accès aux
    // prévisualisations protégées de Vercel) : jamais transmis ailleurs.
    if (cookies.length > 0) {
      await browser.setCookie(
        ...cookies.map((c) => ({ ...c, domain: target.hostname, path: "/", httpOnly: true, secure: target.protocol === "https:", sameSite: "Lax" as const })),
      );
    }
    const page = await browser.newPage();
    const response = await page.goto(target.toString(), { waitUntil: "networkidle0", timeout: 40_000 });
    // Une redirection (session expirée → connexion) ne doit jamais donner un PDF de la mauvaise page.
    if (!response?.ok() || new URL(page.url()).pathname !== target.pathname) {
      throw new Error(`page du document indisponible (HTTP ${response?.status() ?? "?"})`);
    }
    // Polices chargées, puis deux images d'animation : le recalcul de la
    // mise en page (useAdaptiveFill, après chargement des polices) est fait.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    // Arrondis de sous-pixel : un document d'une page peut dépasser la page
    // A4 d'une fraction de pixel ; Chrome renvoie alors sa dernière ligne,
    // seule, sur une 2e page. Si le dépassement est minime (< 2 % d'une
    // page), on réduit très légèrement le rendu pour qu'il tienne ; un
    // document réellement long garde ses pages suivantes.
    await page.emulateMediaType("print");
    const height = await page.evaluate(() => document.querySelector(".a4-print-root")?.getBoundingClientRect().height ?? 0);
    const pages = Math.max(1, Math.ceil(height / A4_HEIGHT_PX - 0.02));
    const scale = height > pages * A4_HEIGHT_PX ? (pages * A4_HEIGHT_PX - 1) / height : 1;
    // Format A4 et marges : fixés par la feuille de style d'impression (@page).
    return await page.pdf({ printBackground: true, preferCSSPageSize: true, scale });
  } finally {
    await browser.close();
  }
}
