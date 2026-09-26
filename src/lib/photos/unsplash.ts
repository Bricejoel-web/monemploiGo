import portraits from "@/data/photos/unsplash-portraits.json";

export type PortraitGroup =
  | "homme_noir"
  | "femme_noire"
  | "homme_metisse"
  | "femme_metisse"
  | "homme_blanc"
  | "femme_blanche";

export interface UnsplashPortrait {
  group: PortraitGroup;
  id: string;
  url: string;
  urlSmall: string;
  thumb: string;
  photographerName: string;
  photographerUrl: string;
  photoLinkHtml: string;
}

const UTM = "utm_source=monemploigo&utm_medium=referral";

export const curatedPortraits = portraits as UnsplashPortrait[];

/**
 * Choisit une photo de démonstration parmi le jeu curé (hommes/femmes,
 * noirs/blancs) pour illustrer les aperçus de modèles. `seed` fait varier
 * la photo choisie de façon stable d'un modèle à l'autre (même slug =
 * toujours la même photo).
 */
export function pickSamplePortrait(seed: number): UnsplashPortrait {
  const index = Math.abs(seed) % curatedPortraits.length;
  return curatedPortraits[index];
}

/** Récupère une photo précise du jeu curé par son identifiant Unsplash —
 * utilisé pour un choix éditorial fixe (ex. la photo du héros de l'accueil),
 * plutôt que la sélection pseudo-aléatoire de `pickSamplePortrait`. */
export function getPortraitById(id: string): UnsplashPortrait | undefined {
  return curatedPortraits.find((p) => p.id === id);
}

export function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

export function unsplashProfileLink(portrait: UnsplashPortrait): string {
  return `${portrait.photographerUrl}?${UTM}`;
}

export function unsplashSiteLink(): string {
  return `https://unsplash.com/?${UTM}`;
}
