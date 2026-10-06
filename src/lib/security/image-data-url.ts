/**
 * Image envoyée par le navigateur sous forme de data URL (photo de CV, logo
 * Pro) : seuls PNG, JPEG et WebP sont acceptés, et le contenu réel doit
 * correspondre au type annoncé (signature du fichier). Le SVG est refusé :
 * il peut contenir du code. Côté serveur uniquement (Buffer).
 */
const SIGNATURES: Record<string, (bytes: Buffer) => boolean> = {
  png: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpeg: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

/** Data URL valable et normalisée, ou null si elle doit être refusée. */
export function parseImageDataUrl(value: unknown, maxBytes: number): string | null {
  if (typeof value !== "string") return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;
  const [, type, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > maxBytes) return null;
  if (!SIGNATURES[type](bytes)) return null;
  return `data:image/${type};base64,${bytes.toString("base64")}`;
}
