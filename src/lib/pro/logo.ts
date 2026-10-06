import { parseImageDataUrl } from "../security/image-data-url";

/**
 * Logo de la structure (espace Pro uniquement). Le navigateur le réduit à
 * 256 px avant l'envoi ; le serveur n'accepte qu'une image PNG, JPEG ou
 * WebP réelle, sous la taille maximale (voir image-data-url.ts).
 */
export const LOGO_SIZE_PX = 256;
export const LOGO_MAX_BYTES = 150_000;

/** Data URL valable et normalisée, ou null si elle doit être refusée. */
export function parseLogoDataUrl(value: unknown): string | null {
  return parseImageDataUrl(value, LOGO_MAX_BYTES);
}
